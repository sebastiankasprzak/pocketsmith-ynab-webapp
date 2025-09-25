#!/bin/bash

set -e

echo "🧪 Testing deployment process..."

# Test infrastructure build only (no deployment)
echo "📦 Testing infrastructure build..."
cd infrastructure

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in infrastructure directory"
    exit 1
fi

# Install dependencies
echo "📥 Installing infrastructure dependencies..."
npm ci --legacy-peer-deps

# Build infrastructure
echo "🔨 Building infrastructure..."
npm run build

# Test Lambda function builds
echo "🔨 Testing Lambda function builds..."

# Test accounts Lambda
cd lambda/accounts
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in accounts Lambda"
    exit 1
fi
npm install --legacy-peer-deps
npm run build
cd ../..

# Test balances Lambda
cd lambda/balances
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in balances Lambda"
    exit 1
fi
npm install --legacy-peer-deps
npm run build
cd ../..

# Test sync-monitoring Lambda
cd lambda/sync-monitoring
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in sync-monitoring Lambda"
    exit 1
fi
npm install --legacy-peer-deps
npm run build
cd ../..

# Test parameter-store Lambda
cd lambda/parameter-store
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in parameter-store Lambda"
    exit 1
fi
npm install --legacy-peer-deps
npm run build
cd ../..

cd ..

echo "✅ All builds successful! Ready for deployment."
echo "💡 Run ./deploy_wrapper.sh to deploy to AWS"