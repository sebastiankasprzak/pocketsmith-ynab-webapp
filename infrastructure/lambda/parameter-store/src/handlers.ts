import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParameterStoreServiceImpl } from './parameterStoreService';
import { ExistingAccountMappingConfig } from './types';
import { requireAuth, createAuthErrorResponse, AuthError } from './authUtils';

const parameterStoreService = new ParameterStoreServiceImpl();

// Helper function to create API Gateway response
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

// Handler for GET /mappings - fetch current account mappings
export const getMappingsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Getting account mappings from Parameter Store for user: ${user.userId}`);
    
    const accountMapping = await parameterStoreService.getAccountMapping();
    
    return createResponse(200, {
      success: true,
      data: accountMapping
    });
  } catch (error) {
    console.error('Error getting account mappings:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to retrieve account mappings',
      details: (error as Error).message
    });
  }
};

// Handler for POST /mappings - update account mappings
export const updateMappingsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Updating account mappings for user: ${user.userId}`);
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required'
      });
    }

    const requestBody = JSON.parse(event.body);
    
    // Validate the request body structure
    if (!requestBody.mappings || typeof requestBody.mappings !== 'object') {
      return createResponse(400, {
        success: false,
        error: 'Invalid request body: mappings object is required'
      });
    }

    // Ensure strict_mode is a boolean
    const config: ExistingAccountMappingConfig = {
      mappings: requestBody.mappings,
      default_account_id: requestBody.default_account_id,
      strict_mode: Boolean(requestBody.strict_mode),
      created_at: requestBody.created_at,
      auto_generated: Boolean(requestBody.auto_generated)
    };

    console.log('Updating account mappings in Parameter Store:', config);
    
    await parameterStoreService.updateAccountMapping(config);
    
    return createResponse(200, {
      success: true,
      message: 'Account mappings updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating account mappings:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to update account mappings',
      details: (error as Error).message
    });
  }
};

// Handler for GET /credentials/validate - validate API credentials
export const validateCredentialsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Validating API credentials from Parameter Store for user: ${user.userId}`);
    
    const validationResult = await parameterStoreService.validateCredentials();
    
    return createResponse(200, {
      success: true,
      data: validationResult
    });
  } catch (error) {
    console.error('Error validating credentials:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to validate credentials',
      details: (error as Error).message
    });
  }
};

// Handler for POST /mappings/validate - validate account mappings
export const validateMappingsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Validating account mappings for user: ${user.userId}`);
    
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required'
      });
    }

    const requestBody = JSON.parse(event.body);
    
    // Validate the request body structure
    if (!requestBody.mappings || !Array.isArray(requestBody.mappings)) {
      return createResponse(400, {
        success: false,
        error: 'Invalid request body: mappings array is required'
      });
    }

    // For now, return a simple validation (this can be enhanced later)
    // In a real implementation, you might validate against actual PocketSmith/YNAB accounts
    const errors: string[] = [];
    
    // Basic validation - check for duplicate mappings
    const pocketsmithIds = new Set();
    const ynabIds = new Set();
    
    requestBody.mappings.forEach((mapping: any, index: number) => {
      if (!mapping.pocketsmithAccountId || !mapping.ynabAccountId) {
        errors.push(`Mapping ${index + 1}: Both PocketSmith and YNAB account IDs are required`);
      }
      
      if (pocketsmithIds.has(mapping.pocketsmithAccountId)) {
        errors.push(`Mapping ${index + 1}: PocketSmith account ${mapping.pocketsmithAccountId} is already mapped`);
      }
      
      if (ynabIds.has(mapping.ynabAccountId)) {
        errors.push(`Mapping ${index + 1}: YNAB account ${mapping.ynabAccountId} is already mapped`);
      }
      
      pocketsmithIds.add(mapping.pocketsmithAccountId);
      ynabIds.add(mapping.ynabAccountId);
    });
    
    return createResponse(200, {
      success: true,
      data: {
        valid: errors.length === 0,
        errors
      }
    });
  } catch (error) {
    console.error('Error validating mappings:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to validate mappings',
      details: (error as Error).message
    });
  }
};

