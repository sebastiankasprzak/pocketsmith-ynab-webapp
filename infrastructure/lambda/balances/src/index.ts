import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParameterStoreService } from './parameterStoreService';
import { PocketSmithClient, YNABClient } from './apiClients';
import { CacheService } from './cacheService';
import { LambdaCache, CacheKeys } from './lambdaCache';
import { 
  BalanceComparison, 
  BalanceComparisonResult, 
  PocketSmithAccount, 
  YNABAccount,
  ErrorResponse 
} from './types';
import { requireAuth, createAuthErrorResponse, AuthError } from './authUtils';

const parameterStore = new ParameterStoreService();
const cacheService = new CacheService();
const lambdaCache = LambdaCache.getInstance();

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

function convertYNABBalanceToDecimal(milliunits: number): number {
  // YNAB stores balances in milliunits (1/1000 of currency unit)
  return milliunits / 1000;
}

function createBalanceComparison(
  psAccount: PocketSmithAccount,
  ynabAccount: YNABAccount,
  discrepancyThreshold: number = 0.01
): BalanceComparison {
  const ynabBalance = convertYNABBalanceToDecimal(ynabAccount.balance);
  const ynabClearedBalance = convertYNABBalanceToDecimal(ynabAccount.cleared_balance);
  const difference = Math.abs(psAccount.current_balance - ynabClearedBalance);
  
  // Handle both possible PocketSmith account name fields (prioritize title as it's the correct field)
  const accountName = psAccount.title || psAccount.name || `Account ${psAccount.id}`;
  
  return {
    pocketsmithAccountId: psAccount.id.toString(),
    pocketsmithAccountName: accountName,
    pocketsmithBalance: psAccount.current_balance,
    pocketsmithBalanceDate: psAccount.current_balance_date,
    ynabAccountId: ynabAccount.id,
    ynabAccountName: ynabAccount.name,
    ynabBalance: ynabClearedBalance, // Use cleared balance for comparison
    ynabClearedBalance,
    difference,
    currency: psAccount.currency_code,
    lastUpdated: new Date().toISOString(),
    hasDiscrepancy: difference > discrepancyThreshold,
    discrepancyThreshold
  };
}

async function fetchAccountData(userId: string, useCache: boolean = true): Promise<{
  pocketsmithAccounts: PocketSmithAccount[];
  ynabAccounts: YNABAccount[];
  fromCache: boolean;
}> {
  if (!useCache) {
    console.log('Cache disabled, fetching fresh data');
    return await fetchFreshAccountData(userId);
  }

  // Try Lambda cache first (faster than external cache service)
  return await lambdaCache.getOrFetch(
    `balance_accounts:${userId}`,
    () => fetchFreshAccountData(userId),
    300 // 5 minutes cache for balance data
  ).then(data => ({ ...data, fromCache: true }));
}

async function fetchFreshAccountData(userId: string): Promise<{
  pocketsmithAccounts: PocketSmithAccount[];
  ynabAccounts: YNABAccount[];
  fromCache: boolean;
}> {
  console.log('Fetching fresh balance data from APIs');

  // Fetch credentials (cache these too since they're used frequently)
  const [psApiKey, ynabApiKey, ynabBudgetId] = await Promise.all([
    lambdaCache.getOrFetch(`ps_api_key:${userId}`, () => parameterStore.getPocketSmithApiKey(), 1800),
    lambdaCache.getOrFetch(`ynab_api_key:${userId}`, () => parameterStore.getYNABApiKey(), 1800),
    lambdaCache.getOrFetch(`ynab_budget:${userId}`, () => parameterStore.getYNABBudgetId(), 1800)
  ]);

  // Create API clients
  const psClient = new PocketSmithClient(psApiKey);
  const ynabClient = new YNABClient(ynabApiKey, ynabBudgetId);

  // Fetch account data in parallel
  const [pocketsmithAccounts, ynabAccounts] = await Promise.all([
    psClient.getAccounts(),
    ynabClient.getAccounts()
  ]);

  // Also cache using the existing cache service for persistence
  try {
    const ttl = await cacheService.getCacheTTL();
    await cacheService.setCachedBalanceData(pocketsmithAccounts, ynabAccounts, ttl);
  } catch (error) {
    console.warn('Failed to update persistent cache:', error);
  }

  return {
    pocketsmithAccounts,
    ynabAccounts,
    fromCache: false
  };
}

