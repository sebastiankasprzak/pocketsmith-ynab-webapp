import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsService } from './cloudWatchLogsService';
import { SQSMonitoringService } from './sqsMonitoringService';
import { DynamoDbSyncStateService } from './dynamoDbSyncStateService';
import {
  SyncMonitoringResult,
  SyncStatus,
  ErrorResponse,
  SyncTriggerRequest,
  SyncTriggerResponse,
  TransactionFetcherPayload,
} from './types';
import { requireAuth, createAuthErrorResponse, AuthError } from './authUtils';

const logsService = new CloudWatchLogsService();
const sqsService = new SQSMonitoringService();
const dynamoDbService = new DynamoDbSyncStateService();
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
  'Content-Type': 'application/json'
};

function createResponse<T>(statusCode: number, data: T): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

function createErrorResponse(statusCode: number, code: string, message: string, details?: any): APIGatewayProxyResult {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
  
  return createResponse(statusCode, errorResponse);
}

/**
 * Get comprehensive sync status including logs and queue metrics
 */
async function handleSyncStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling sync status request for user: ${user.userId}`);

    // Get current sync status from logs
    const logStatus = await logsService.getCurrentSyncStatus();
    
    // Get queue metrics
    const [queueMetrics, deadLetterQueue, processingProgress] = await Promise.all([
      sqsService.getAllQueueMetrics(),
      sqsService.getDeadLetterQueueStatus(),
      sqsService.getProcessingProgress(),
    ]);

    // Combine queue depth with log status
    const mainQueueDepth = queueMetrics.find(q => q.queueName.includes('transactions'))?.approximateNumberOfMessages || 0;
    const queueAge = queueMetrics.find(q => q.queueName.includes('transactions'))?.approximateAgeOfOldestMessage;

    const syncStatus: SyncStatus = {
      ...logStatus,
      queueDepth: mainQueueDepth,
      queueAge,
    };

    // Get recent sync history
    const recentHistory = await logsService.getSyncHistory(24, 20);

    const result: SyncMonitoringResult = {
      currentStatus: syncStatus,
      queueMetrics,
      deadLetterQueue: deadLetterQueue || undefined,
      recentHistory,
      lastUpdated: new Date().toISOString(),
    };

    return createResponse(200, {
      ...result,
      processingProgress,
    });

  } catch (error: any) {
    console.error('Error handling sync status request:', error);
    
    if (error.name === 'AccessDenied') {
      return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to access CloudWatch logs or SQS');
    } else if (error.name === 'ResourceNotFoundException') {
      return createErrorResponse(404, 'RESOURCE_NOT_FOUND', 'Required AWS resources not found');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get sync status', error.message);
  }
}

/**
 * Get detailed sync history
 */
async function handleSyncHistory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling sync history request for user: ${user.userId}`);

    const hours = parseInt(event.queryStringParameters?.hours || '168', 10); // Default to 7 days (168 hours)
    const limit = parseInt(event.queryStringParameters?.limit || '200', 10); // Increase default limit further

    // Validate parameters
    if (hours < 1 || hours > 168) { // Max 1 week
      return createErrorResponse(400, 'INVALID_PARAMETER', 'Hours must be between 1 and 168');
    }

    if (limit < 1 || limit > 200) {
      return createErrorResponse(400, 'INVALID_PARAMETER', 'Limit must be between 1 and 200');
    }

    const history = await logsService.getSyncHistory(hours, limit);

    return createResponse(200, {
      history,
      parameters: {
        hours,
        limit,
        totalEntries: history.length,
      },
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling sync history request:', error);
    
    if (error.name === 'AccessDenied') {
      return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to access CloudWatch logs');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get sync history', error.message);
  }
}

/**
 * Get real-time sync progress for active operations
 */
async function handleSyncProgress(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling sync progress request for user: ${user.userId}`);

    const syncId = event.pathParameters?.syncId;
    if (!syncId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Sync ID is required');
    }

    // Get processing progress from SQS
    const processingProgress = await sqsService.getProcessingProgress();
    
    // Get recent logs for this sync operation
    const recentHistory = await logsService.getSyncHistory(1, 10);
    const currentSync = recentHistory.find(entry => entry.requestId === syncId);

    if (!currentSync) {
      return createErrorResponse(404, 'SYNC_NOT_FOUND', `Sync operation ${syncId} not found`);
    }

    return createResponse(200, {
      syncId,
      status: currentSync.status,
      progress: processingProgress,
      details: currentSync,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling sync progress request:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get sync progress', error.message);
  }
}

/**
 * Stream real-time log events (for WebSocket or Server-Sent Events)
 */
async function handleLogStream(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling log stream request for user: ${user.userId}`);

    const logGroup = event.queryStringParameters?.logGroup;
    const since = event.queryStringParameters?.since;

    if (!logGroup) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Log group parameter is required');
    }

    const startTime = since ? new Date(since) : new Date(Date.now() - 5 * 60 * 1000); // Default to last 5 minutes

    const events = await logsService.getRecentLogEvents(logGroup, startTime, new Date(), 100);

    return createResponse(200, {
      logGroup,
      events: events.map(event => ({
        timestamp: new Date(event.timestamp).toISOString(),
        message: event.message,
        eventId: event.eventId,
      })),
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling log stream request:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      return createErrorResponse(404, 'LOG_GROUP_NOT_FOUND', `Log group ${event.queryStringParameters?.logGroup} not found`);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to stream log events', error.message);
  }
}

