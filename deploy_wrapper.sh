#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Deploy infrastructure first
echo "📦 Deploying infrastructure..."
cd infrastructure
npm ci --legacy-peer-deps
npm run build

# Build Lambda functions
echo "🔨 Building Lambda functions..."
cd lambda/accounts
npm install --legacy-peer-deps
npm run build
cp -r node_modules dist/
cd ../balances
npm install --legacy-peer-deps
npm run build
cp -r node_modules dist/
cd ../sync-monitoring
npm install --legacy-peer-deps
npm run build
cp -r node_modules dist/
cd ../parameter-store
npm install --legacy-peer-deps
npm run build
cp -r node_modules dist/
# Skip dashboard for now - will be added later
# cd ../dashboard
# npm install --legacy-peer-deps
# npm run build
# cp -r node_modules dist/
cd ../..

# Bootstrap CDK if needed
#echo "🔧 Bootstrapping CDK environment..."
#npx cdk bootstrap aws://530919391492/ap-southeast-2 || echo "CDK already bootstrapped or bootstrap failed"

npm run cdk:deploy -- --all --require-approval never "$@"
cd ..

# Deploy webapp
echo "🌐 Deploying webapp..."
cd pocketsmith-ynab-webapp
./deploy.sh "$@"
cd ..

echo "✅ Deployment complete!"