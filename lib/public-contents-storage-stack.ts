import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface PublicContentsStorageStackProps extends cdk.StackProps {
  envName?: string; // Optional, defaults to 'stg' unless overridden
}

export class PublicContentsStorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: PublicContentsStorageStackProps) {
    const envName = process.env.BRANCH_NAME === 'prod' ? 'prod' : (props?.envName || 'stg');
    super(scope, id, props);

    // Create S3 bucket
    const bucket = new s3.Bucket(this, 'PublicContentsBucket', {
      bucketName: `takoyaki3-public-contents-bucket-${envName}`,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // adjust policy according to your need
      autoDeleteObjects: true // Useful during development, remove for production
    });

    // Create Lambda function
    const handlerLambda = new lambda.Function(this, 'PublicContentsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: bucket.bucketName
      },
      functionName: `tpcs-Handler-${envName}`,
    });

    // Create API Gateway and link it to the Lambda function
    const api = new apiGateway.RestApi(this, 'PublicContentsApi', {
      restApiName: `tpcs-PublicContentsApi-${envName}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: apiGateway.Cors.DEFAULT_HEADERS.concat(['Content-Type']),
        allowCredentials: true
      }
    });

    const contentResource = api.root.addResource('content');
    // Add POST method for uploads
    contentResource.addMethod('POST', new apiGateway.LambdaIntegration(handlerLambda, {
      proxy: true,
    }), {
      authorizationType: apiGateway.AuthorizationType.NONE,
      methodResponses: [{ statusCode: "200" }],
    });
  }
}
