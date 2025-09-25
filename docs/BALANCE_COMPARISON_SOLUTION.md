# Balance Comparison Page - Issue Resolution

## Problem Summary
The balance-comparison page is not displaying any data in the staging environment.

## Root Cause
API Gateway is returning 403 Forbidden for all endpoints, including the health check that should work without authentication. This indicates an infrastructure configuration issue.

## Solution Steps

### 1. Immediate Debugging
I've added a debug panel to the Balance Comparison page that will help identify the specific issue:

- **Location**: `pocketsmith-ynab-webapp/src/components/DebugPanel.tsx`
- **Integration**: Added to `BalanceComparison.tsx` temporarily
- **Purpose**: Shows environment config, auth status, and API endpoint test results

### 2. Infrastructure Fix
Run the automated fix script:

```bash
# Make the script executable and run it
chmod +x fix-balance-comparison.sh
./fix-balance-comparison.sh
```

This script will:
- Check and rebuild Lambda functions
- Deploy any infrastructure changes
- Test API endpoints
- Verify frontend configuration
- Provide specific recommendations

### 3. Manual Infrastructure Deployment
If the automated script doesn't resolve the issue:

```bash
cd infrastructure
npm run lambda:build
npx cdk deploy --require-approval never
```

### 4. Verify API Gateway Configuration
Check that the API Gateway has been deployed correctly:

1. Go to AWS Console → API Gateway
2. Find the staging API
3. Check that resources and methods are configured
4. Verify the Cognito authorizer is attached correctly
5. Test the deployment

### 5. Check CloudWatch Logs
If endpoints still return 403:

1. Go to AWS Console → CloudWatch → Log Groups
2. Check these log groups:
   - `/aws/lambda/PocketSmithYnabSyncStack-staging-BalancesLambda-*`
   - `/aws/apigateway/PocketSmithYnabSyncStack-staging-*`
3. Look for error messages during API calls

### 6. Test Authentication Flow
Once API endpoints work:

1. Open the staging webapp
2. Try to sign in with Cognito
3. Check browser developer tools for errors
4. Verify auth tokens are being sent with API requests

### 7. Configure Account Mappings
The balance comparison requires account mappings:

1. Navigate to Account Mappings page first
2. Ensure PocketSmith and YNAB accounts load correctly
3. Create at least one account mapping
4. Then test the Balance Comparison page

## Expected Results

### Working API Endpoints:
- `GET /health` → 200 OK (no auth required)
- `GET /balances/compare` → 401 Unauthorized (without auth) or 200 OK (with auth)

### Working Frontend:
- Debug panel shows green status for API tests
- Authentication works (if enabled)
- Balance comparison table displays data
- Discrepancies are highlighted correctly

## Files Created/Modified

### New Files:
- `BALANCE_COMPARISON_TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `fix-balance-comparison.sh` - Automated fix script
- `debug-balance-api.js` - API endpoint testing script
- `pocketsmith-ynab-webapp/src/components/DebugPanel.tsx` - Debug component

### Modified Files:
- `pocketsmith-ynab-webapp/src/pages/BalanceComparison.tsx` - Added debug panel

## Cleanup After Resolution

Once the issue is resolved, remove the debug components:

```bash
# Remove debug panel from BalanceComparison page
# Delete the debug component file
rm pocketsmith-ynab-webapp/src/components/DebugPanel.tsx

# Remove debug panel import and usage from BalanceComparison.tsx
```

## Prevention

To prevent similar issues in the future:

1. **Add Health Checks**: Implement automated health checks for API endpoints
2. **Better Error Handling**: Improve error messages in the frontend
3. **Monitoring**: Set up CloudWatch alarms for API Gateway errors
4. **Testing**: Add integration tests for the API endpoints

## Testing Commands

```bash
# Test health endpoint
curl -X GET "https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging/health"

# Test balance endpoint (should return 401 without auth)
curl -X GET "https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging/balances/compare"

# Run comprehensive API tests
node debug-balance-api.js
```

## Next Steps

1. Run the fix script: `./fix-balance-comparison.sh`
2. Check the debug panel in the webapp
3. Follow the specific recommendations provided
4. Test the balance comparison functionality
5. Remove debug components once working
6. Document the final resolution for future reference