import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface InfrastructureStackProps extends cdk.StackProps {
  environment: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunctions: lambda.Function[];
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const environment = props.environment;

    // S3 bucket for hosting the React webapp
    const webappBucket = new s3.Bucket(this, 'WebappBucket', {
      bucketName: `pocketsmith-ynab-webapp-${environment}-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront distribution for global CDN
    const distribution = new cloudfront.Distribution(this, 'WebappDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webappBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing
        },
      ],
    });

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'WebappUserPool', {
      userPoolName: `pocketsmith-ynab-webapp-users-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Domain
    const userPoolDomain = new cognito.UserPoolDomain(this, 'WebappUserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: `pocketsmith-ynab-webapp-${environment}-${this.account}`,
      },
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'WebappUserPoolClient', {
      userPool,
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true, // Enable admin auth flow
      },
      generateSecret: false, // For SPA
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(8), // Increased from 1 hour to 8 hours
      idTokenValidity: cdk.Duration.hours(8), // Increased from 1 hour to 8 hours
      preventUserExistenceErrors: true, // Security best practice
      enableTokenRevocation: true, // Enable token revocation
      // Remove OAuth configuration to simplify authentication
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // API Gateway for webapp backend
    const api = new apigateway.RestApi(this, 'WebappApi', {
      restApiName: 'PocketSmith-YNAB Webapp API',
      description: 'API for PocketSmith-YNAB sync webapp',
      deployOptions: {
        stageName: environment,
        description: `${environment} stage deployment`,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // IAM role for Lambda functions with Parameter Store access
    const lambdaRole = new iam.Role(this, 'WebappLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        ParameterStoreAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:PutParameter',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/pocketsmith-ynab-sync/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                'logs:FilterLogEvents',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sqs:GetQueueAttributes',
                'sqs:ReceiveMessage',
                'sqs:SendMessage',
              ],
              resources: ['*'], // Will be restricted to specific queues in production
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:InvokeFunction',
              ],
              resources: [
                `arn:aws:lambda:${this.region}:${this.account}:function:dev-pocketsmith-transaction-*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:Scan',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:BatchGetItem',
              ],
              resources: [
                `arn:aws:dynamodb:${this.region}:${this.account}:table/dev-pocketsmith-ynab-sync-state`,
              ],
            }),
          ],
        }),
      },
    });

    // Parameter Store Lambda function
    const parameterStoreLambda = new lambda.Function(this, 'ParameterStoreLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers.handler',
      role: lambdaRole,
      code: lambda.Code.fromAsset('lambda/parameter-store/dist'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      }
    });

    // Lambda functions for webapp backend
    const accountsLambda = new lambda.Function(this, 'AccountsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromAsset('lambda/accounts/dist'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      }
    });

    const syncLambda = new lambda.Function(this, 'SyncLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromAsset('lambda/sync-monitoring/dist'),
      timeout: cdk.Duration.seconds(60), // Increased timeout for CloudWatch operations
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        SYNC_STATE_TABLE_NAME: 'dev-pocketsmith-ynab-sync-state'
      }
    });

    const balancesLambda = new lambda.Function(this, 'BalancesLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromAsset('lambda/balances/dist'),
      timeout: cdk.Duration.seconds(60), // Increased timeout for API calls
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      }
    });

    // API Gateway resource structure
    const accountsResource = api.root.addResource('accounts');
    const pocketsmithAccountsResource = accountsResource.addResource('pocketsmith');
    const ynabAccountsResource = accountsResource.addResource('ynab');

    const mappingsResource = api.root.addResource('mappings');
    const mappingIdResource = mappingsResource.addResource('{id}');
    const mappingsValidateResource = mappingsResource.addResource('validate');

    const credentialsResource = api.root.addResource('credentials');
    const credentialsValidateResource = credentialsResource.addResource('validate');

    const syncResource = api.root.addResource('sync');
    const syncStatusResource = syncResource.addResource('status');
    const syncHistoryResource = syncResource.addResource('history');
    const syncTriggerResource = syncResource.addResource('trigger');
    const syncProgressResource = syncResource.addResource('progress');
    const syncProgressIdResource = syncProgressResource.addResource('{syncId}');
    const syncLogsResource = syncResource.addResource('logs');
    const syncLogsStreamResource = syncLogsResource.addResource('stream');
    const syncHealthResource = syncResource.addResource('health');
    
    // DynamoDB sync state endpoints
    const syncStateResource = syncResource.addResource('state');
    const syncStateOverviewResource = syncStateResource.addResource('overview');
    const syncStateAccountResource = syncStateResource.addResource('account');
    const syncStateAccountIdResource = syncStateAccountResource.addResource('{accountId}');
    const syncStateRecentActivityResource = syncStateResource.addResource('recent-activity');

    // Add a health check endpoint that doesn't require authentication
    const healthResource = api.root.addResource('health');

    const balancesResource = api.root.addResource('balances');
    const balancesCompareResource = balancesResource.addResource('compare');
    const balancesRefreshResource = balancesResource.addResource('refresh');

    // Create Cognito authorizer for API Gateway
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'WebappAuthorizer',
      identitySource: 'method.request.header.Authorization',
      // Ensure the authorizer validates tokens from our specific client
      resultsCacheTtl: cdk.Duration.minutes(5)
    });

    // API Gateway integrations
    const parameterStoreIntegration = new apigateway.LambdaIntegration(parameterStoreLambda);
    const accountsIntegration = new apigateway.LambdaIntegration(accountsLambda);
    const syncIntegration = new apigateway.LambdaIntegration(syncLambda);
    const balancesIntegration = new apigateway.LambdaIntegration(balancesLambda);

    // Parameter Store endpoints (mappings and credentials) - require authentication
    mappingsResource.addMethod('GET', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    mappingsResource.addMethod('POST', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    mappingsResource.addMethod('DELETE', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    
    // Mappings validation endpoint
    mappingsValidateResource.addMethod('POST', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    
    // Individual mapping endpoints with ID parameter
    mappingIdResource.addMethod('GET', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    mappingIdResource.addMethod('PUT', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    mappingIdResource.addMethod('DELETE', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    credentialsResource.addMethod('GET', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    credentialsValidateResource.addMethod('GET', parameterStoreIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // Account endpoints - require authentication
    pocketsmithAccountsResource.addMethod('GET', accountsIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    ynabAccountsResource.addMethod('GET', accountsIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // Sync endpoints - require authentication
    syncStatusResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncHistoryResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncTriggerResource.addMethod('POST', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncProgressIdResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncLogsStreamResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncHealthResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    
    // DynamoDB sync state endpoints - require authentication
    syncStateOverviewResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncStateAccountIdResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    syncStateRecentActivityResource.addMethod('GET', syncIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // Balance endpoints - require authentication
    balancesCompareResource.addMethod('GET', balancesIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });
    balancesRefreshResource.addMethod('POST', balancesIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // Add health check endpoint without authentication
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'"
        },
        responseTemplates: {
          'application/json': JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: environment
          })
        }
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': false,
          'method.response.header.Access-Control-Allow-Headers': false,
          'method.response.header.Access-Control-Allow-Methods': false
        },
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL
        }
      }]
    });



    // Add Gateway Responses for CORS on error responses
    api.addGatewayResponse('UnauthorizedResponse', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
      },
    });

    api.addGatewayResponse('ForbiddenResponse', {
      type: apigateway.ResponseType.ACCESS_DENIED,
      statusCode: '403',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
      },
    });

    api.addGatewayResponse('DefaultResponse', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
      },
    });

    api.addGatewayResponse('Default5XXResponse', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'OPTIONS,GET,POST,PUT,DELETE'",
      },
    });

    // Assign public properties for monitoring stack
    this.api = api;
    this.lambdaFunctions = [parameterStoreLambda, accountsLambda, syncLambda, balancesLambda];
    this.distribution = distribution;

    // Output important values
    new cdk.CfnOutput(this, 'WebappBucketName', {
      value: webappBucket.bucketName,
      description: 'S3 bucket name for webapp hosting',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebAppUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'WebApp URL',
    });
  }
}