// Handler for GET /credentials - get credentials (without exposing actual values)
export const getCredentialsInfoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Getting credentials info from Parameter Store for user: ${user.userId}`);
    
    const credentials = await parameterStoreService.getCredentials();
    
    // Return info about credentials without exposing actual values
    return createResponse(200, {
      success: true,
      data: {
        pocketsmithApiKey: credentials.pocketsmithApiKey ? '***configured***' : 'missing',
        ynabApiKey: credentials.ynabApiKey ? '***configured***' : 'missing',
        ynabBudgetId: credentials.ynabBudgetId ? '***configured***' : 'missing'
      }
    });
  } catch (error) {
    console.error('Error getting credentials info:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to retrieve credentials info',
      details: (error as Error).message
    });
  }
};

// Handler for GET /mappings/{id} - get specific mapping
export const getMappingByIdHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    const mappingId = event.pathParameters?.id;
    
    if (!mappingId) {
      return createResponse(400, {
        success: false,
        error: 'Mapping ID is required'
      });
    }
    
    console.log(`Getting mapping ${mappingId} from Parameter Store for user: ${user.userId}`);
    
    const accountMapping = await parameterStoreService.getAccountMapping();
    const specificMapping = accountMapping.mappings[mappingId];
    
    if (!specificMapping) {
      return createResponse(404, {
        success: false,
        error: 'Mapping not found'
      });
    }
    
    return createResponse(200, {
      success: true,
      data: {
        id: mappingId,
        mapping: specificMapping
      }
    });
  } catch (error) {
    console.error('Error getting mapping by ID:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to retrieve mapping',
      details: (error as Error).message
    });
  }
};

// Handler for DELETE /mappings/{id} - delete specific mapping
export const deleteMappingByIdHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    const mappingId = event.pathParameters?.id;
    
    if (!mappingId) {
      return createResponse(400, {
        success: false,
        error: 'Mapping ID is required'
      });
    }
    
    console.log(`Deleting mapping ${mappingId} from Parameter Store for user: ${user.userId}`);
    
    const accountMapping = await parameterStoreService.getAccountMapping();
    
    if (!accountMapping.mappings[mappingId]) {
      return createResponse(404, {
        success: false,
        error: 'Mapping not found'
      });
    }
    
    // Remove the mapping
    delete accountMapping.mappings[mappingId];
    
    // Update the account mapping in Parameter Store
    await parameterStoreService.updateAccountMapping(accountMapping);
    
    return createResponse(200, {
      success: true,
      message: 'Mapping deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mapping by ID:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to delete mapping',
      details: (error as Error).message
    });
  }
};

// Handler for PUT /mappings/{id} - update specific mapping
export const updateMappingByIdHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    const mappingId = event.pathParameters?.id;
    
    if (!mappingId) {
      return createResponse(400, {
        success: false,
        error: 'Mapping ID is required'
      });
    }
    
    if (!event.body) {
      return createResponse(400, {
        success: false,
        error: 'Request body is required'
      });
    }
    
    const requestBody = JSON.parse(event.body);
    
    console.log(`Updating mapping ${mappingId} for user: ${user.userId}`);
    
    const accountMapping = await parameterStoreService.getAccountMapping();
    
    // Update the specific mapping
    accountMapping.mappings[mappingId] = requestBody;
    
    // Update the account mapping in Parameter Store
    await parameterStoreService.updateAccountMapping(accountMapping);
    
    return createResponse(200, {
      success: true,
      message: 'Mapping updated successfully',
      data: {
        id: mappingId,
        mapping: requestBody
      }
    });
  } catch (error) {
    console.error('Error updating mapping by ID:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Failed to update mapping',
      details: (error as Error).message
    });
  }
};

// Main router handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Parameter Store Lambda Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight' });
  }

  const path = event.path;
  const method = event.httpMethod;

  try {
    // Route to appropriate handler based on path and method
    if (path === '/mappings' && method === 'GET') {
      return await getMappingsHandler(event);
    } else if (path === '/mappings' && method === 'POST') {
      return await updateMappingsHandler(event);
    } else if (path.startsWith('/mappings/') && method === 'GET') {
      return await getMappingByIdHandler(event);
    } else if (path.startsWith('/mappings/') && method === 'PUT') {
      return await updateMappingByIdHandler(event);
    } else if (path.startsWith('/mappings/') && method === 'DELETE') {
      return await deleteMappingByIdHandler(event);
    } else if (path === '/mappings/validate' && method === 'POST') {
      return await validateMappingsHandler(event);
    } else if (path === '/credentials/validate' && method === 'GET') {
      return await validateCredentialsHandler(event);
    } else if (path === '/credentials' && method === 'GET') {
      return await getCredentialsInfoHandler(event);
    } else {
      return createResponse(404, {
        success: false,
        error: 'Endpoint not found',
        path,
        method
      });
    }
  } catch (error: any) {
    // Handle authentication errors
    if (error.code && error.statusCode) {
      return createAuthErrorResponse(error as AuthError);
    }
    
    console.error('Unhandled error in Parameter Store Lambda:', error);
    
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    });
  }
};