/**
 * Trigger manual sync by invoking existing transaction fetcher Lambda
 */
async function handleSyncTrigger(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling sync trigger request for user: ${user.userId}`);

    // Parse request body
    let triggerRequest: SyncTriggerRequest = {};
    if (event.body) {
      try {
        triggerRequest = JSON.parse(event.body);
      } catch (parseError) {
        return createErrorResponse(400, 'INVALID_JSON', 'Invalid JSON in request body');
      }
    }

    // Validate date range if provided
    if (triggerRequest.dateRange) {
      const { startDate, endDate } = triggerRequest.dateRange;
      
      if (!startDate || !endDate) {
        return createErrorResponse(400, 'INVALID_DATE_RANGE', 'Both startDate and endDate are required when dateRange is specified');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return createErrorResponse(400, 'INVALID_DATE_FORMAT', 'Invalid date format. Use ISO date strings (YYYY-MM-DD)');
      }

      if (start >= end) {
        return createErrorResponse(400, 'INVALID_DATE_RANGE', 'Start date must be before end date');
      }

      // Limit date range to prevent excessive API calls
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        return createErrorResponse(400, 'DATE_RANGE_TOO_LARGE', 'Date range cannot exceed 90 days');
      }
    }

    // Check if sync is already in progress (unless force sync is enabled)
    if (!triggerRequest.forceSync) {
      const currentStatus = await logsService.getCurrentSyncStatus();
      if (currentStatus.status === 'running') {
        return createErrorResponse(409, 'SYNC_IN_PROGRESS', 'A sync operation is already in progress. Use forceSync=true to override.');
      }

      // Check queue depth
      const queueMetrics = await sqsService.getAllQueueMetrics();
      const mainQueueDepth = queueMetrics.find(q => q.queueName.includes('transactions'))?.approximateNumberOfMessages || 0;
      
      if (mainQueueDepth > 100) {
        return createErrorResponse(409, 'QUEUE_BUSY', `Transaction queue has ${mainQueueDepth} pending messages. Use forceSync=true to override.`);
      }
    }

    // Generate unique sync ID
    const syncId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get queue depth before triggering
    const queueMetrics = await sqsService.getAllQueueMetrics();
    const queueDepthBefore = queueMetrics.find(q => q.queueName.includes('transactions'))?.approximateNumberOfMessages || 0;

    // Prepare payload for existing transaction fetcher Lambda
    const payload: TransactionFetcherPayload = {
      triggered_by: 'manual',
      request_id: syncId,
      force_sync: triggerRequest.forceSync || false,
    };

    // Add date range if specified
    if (triggerRequest.dateRange) {
      payload.start_date = triggerRequest.dateRange.startDate;
      payload.end_date = triggerRequest.dateRange.endDate;
    }

    // Add account filters if specified
    if (triggerRequest.accountFilters && triggerRequest.accountFilters.length > 0) {
      payload.account_ids = triggerRequest.accountFilters;
    }

    console.log('Invoking transaction fetcher Lambda with payload:', JSON.stringify(payload, null, 2));

    // Invoke the existing transaction fetcher Lambda
    const invokeCommand = new InvokeCommand({
      FunctionName: 'dev-pocketsmith-transaction-fetcher',
      InvocationType: 'Event', // Asynchronous invocation
      Payload: JSON.stringify(payload),
    });

    try {
      const response = await lambdaClient.send(invokeCommand);
      
      if (response.StatusCode !== 202) {
        throw new Error(`Lambda invocation failed with status code: ${response.StatusCode}`);
      }

      console.log('Successfully triggered sync operation:', syncId);

      // Estimate duration based on date range and account filters
      let estimatedDuration = 60; // Base 1 minute
      if (triggerRequest.dateRange) {
        const start = new Date(triggerRequest.dateRange.startDate);
        const end = new Date(triggerRequest.dateRange.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        estimatedDuration += days * 5; // ~5 seconds per day
      }
      if (triggerRequest.accountFilters) {
        estimatedDuration += triggerRequest.accountFilters.length * 10; // ~10 seconds per account
      }

      const triggerResponse: SyncTriggerResponse = {
        syncId,
        status: 'triggered',
        message: 'Sync operation has been successfully triggered',
        estimatedDuration,
        queueDepthBefore,
        triggeredAt: new Date().toISOString(),
        parameters: {
          dateRange: triggerRequest.dateRange,
          accountFilters: triggerRequest.accountFilters,
          forceSync: triggerRequest.forceSync || false,
        },
      };

      return createResponse(202, triggerResponse);

    } catch (lambdaError: any) {
      console.error('Failed to invoke transaction fetcher Lambda:', lambdaError);
      
      if (lambdaError.name === 'ResourceNotFoundException') {
        return createErrorResponse(404, 'LAMBDA_NOT_FOUND', 'Transaction fetcher Lambda function not found');
      } else if (lambdaError.name === 'AccessDeniedException') {
        return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to invoke Lambda function');
      }
      
      return createErrorResponse(500, 'LAMBDA_INVOCATION_FAILED', 'Failed to trigger sync operation', lambdaError.message);
    }

  } catch (error: any) {
    console.error('Error handling sync trigger request:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to process sync trigger request', error.message);
  }
}

/**
 * Get sync state overview from DynamoDB
 */
async function handleSyncStateOverview(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling sync state overview request for user: ${user.userId}`);

    const overview = await dynamoDbService.getSyncStateOverview();

    return createResponse(200, {
      ...overview,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling sync state overview request:', error);
    
    if (error.name === 'AccessDenied') {
      return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to access DynamoDB');
    } else if (error.name === 'ResourceNotFoundException') {
      return createErrorResponse(404, 'RESOURCE_NOT_FOUND', 'DynamoDB sync state table not found');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get sync state overview', error.message);
  }
}

/**
 * Get detailed sync state for a specific account
 */
async function handleAccountSyncState(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling account sync state request for user: ${user.userId}`);

    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return createErrorResponse(400, 'MISSING_PARAMETER', 'Account ID is required');
    }

    const syncState = await dynamoDbService.getAccountSyncState(accountId);

    return createResponse(200, {
      account_id: accountId,
      sync_state: syncState,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling account sync state request:', error);
    
    if (error.name === 'AccessDenied') {
      return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to access DynamoDB');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get account sync state', error.message);
  }
}

/**
 * Get recent transaction activity from DynamoDB
 */
async function handleRecentActivity(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling recent activity request for user: ${user.userId}`);

    const hours = parseInt(event.queryStringParameters?.hours || '24', 10);
    
    // Validate hours parameter
    if (hours < 1 || hours > 168) { // Max 1 week
      return createErrorResponse(400, 'INVALID_PARAMETER', 'Hours must be between 1 and 168');
    }

    const recentActivity = await dynamoDbService.getRecentTransactionActivity(hours);

    return createResponse(200, {
      recent_activity: recentActivity,
      parameters: {
        hours,
      },
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling recent activity request:', error);
    
    if (error.name === 'AccessDenied') {
      return createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions to access DynamoDB');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to get recent activity', error.message);
  }
}

/**
 * Health check for monitoring infrastructure
 */
async function handleHealthCheck(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling health check request for user: ${user.userId}`);

    const [logGroupsExist, queuesExist] = await Promise.all([
      logsService.checkLogGroupsExist(),
      sqsService.checkQueuesExist(),
    ]);

    const allLogGroupsExist = Object.values(logGroupsExist).every(exists => exists);
    const allQueuesExist = Object.values(queuesExist).every(exists => exists);

    const healthy = allLogGroupsExist && allQueuesExist;

    return createResponse(healthy ? 200 : 503, {
      healthy,
      components: {
        logGroups: logGroupsExist,
        queues: queuesExist,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error handling health check request:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Health check failed', error.message);
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    const path = event.path;
    const method = event.httpMethod;
    
    // Route requests based on path
    if (path === '/sync/status' && method === 'GET') {
      return await handleSyncStatus(event);
    } else if (path === '/sync/history' && method === 'GET') {
      return await handleSyncHistory(event);
    } else if (path === '/sync/trigger' && method === 'POST') {
      return await handleSyncTrigger(event);
    } else if (path.startsWith('/sync/progress/') && method === 'GET') {
      return await handleSyncProgress(event);
    } else if (path === '/sync/logs/stream' && method === 'GET') {
      return await handleLogStream(event);
    } else if (path === '/sync/health' && method === 'GET') {
      return await handleHealthCheck(event);
    } else if (path === '/sync/state/overview' && method === 'GET') {
      return await handleSyncStateOverview(event);
    } else if (path.startsWith('/sync/state/account/') && method === 'GET') {
      return await handleAccountSyncState(event);
    } else if (path === '/sync/state/recent-activity' && method === 'GET') {
      return await handleRecentActivity(event);
    } else {
      return createErrorResponse(404, 'NOT_FOUND', `Path not found: ${method} ${path}`);
    }
  } catch (error: any) {
    // Handle authentication errors
    if (error.code && error.statusCode) {
      return createAuthErrorResponse(error as AuthError);
    }
    
    console.error('Unhandled error in Lambda handler:', error);
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error', error.message);
  }
};