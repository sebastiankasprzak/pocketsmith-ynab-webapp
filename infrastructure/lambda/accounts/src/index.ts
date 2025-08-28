import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParameterStoreService } from './parameterStoreService';
import { PocketSmithClient } from './pocketsmithClient';
import { YNABClient } from './ynabClient';
import { APIResponse, ErrorResponse } from './types';
import { requireAuth, createAuthErrorResponse, AuthError } from './authUtils';

const parameterStore = new ParameterStoreService();

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

async function handlePocketSmithAccounts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling PocketSmith accounts request for user: ${user.userId}`);
    
    const apiKey = await parameterStore.getPocketSmithApiKey();
    const client = new PocketSmithClient(apiKey);
    
    const accounts = await client.getAccounts();
    
    return createResponse(200, {
      accounts,
      count: accounts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error handling PocketSmith accounts request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'PocketSmith API key not configured in Parameter Store');
    } else if (error.message.includes('Invalid PocketSmith API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch PocketSmith accounts', error.message);
  }
}

async function handleYNABAccounts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling YNAB accounts request for user: ${user.userId}`);
    
    const [apiKey, budgetId] = await Promise.all([
      parameterStore.getYNABApiKey(),
      parameterStore.getYNABBudgetId()
    ]);
    
    const client = new YNABClient(apiKey, budgetId);
    
    const accounts = await client.getAccounts();
    
    return createResponse(200, {
      accounts,
      count: accounts.length,
      budgetId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error handling YNAB accounts request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'YNAB API credentials not configured in Parameter Store');
    } else if (error.message.includes('Invalid YNAB API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('budget not found')) {
      return createErrorResponse(404, 'BUDGET_NOT_FOUND', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch YNAB accounts', error.message);
  }
}

async function handleYNABBudgets(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling YNAB budgets request for user: ${user.userId}`);
    
    const apiKey = await parameterStore.getYNABApiKey();
    
    // Create client without budget ID since we're listing all budgets
    const client = new YNABClient(apiKey, '');
    
    const budgets = await client.getBudgets();
    
    return createResponse(200, {
      budgets,
      count: budgets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error handling YNAB budgets request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'YNAB API key not configured in Parameter Store');
    } else if (error.message.includes('Invalid YNAB API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch YNAB budgets', error.message);
  }
}

async function handleUpdateYNABBudgetId(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling YNAB budget ID update request for user: ${user.userId}`);
    
    if (!event.body) {
      return createErrorResponse(400, 'MISSING_BODY', 'Request body is required');
    }
    
    const { budgetId } = JSON.parse(event.body);
    
    if (!budgetId || typeof budgetId !== 'string') {
      return createErrorResponse(400, 'INVALID_BUDGET_ID', 'Budget ID is required and must be a string');
    }
    
    // Validate that the budget ID exists and is accessible
    const apiKey = await parameterStore.getYNABApiKey();
    const client = new YNABClient(apiKey, budgetId);
    
    // Test access to the budget
    const isValid = await client.validateBudgetAccess();
    if (!isValid) {
      return createErrorResponse(404, 'BUDGET_NOT_FOUND', 'The specified budget ID is not accessible or does not exist');
    }
    
    // Update the budget ID in parameter store
    await parameterStore.updateYNABBudgetId(budgetId);
    
    return createResponse(200, {
      success: true,
      budgetId,
      message: 'YNAB budget ID updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error handling YNAB budget ID update request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'YNAB API key not configured in Parameter Store');
    } else if (error.message.includes('Invalid YNAB API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('budget not found')) {
      return createErrorResponse(404, 'BUDGET_NOT_FOUND', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to update YNAB budget ID', error.message);
  }
}

async function handleCredentialsValidation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling credentials validation request for user: ${user.userId}`);
    
    const service = event.queryStringParameters?.service;
    
    if (!service || (service !== 'pocketsmith' && service !== 'ynab')) {
      return createErrorResponse(400, 'INVALID_SERVICE', 'Service parameter must be "pocketsmith" or "ynab"');
    }
    
    if (service === 'pocketsmith') {
      const apiKey = await parameterStore.getPocketSmithApiKey();
      const client = new PocketSmithClient(apiKey);
      const isValid = await client.validateApiKey();
      
      return createResponse(200, {
        service: 'pocketsmith',
        valid: isValid,
        timestamp: new Date().toISOString()
      });
    } else {
      const [apiKey, budgetId] = await Promise.all([
        parameterStore.getYNABApiKey(),
        parameterStore.getYNABBudgetId()
      ]);
      
      const client = new YNABClient(apiKey, budgetId);
      const [keyValid, budgetValid] = await Promise.all([
        client.validateApiKey(),
        client.validateBudgetAccess()
      ]);
      
      return createResponse(200, {
        service: 'ynab',
        valid: keyValid && budgetValid,
        details: {
          apiKeyValid: keyValid,
          budgetAccessValid: budgetValid,
          budgetId
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Error handling credentials validation request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'API credentials not configured in Parameter Store');
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to validate credentials', error.message);
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Authorization header:', event.headers.Authorization || event.headers.authorization);
  console.log('Cognito User Pool ID:', process.env.COGNITO_USER_POOL_ID);
  console.log('Cognito Client ID:', process.env.COGNITO_USER_POOL_CLIENT_ID);
  
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
    if (path === '/accounts/pocketsmith' && method === 'GET') {
      return await handlePocketSmithAccounts(event);
    } else if (path === '/accounts/ynab' && method === 'GET') {
      return await handleYNABAccounts(event);
    } else if (path === '/budgets/ynab' && method === 'GET') {
      return await handleYNABBudgets(event);
    } else if (path === '/budgets/ynab/update' && method === 'POST') {
      return await handleUpdateYNABBudgetId(event);
    } else if (path === '/credentials/validate' && method === 'GET') {
      return await handleCredentialsValidation(event);
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