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
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
          allowedHeaders: ['*'],
          maxAge: 3000
        }
      ]
    });

    // Create Lambda function
    const handlerLambda = new lambda.Function(this, 'PublicContentsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
        REGION: 'ap-northeast-1',
      },
      functionName: `tpcs-Handler-${envName}`,
    });

    // Create API Gateway and link it to the Lambda function
    const api = new apiGateway.RestApi(this, 'PublicContentsApi', {
      restApiName: `tpcs-PublicContentsApi-${envName}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: apiGateway.Cors.DEFAULT_HEADERS.concat(['Custom-Header']),
        allowCredentials: true
      }
    });

    const contentResource = api.root.addResource('content');
    contentResource.addMethod('GET', new apiGateway.LambdaIntegration(handlerLambda, {
      proxy: true,
    }), {
      authorizationType: apiGateway.AuthorizationType.NONE,
      methodResponses: [{ statusCode: "200" }], // Define method responses
    });

    // Grant read/write access to the Lambda function
    bucket.grantReadWrite(handlerLambda);
    bucket.grantPut(handlerLambda);
  }
}