async function handleBalanceComparison(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling balance comparison request for user: ${user.userId}`);

    const useCache = event.queryStringParameters?.cache !== 'false';
    const discrepancyThreshold = parseFloat(event.queryStringParameters?.threshold || '0.01');

    // Fetch account mappings and account data
    const [mappingConfig, accountData] = await Promise.all([
      lambdaCache.getOrFetch(
        CacheKeys.accountMappings(user.userId),
        () => parameterStore.getAccountMappings(),
        600 // 10 minutes cache for mappings
      ),
      fetchAccountData(user.userId, useCache)
    ]);

    const { pocketsmithAccounts, ynabAccounts, fromCache } = accountData;

    // Create lookup maps for efficient searching
    const psAccountMap = new Map(pocketsmithAccounts.map(acc => [acc.id.toString(), acc]));
    const ynabAccountMap = new Map(ynabAccounts.map(acc => [acc.id, acc]));

    const comparisons: BalanceComparison[] = [];
    const errors: Array<{ accountId: string; accountName: string; error: string }> = [];

    // Process each mapping
    for (const [psAccountId, ynabAccountId] of Object.entries(mappingConfig.mappings)) {
      const psAccount = psAccountMap.get(psAccountId);
      const ynabAccount = ynabAccountMap.get(ynabAccountId);

      if (!psAccount) {
        errors.push({
          accountId: psAccountId,
          accountName: 'Unknown PocketSmith Account',
          error: `PocketSmith account ${psAccountId} not found`
        });
        continue;
      }

      if (!ynabAccount) {
        errors.push({
          accountId: ynabAccountId,
          accountName: 'Unknown YNAB Account',
          error: `YNAB account ${ynabAccountId} not found`
        });
        continue;
      }

      // Skip closed YNAB accounts unless explicitly requested
      if (ynabAccount.closed && event.queryStringParameters?.includeClosed !== 'true') {
        continue;
      }

      const comparison = createBalanceComparison(psAccount, ynabAccount, discrepancyThreshold);
      comparisons.push(comparison);
    }

    // Calculate summary statistics
    const discrepancies = comparisons.filter(c => c.hasDiscrepancy).length;
    const totalDifference = comparisons.reduce((sum, c) => sum + c.difference, 0);

    const result: BalanceComparisonResult = {
      comparisons,
      summary: {
        totalMappings: comparisons.length,
        discrepancies,
        totalDifference: Math.round(totalDifference * 100) / 100, // Round to 2 decimal places
        lastUpdated: new Date().toISOString()
      },
      errors
    };

    return createResponse(200, {
      ...result,
      metadata: {
        fromCache,
        discrepancyThreshold,
        includeClosed: event.queryStringParameters?.includeClosed === 'true'
      }
    });

  } catch (error: any) {
    console.error('Error handling balance comparison request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'Required configuration not found in Parameter Store');
    } else if (error.message.includes('Invalid') && error.message.includes('API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to compare balances', error.message);
  }
}

async function handleBalanceRefresh(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Validate authentication
    const user = await requireAuth(event);
    console.log(`Handling balance refresh request for user: ${user.userId}`);

    // Clear both Lambda cache and persistent cache to force fresh data
    lambdaCache.invalidate(`.*:${user.userId}`);
    await cacheService.clearCache();

    // Fetch fresh data
    const accountData = await fetchAccountData(user.userId, false);

    return createResponse(200, {
      message: 'Balance data refreshed successfully',
      accountCounts: {
        pocketsmith: accountData.pocketsmithAccounts.length,
        ynab: accountData.ynabAccounts.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error handling balance refresh request:', error);
    
    if (error.message.includes('Parameter') && error.message.includes('not found')) {
      return createErrorResponse(404, 'PARAMETER_NOT_FOUND', 'Required configuration not found in Parameter Store');
    } else if (error.message.includes('Invalid') && error.message.includes('API key')) {
      return createErrorResponse(401, 'INVALID_API_KEY', error.message);
    } else if (error.message.includes('rate limit')) {
      return createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', error.message);
    } else if (error.message.includes('timed out')) {
      return createErrorResponse(408, 'REQUEST_TIMEOUT', error.message);
    }
    
    return createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to refresh balance data', error.message);
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
    if (path === '/balances/compare' && method === 'GET') {
      return await handleBalanceComparison(event);
    } else if (path === '/balances/refresh' && method === 'POST') {
      return await handleBalanceRefresh(event);
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