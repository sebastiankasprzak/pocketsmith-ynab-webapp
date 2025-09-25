# Balance Comparison Page Troubleshooting Guide

## Issue Summary
The balance-comparison page is not displaying any data in the staging environment.

## Root Cause Analysis

### 1. API Gateway Returns 403 Forbidden
All API endpoints (including the health check) are returning 403 Forbidden instead of the expected responses:
- Health endpoint should return 200 OK without authentication
- Protected endpoints should return 401 Unauthorized when no auth token is provided
- 403 Forbidden suggests an API Gateway configuration issue

### 2. Potential Causes

#### A. Cognito Authorizer Configuration Issue
The Cognito authorizer might be misconfigured or the user pool settings are incorrect.

#### B. API Gateway Deployment Issue
The API Gateway might not have been properly deployed with the latest configuration.

#### C. Lambda Function Permissions
Lambda functions might not have the correct permissions to be invoked by API Gateway.

#### D. Missing Account Mappings
Even if the API works, balance comparison requires account mappings to be configured first.

## Troubleshooting Steps

### Step 1: Verify API Gateway Deployment

```bash
# Navigate to infrastructure directory
cd infrastructure

# Check current CDK diff
npx cdk diff

# If there are changes, deploy them
npx cdk deploy --require-approval never
```

### Step 2: Check CloudWatch Logs

1. Go to AWS CloudWatch Console
2. Navigate to Log Groups
3. Look for logs related to:
   - `/aws/lambda/PocketSmithYnabSyncStack-staging-BalancesLambda-*`
   - `/aws/apigateway/PocketSmithYnabSyncStack-staging-*`

### Step 3: Test Authentication Flow

1. Open the webapp in staging
2. Try to sign in with Cognito
3. Check browser developer tools for:
   - Network tab: API request/response details
   - Console tab: JavaScript errors
   - Application tab: Local storage for auth tokens

### Step 4: Verify Cognito Configuration

Check that the following environment variables match the deployed Cognito resources:
- `VITE_COGNITO_USER_POOL_ID=ap-southeast-2_56erWzWed`
- `VITE_COGNITO_USER_POOL_CLIENT_ID=6212o7rqtuggpjact1higuf12f`
- `VITE_COGNITO_USER_POOL_DOMAIN=pocketsmith-ynab-webapp-staging-530919391492.auth.ap-southeast-2.amazoncognito.com`

### Step 5: Check Account Mappings

The balance comparison page requires account mappings to be configured. Check:
1. Navigate to Account Mappings page first
2. Ensure PocketSmith and YNAB accounts are loaded
3. Create at least one mapping
4. Then test the Balance Comparison page

## Quick Fixes

### Fix 1: Redeploy Infrastructure

```bash
cd infrastructure
npm run lambda:build
npx cdk deploy --require-approval never
```

### Fix 2: Clear Browser Cache

Clear browser cache and local storage, then try again.

### Fix 3: Test with Mock API

Temporarily enable mock API to verify the frontend works:

```bash
cd pocketsmith-ynab-webapp
# Create a temporary .env.local file
echo "VITE_USE_MOCK_API=true" > .env.local
npm run dev
```

### Fix 4: Check API Gateway Resource Policy

Ensure the API Gateway doesn't have a resource policy that's blocking requests.

## Expected Behavior

### When Working Correctly:

1. **Health Endpoint**: `GET /health` should return 200 OK without authentication
2. **Balance Endpoint**: `GET /balances/compare` should return 401 Unauthorized without auth token
3. **With Valid Auth**: Balance endpoint should return balance comparison data
4. **Frontend**: Should display balance comparisons in a table with discrepancy indicators

### Response Format:

```json
{
  "comparisons": [
    {
      "pocketsmithAccountId": "123",
      "pocketsmithAccountName": "Checking Account",
      "pocketsmithBalance": 2500.50,
      "ynabAccountId": "ynab-456",
      "ynabAccountName": "Checking",
      "ynabBalance": 2500.50,
      "difference": 0.00,
      "currency": "USD",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "hasDiscrepancy": false,
      "discrepancyThreshold": 0.01
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z",
  "cacheExpiry": "2024-01-15T10:35:00Z"
}
```

## Monitoring Commands

### Test API Endpoints:
```bash
# Test health endpoint (should work without auth)
curl -X GET "https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging/health"

# Test balance endpoint (should return 401 without auth)
curl -X GET "https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging/balances/compare"
```

### Check Lambda Logs:
```bash
# Install AWS CLI if not already installed
# Then check recent logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/PocketSmithYnabSyncStack-staging"
```

## Next Steps

1. **Immediate**: Redeploy the infrastructure to ensure latest configuration is applied
2. **Short-term**: Add better error handling and logging to the frontend
3. **Long-term**: Implement health checks and monitoring alerts

## Contact Information

If the issue persists after following these steps, check:
1. CloudWatch logs for detailed error messages
2. AWS Console for any service-level issues
3. CDK diff output for configuration changes