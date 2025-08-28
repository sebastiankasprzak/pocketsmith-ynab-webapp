# Deployment Guide

This document describes the CI/CD pipeline and deployment process for the PocketSmith-YNAB Sync WebApp.

## Overview

The application uses GitHub Actions for CI/CD with automated deployments to staging and production environments on AWS.

## Environments

### Staging
- **Branch**: `develop`
- **URL**: Configured via `STAGING_BASE_URL` secret
- **Auto-deploy**: On push to `develop` branch
- **Purpose**: Testing and validation before production

### Production
- **Branch**: `main`
- **URL**: Configured via `PRODUCTION_BASE_URL` secret
- **Auto-deploy**: On push to `main` branch
- **Purpose**: Live application for end users

## GitHub Secrets Configuration

### Required Secrets

#### AWS Configuration
- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
- `AWS_REGION`: AWS region (e.g., `us-east-1`)

#### Staging Environment
- `STAGING_API_BASE_URL`: API Gateway URL for staging
- `STAGING_COGNITO_USER_POOL_ID`: Cognito User Pool ID for staging
- `STAGING_COGNITO_CLIENT_ID`: Cognito Client ID for staging
- `STAGING_COGNITO_USER_POOL_DOMAIN`: Cognito hosted UI domain for staging
- `STAGING_S3_BUCKET`: S3 bucket name for staging webapp
- `STAGING_CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for staging
- `STAGING_BASE_URL`: Full URL of staging webapp

#### Production Environment
- `PRODUCTION_API_BASE_URL`: API Gateway URL for production
- `PRODUCTION_COGNITO_USER_POOL_ID`: Cognito User Pool ID for production
- `PRODUCTION_COGNITO_CLIENT_ID`: Cognito Client ID for production
- `PRODUCTION_COGNITO_USER_POOL_DOMAIN`: Cognito hosted UI domain for production
- `PRODUCTION_S3_BUCKET`: S3 bucket name for production webapp
- `PRODUCTION_CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for production
- `PRODUCTION_BASE_URL`: Full URL of production webapp
- `BACKUP_S3_BUCKET`: S3 bucket for production backups

#### Optional
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications
- `GITHUB_TOKEN`: GitHub token for creating releases (usually auto-provided)

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)
**Triggers**: Push/PR to `main` or `develop`

**Jobs**:
- **test**: Runs linting, type checking, unit tests, and builds
- **security-scan**: Runs security audits and vulnerability scans

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)
**Triggers**: Push to `develop` branch, manual dispatch

**Steps**:
1. Run full test suite (webapp + infrastructure + Lambda functions)
2. Build application with staging configuration
3. Deploy infrastructure using CDK (Lambda functions built automatically via bundling)
   - **Note**: CDK bundling handles Lambda function builds with `npm ci --legacy-peer-deps`
   - Lambda functions use mixed AWS SDK versions (v2 and v3)
   - Uses workspace-based commands: `npm run infra:deploy`
   - Infrastructure tests include both CDK constructs and Lambda function unit tests
   - **Multi-Stack Deployment**: Uses `--all` flag to deploy all CDK stacks in dependency order
4. Upload build to S3
5. Invalidate CloudFront cache
6. Run smoke tests
7. Send notification

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)
**Triggers**: Push to `main` branch, manual dispatch

**Steps**:
1. Run full test suite including integration tests (webapp + infrastructure + Lambda functions)
2. Build application with production configuration
3. Create backup of current deployment
4. Deploy infrastructure using CDK (Lambda functions built automatically via bundling)
   - **Note**: CDK bundling handles Lambda function builds with `npm ci --legacy-peer-deps`
   - Lambda functions use mixed AWS SDK versions (v2 and v3)
   - Uses workspace-based commands: `npm run infra:deploy`
   - Infrastructure tests include both CDK constructs and Lambda function unit tests
   - **Multi-Stack Deployment**: Uses `--all` flag to deploy all CDK stacks in dependency order
5. Upload build to S3
6. Invalidate CloudFront cache
7. Run production smoke tests
8. Create GitHub release
9. Rollback on failure
10. Send notification

### 4. Environment Management (`.github/workflows/environment-management.yml`)
**Triggers**: Manual dispatch only

**Actions**:
- **deploy**: Deploy infrastructure to specified environment
- **destroy**: Destroy infrastructure in specified environment
- **status**: Check current status and diff of infrastructure

## Manual Deployment

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. Node.js 18+ installed
3. CDK CLI installed (`npm install -g aws-cdk`)
4. All dependencies installed (`npm run install:all` from project root)

### Project Setup and Dependency Management

The project uses npm workspaces for managing multiple packages. Use these commands for dependency management:

```bash
# Install all dependencies for all workspaces (recommended)
npm run install:all

# Clean all build artifacts and node_modules
npm run clean

# Fresh install (clean + install) - useful for resolving dependency conflicts
npm run fresh-install
```

**Note**: The project uses `--legacy-peer-deps` flag for compatibility with mixed dependency versions across workspaces. This is automatically handled by the workspace commands.

### Test User Setup

For testing authentication in deployed environments, create a test user:

```bash
# Create test user in Cognito
node create_test_user.js
```

**Test Credentials:**
- Email: `test@staging.local`
- Password: `TempPassword123!`

