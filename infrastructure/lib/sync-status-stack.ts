import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

export class SyncStatusStack extends cdk.Stack {
  public readonly syncStatusTable: dynamodb.Table;
  public readonly syncEventBus: events.EventBus;
  public readonly webSocketApi: apigatewayv2.WebSocketApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for real-time sync status
    this.syncStatusTable = new dynamodb.Table(this, 'SyncStatusTable', {
      tableName: 'pocketsmith-ynab-sync-status',
      partitionKey: { name: 'syncId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global Secondary Index for querying by status
    this.syncStatusTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // EventBridge custom bus for sync events
    this.syncEventBus = new events.EventBus(this, 'SyncEventBus', {
      eventBusName: 'pocketsmith-ynab-sync-events',
    });

    // Lambda function to process sync events and update DynamoDB
    const eventProcessorFunction = new lambda.Function(this, 'SyncEventProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
        const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
        
        const dynamodb = new DynamoDBClient({});
        
        exports.handler = async (event) => {
          console.log('Processing sync event:', JSON.stringify(event, null, 2));
          
          const detail = event.detail;
          const syncId = detail.syncId;
          const timestamp = detail.timestamp;
          
          try {
            // Update DynamoDB
            const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
            
            const params = {
              TableName: process.env.SYNC_STATUS_TABLE,
              Item: {
                syncId: { S: syncId },
                timestamp: { S: timestamp },
                status: { S: detail.status },
                ttl: { N: ttl.toString() }
              }
            };
            
            // Add additional fields based on event type
            if (detail.progress) {
              params.Item.progress = { S: JSON.stringify(detail.progress) };
            }
            
            if (detail.finalStats) {
              params.Item.finalStats = { S: JSON.stringify(detail.finalStats) };
            }
            
            if (detail.error) {
              params.Item.error = { S: JSON.stringify(detail.error) };
            }
            
            if (detail.metadata) {
              params.Item.metadata = { S: JSON.stringify(detail.metadata) };
            }
            
            await dynamodb.send(new PutItemCommand(params));
            
            // TODO: Send WebSocket notifications to connected clients
            // This would require connection management and user subscriptions
            
            console.log('Successfully processed sync event');
          } catch (error) {
            console.error('Error processing sync event:', error);
            throw error;
          }
        };
      `),
      environment: {
        SYNC_STATUS_TABLE: this.syncStatusTable.tableName,
      },
    });

    // Grant permissions to the event processor
    this.syncStatusTable.grantWriteData(eventProcessorFunction);

    // EventBridge rule to trigger the processor
    new events.Rule(this, 'SyncEventRule', {
      eventBus: this.syncEventBus,
      eventPattern: {
        source: ['pocketsmith-ynab-sync'],
        detailType: ['Sync Status Update', 'Sync Progress', 'Sync Error'],
      },
      targets: [new targets.LambdaFunction(eventProcessorFunction)],
    });

    // WebSocket API for real-time updates (basic setup)
    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'SyncWebSocketApi', {
      routeSelectionExpression: '$request.body.action',
    });

    // Connection management Lambda
    const connectionHandler = new lambda.Function(this, 'WebSocketConnectionHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('WebSocket event:', JSON.stringify(event, null, 2));
          
          const { requestContext } = event;
          const { connectionId, routeKey } = requestContext;
          
          switch (routeKey) {
            case '$connect':
              console.log('Client connected:', connectionId);
              // TODO: Store connection in DynamoDB
              break;
            case '$disconnect':
              console.log('Client disconnected:', connectionId);
              // TODO: Remove connection from DynamoDB
              break;
            case 'subscribe':
              console.log('Client subscribing:', connectionId);
              // TODO: Handle subscription to specific sync IDs
              break;
          }
          
          return { statusCode: 200 };
        };
      `),
    });

    // Add routes to WebSocket API
    this.webSocketApi.addRoute('$connect', {
      integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectionHandler),
    });

    this.webSocketApi.addRoute('$disconnect', {
      integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', connectionHandler),
    });

    this.webSocketApi.addRoute('subscribe', {
      integration: new integrations.WebSocketLambdaIntegration('SubscribeIntegration', connectionHandler),
    });

    // Deploy WebSocket API
    new apigatewayv2.WebSocketStage(this, 'SyncWebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Output important values
    new cdk.CfnOutput(this, 'SyncStatusTableName', {
      value: this.syncStatusTable.tableName,
      description: 'DynamoDB table for sync status',
    });

    new cdk.CfnOutput(this, 'SyncEventBusName', {
      value: this.syncEventBus.eventBusName,
      description: 'EventBridge bus for sync events',
    });

    new cdk.CfnOutput(this, 'WebSocketApiEndpoint', {
      value: this.webSocketApi.apiEndpoint,
      description: 'WebSocket API endpoint for real-time updates',
    });
  }
}