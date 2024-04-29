import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface PublicContentsStorageStackProps extends cdk.StackProps {
  envName: string; // e.g. 'stg', 'prod'
}

export class PublicContentsStorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PublicContentsStorageStackProps) {
    super(scope, id, props);

    const bucketName = `public-contents-${props.envName.toLowerCase()}`;

    // Create S3 bucket
    const bucket = new s3.Bucket(this, 'PublicContentsBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
    });

    // Create Lambda function
    const handlerLambda = new lambda.Function(this, 'PublicContentsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Create API Gateway and link it to the Lambda function
    const api = new apiGateway.RestApi(this, 'PublicContentsApi', {
      restApiName: 'PublicContentsApi',
    });

    // Define a resource, e.g., a path part 'content'
    const contentResource = api.root.addResource('content');

    // Add GET method to the 'content' resource that invokes the Lambda function
    contentResource.addMethod('GET', new apiGateway.LambdaIntegration(handlerLambda, {
      proxy: true, // enables Lambda proxy integration
    }));

    // Grant permission to access S3 bucket
    bucket.grantReadWrite(handlerLambda);
  }
}
