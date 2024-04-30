import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface PublicContentsStorageStackProps extends cdk.StackProps {
  envName?: string; // Optional, defaults to 'stg' unless overridden
}

export class PublicContentsStorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: PublicContentsStorageStackProps) {
    // Ensure the envName is set based on the BRANCH_NAME environment variable or props
    const envName = process.env.BRANCH_NAME === 'prod' ? 'prod' : (props?.envName || 'stg');
    super(scope, id, props); // Correctly pass props to the base class

    // Create Lambda function
    const handlerLambda = new lambda.Function(this, 'PublicContentsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X, // Use a supported runtime, update as necessary
      code: lambda.Code.fromAsset('lambda'), // Ensure the path is correct and exists
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: process.env.BUCKET_NAME || 'public-contents-bucket',
        ACCESS_KEY_ID: process.env.ACCESS_KEY_ID || '',
        SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY || '',
        REGION: process.env.REGION || 'us-east-1',
      },
      functionName: `tpcs-Handler-${envName}`,
    });

    // Create API Gateway and link it to the Lambda function
    const api = new apiGateway.RestApi(this, 'PublicContentsApi', {
      restApiName: `tpcs-PublicContentsApi-${envName}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS, // Configure CORS if required
        allowMethods: apiGateway.Cors.ALL_METHODS
      }
    });

    const contentResource = api.root.addResource('content');
    contentResource.addMethod('GET', new apiGateway.LambdaIntegration(handlerLambda, {
      proxy: true,
    }));
  }
}
