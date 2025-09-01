#!/bin/bash

# Deploy script for PocketSmith YNAB Webapp

set -e

echo "🚀 Starting frontend deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Get the S3 bucket name from CDK outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name PocketSmithYnabSyncStack-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`WebappBucketName`].OutputValue' \
  --output text \
  --region ap-southeast-2)

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Could not find S3 bucket name from CloudFormation stack"
  exit 1
fi

echo "📤 Uploading to S3 bucket: $BUCKET_NAME"

# Sync the dist folder to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --region ap-southeast-2 \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML files with no cache
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --region ap-southeast-2 \
  --cache-control "no-cache, no-store, must-revalidate" \
  --include "*.html" \
  --include "*.json"

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name PocketSmithYnabSyncStack-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text \
  --region ap-southeast-2)

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache: $DISTRIBUTION_ID"
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --region ap-southeast-2 \
    --query 'Invalidation.Id' \
    --output text)
  
  echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
  echo "⏳ Waiting for invalidation to complete..."
  
  aws cloudfront wait invalidation-completed \
    --distribution-id $DISTRIBUTION_ID \
    --id $INVALIDATION_ID \
    --region ap-southeast-2
  
  echo "✅ CloudFront invalidation completed"
else
  echo "⚠️  Could not find CloudFront distribution ID"
fi

# Get the webapp URL
WEBAPP_URL=$(aws cloudformation describe-stacks \
  --stack-name PocketSmithYnabSyncStack-staging \
  --query 'Stacks[0].Outputs[?OutputKey==`WebAppUrl`].OutputValue' \
  --output text \
  --region ap-southeast-2)

echo "✅ Frontend deployment complete!"
echo "🌐 Webapp URL: $WEBAPP_URL"