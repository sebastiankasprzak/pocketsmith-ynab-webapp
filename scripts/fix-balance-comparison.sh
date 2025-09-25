#!/bin/bash

# Fix Balance Comparison Issues Script
# This script attempts to resolve common issues with the balance comparison page

set -e

echo "🔧 Balance Comparison Fix Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "infrastructure" ] || [ ! -d "pocketsmith-ynab-webapp" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting balance comparison troubleshooting..."

# Step 1: Check infrastructure
print_status "Step 1: Checking infrastructure status..."
cd infrastructure

if [ ! -d "node_modules" ]; then
    print_warning "Infrastructure dependencies not installed. Installing..."
    npm install
fi

# Check if Lambda functions are built
print_status "Building Lambda functions..."
npm run lambda:build

# Check CDK diff
print_status "Checking for infrastructure changes..."
if npx cdk diff --quiet; then
    print_success "Infrastructure is up to date"
else
    print_warning "Infrastructure changes detected. Deploying..."
    npx cdk deploy --require-approval never
    if [ $? -eq 0 ]; then
        print_success "Infrastructure deployed successfully"
    else
        print_error "Infrastructure deployment failed"
        exit 1
    fi
fi

cd ..

# Step 2: Test API endpoints
print_status "Step 2: Testing API endpoints..."

API_BASE="https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/staging"

# Test health endpoint
print_status "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE/health")
HEALTH_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HEALTH_CODE" = "200" ]; then
    print_success "Health endpoint working correctly"
elif [ "$HEALTH_CODE" = "403" ]; then
    print_error "Health endpoint returning 403 Forbidden - API Gateway configuration issue"
    print_status "This suggests the API Gateway deployment has issues"
else
    print_warning "Health endpoint returned status code: $HEALTH_CODE"
fi

# Test balance endpoint (should return 401 without auth)
print_status "Testing balance comparison endpoint..."
BALANCE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/balance_response.json "$API_BASE/balances/compare")
BALANCE_CODE="${BALANCE_RESPONSE: -3}"

if [ "$BALANCE_CODE" = "401" ]; then
    print_success "Balance endpoint correctly requires authentication"
elif [ "$BALANCE_CODE" = "403" ]; then
    print_error "Balance endpoint returning 403 Forbidden - API Gateway configuration issue"
else
    print_warning "Balance endpoint returned status code: $BALANCE_CODE"
fi

# Step 3: Check frontend configuration
print_status "Step 3: Checking frontend configuration..."
cd pocketsmith-ynab-webapp

if [ ! -d "node_modules" ]; then
    print_warning "Frontend dependencies not installed. Installing..."
    npm install
fi

# Check environment configuration
if [ -f ".env.staging" ]; then
    print_status "Staging environment configuration found:"
    cat .env.staging | grep -E "^VITE_" | while read line; do
        echo "  $line"
    done
else
    print_error "Staging environment configuration not found"
fi

# Check if mock API is enabled
if [ -f ".env.local" ]; then
    if grep -q "VITE_USE_MOCK_API=true" .env.local; then
        print_warning "Mock API is enabled in .env.local - this will override staging API"
        print_status "Remove .env.local or set VITE_USE_MOCK_API=false to use real API"
    fi
fi

cd ..

# Step 4: Provide recommendations
print_status "Step 4: Recommendations..."

if [ "$HEALTH_CODE" = "403" ] || [ "$BALANCE_CODE" = "403" ]; then
    print_error "API Gateway is returning 403 Forbidden for all endpoints"
    echo ""
    echo "Possible solutions:"
    echo "1. Redeploy the infrastructure: cd infrastructure && npx cdk deploy"
    echo "2. Check AWS Console for API Gateway configuration"
    echo "3. Verify Cognito User Pool settings"
    echo "4. Check CloudWatch logs for Lambda function errors"
    echo ""
    echo "CloudWatch Log Groups to check:"
    echo "- /aws/lambda/PocketSmithYnabSyncStack-staging-BalancesLambda-*"
    echo "- /aws/apigateway/PocketSmithYnabSyncStack-staging-*"
elif [ "$HEALTH_CODE" = "200" ] && [ "$BALANCE_CODE" = "401" ]; then
    print_success "API endpoints are working correctly!"
    echo ""
    echo "The balance comparison page issue might be:"
    echo "1. Authentication not working in the frontend"
    echo "2. No account mappings configured"
    echo "3. Frontend JavaScript errors"
    echo ""
    echo "Next steps:"
    echo "1. Open the webapp and check browser developer tools"
    echo "2. Try signing in with Cognito"
    echo "3. Configure account mappings first"
    echo "4. Then test the balance comparison page"
else
    print_warning "API endpoints have unexpected behavior"
    echo ""
    echo "Health endpoint status: $HEALTH_CODE"
    echo "Balance endpoint status: $BALANCE_CODE"
    echo ""
    echo "Check CloudWatch logs for more details"
fi

# Step 5: Quick test with mock API
print_status "Step 5: Testing with mock API..."
cd pocketsmith-ynab-webapp

# Create temporary .env.local with mock API enabled
echo "VITE_USE_MOCK_API=true" > .env.local.test

print_status "Starting development server with mock API for testing..."
print_status "This will help verify if the frontend components work correctly"
print_status "Open http://localhost:5173 in your browser and test the balance comparison page"
print_status "Press Ctrl+C to stop the server and continue"

# Start dev server with mock API
VITE_USE_MOCK_API=true npm run dev &
DEV_SERVER_PID=$!

# Wait for user to test
echo ""
print_status "Development server started with PID: $DEV_SERVER_PID"
print_status "Test the balance comparison page, then press Enter to continue..."
read -p ""

# Kill dev server
kill $DEV_SERVER_PID 2>/dev/null || true
rm -f .env.local.test

cd ..

print_success "Balance comparison troubleshooting completed!"
echo ""
echo "Summary:"
echo "- Infrastructure status checked"
echo "- API endpoints tested"
echo "- Frontend configuration verified"
echo "- Mock API test completed"
echo ""
echo "If issues persist, check the detailed troubleshooting guide:"
echo "cat BALANCE_COMPARISON_TROUBLESHOOTING.md"