This is useful for:
- Testing authentication flows in staging
- Validating deployed authentication configuration
- Manual testing of protected routes



### Deploy to Staging
```bash
# From project root (recommended - deploys both infrastructure and webapp)
npm run deploy staging

# Or webapp only
cd pocketsmith-ynab-webapp
./deploy.sh staging

# Or infrastructure only
npm run infra:deploy -- --context environment=staging
```

### Deploy to Production
```bash
# From project root (recommended - deploys both infrastructure and webapp)
npm run deploy production

# Or webapp only
cd pocketsmith-ynab-webapp
./deploy.sh production

# Or infrastructure only
npm run infra:deploy -- --context environment=production
```

### Webapp-Only Deployment

The `deploy.sh` script provides a streamlined deployment process for the webapp component:

**Features:**
- **Environment Validation**: Ensures only `staging` or `production` environments are used
- **AWS Credential Validation**: Verifies AWS CLI configuration before deployment
- **Dependency Management**: Installs dependencies with `--legacy-peer-deps` for compatibility
- **Environment-Specific Builds**: Uses `.env.staging` or `.env.production` files when available
- **S3 Deployment**: Syncs build artifacts to S3 with optimized caching headers
  - Static assets: `max-age=31536000, immutable` (1 year cache)
  - HTML files: `max-age=0, must-revalidate` (no cache for HTML)
- **CloudFront Integration**: Automatic cache invalidation with completion waiting
- **Enhanced Status Reporting**: Comprehensive deployment summary including:
  - Environment configuration details
  - AWS resource identifiers (S3 bucket, CloudFront distribution)
  - Deployed application URLs
- **Cleanup Management**: Automatic cleanup of temporary files with clear progress messaging

**Usage:**
```bash
cd pocketsmith-ynab-webapp
./deploy.sh [staging|production]
```

**Prerequisites:**
- Infrastructure must be already deployed (S3 bucket and CloudFront distribution)
- AWS CLI configured with appropriate permissions
- CloudFormation stack outputs available for resource discovery

**Note**: This script assumes infrastructure is already deployed and focuses solely on webapp deployment. For full-stack deployment including infrastructure, use the project root deployment commands.

### Infrastructure Only
```bash
# From project root (recommended)
npm run infra:deploy -- --context environment=staging
# or
npm run infra:deploy -- --context environment=production

# Or from infrastructure directory
cd infrastructure
npm install --legacy-peer-deps
npm run cdk -- deploy --context environment=staging
# or
npm run cdk -- deploy --context environment=production
```

**Note**: Lambda functions are now built automatically during CDK deployment using bundling. CDK will handle installing dependencies and building each Lambda function as part of the deployment process.

## Environment Variables

### Build-time Variables
These are set during the build process and embedded in the application:

- `VITE_ENVIRONMENT`: Current environment (`staging` or `production`)
- `VITE_API_BASE_URL`: API Gateway base URL
- `VITE_AWS_REGION`: AWS region
- `VITE_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: Cognito Client ID
- `VITE_COGNITO_USER_POOL_DOMAIN`: Cognito hosted UI domain
- `VITE_USE_MOCK_API`: API selection override (`true` for mock API, `false` for real API)
  - **Default Behavior**: Mock API in development, real API in production
  - **Override**: Set to `true` to force mock API usage in any environment
  - **Debug**: Console logging shows API selection logic and configuration
  - **Authentication**: Real API requires valid Cognito authentication

## Monitoring and Alerting

### CloudWatch Dashboards
- Application performance metrics
- API Gateway metrics
- Lambda function metrics
- CloudFront metrics

### Alarms
- API error rates
- Authentication failures
- Lambda function errors
- CloudFront 4xx/5xx errors

## Rollback Procedures

### Automatic Rollback
Production deployments automatically rollback on failure by:
1. Restoring the previous S3 deployment from backup
2. Invalidating CloudFront cache
3. Notifying the team

### Manual Rollback
```bash
# Get the backup timestamp
aws s3 ls s3://your-backup-bucket/

# Restore from backup
aws s3 sync s3://your-backup-bucket/backup-TIMESTAMP/ s3://your-production-bucket/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Security Considerations

### Secrets Management
- All sensitive configuration stored in GitHub Secrets
- AWS credentials use least-privilege IAM policies
- API keys encrypted in Parameter Store

### Infrastructure Security
- S3 buckets configured with appropriate access policies
- CloudFront enforces HTTPS
- API Gateway has CORS configured
- Lambda functions use VPC when needed

## Troubleshooting

### Common Issues

#### Deployment Fails
1. Check AWS credentials and permissions
2. Verify all required secrets are configured
3. Check CloudFormation stack events in AWS Console

#### Tests Fail
1. Ensure all dependencies are installed
2. Check for environment-specific test configuration
3. Verify mock data and test setup

#### Build Fails
1. Check Node.js version compatibility
2. Verify environment variables are set correctly
3. Check for TypeScript compilation errors

### Getting Help
1. Check GitHub Actions logs for detailed error messages
2. Review CloudFormation events in AWS Console
3. Check CloudWatch logs for runtime errors
4. Contact the development team via Slack

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate AWS credentials quarterly
- Monitor CloudWatch costs and usage
- Update security policies as needed

### Backup Strategy
- Production deployments automatically backed up before updates
- Infrastructure state stored in CloudFormation
- Database backups (if applicable) handled separately