# Infrastructure - AWS CDK

This directory contains the AWS CDK infrastructure code for the PocketSmith-YNAB Sync WebApp.

## Architecture

The infrastructure includes:
- **S3 + CloudFront**: Static hosting for the React webapp
- **Cognito**: User authentication and authorization
- **API Gateway + Lambda**: Backend APIs for account management, sync monitoring, and balance comparison
- **Parameter Store**: Configuration management for API keys and settings
- **CloudWatch**: Monitoring and logging

## Test User Management

A utility script is available in the project root for creating test users in Cognito:

```bash
# From project root
node create_test_user.js
```

This script:
- Creates a test user in the configured Cognito User Pool
- Sets up verified email and permanent password
- Handles existing users gracefully
- Uses the AWS SDK v3 Cognito Identity Provider client

## AWS SDK Migration

The Lambda functions are being migrated from AWS SDK v2 to v3 for better performance and smaller bundle sizes:

### Migration Status
- ✅ **accounts**: Migrated to AWS SDK v3 (`@aws-sdk/client-ssm`) - PocketSmith API integration updated
- ✅ **parameter-store**: Migrated to AWS SDK v3 (`@aws-sdk/client-ssm`)
- ✅ **balances**: Migrated to AWS SDK v3 (`@aws-sdk/client-ssm`) - cacheService updated
- ⏳ **sync-monitoring**: Status unknown (needs verification)

### Completing the Migration

To complete the AWS SDK v3 migration for the remaining Lambda functions:

#### For sync-monitoring Lambda:
1. Update `package.json` to replace `aws-sdk` with specific v3 clients:
   ```bash
   cd lambda/sync-monitoring
   npm uninstall aws-sdk
   npm install @aws-sdk/client-cloudwatch-logs @aws-sdk/client-sqs
   ```

2. Update imports in source files:
   ```typescript
   // Replace: import { CloudWatchLogs, SQS } from 'aws-sdk';
   // With: import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
   // With: import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
   ```

3. Update service instantiation and method calls:
   ```typescript
   // Replace: this.cloudWatchLogs = new CloudWatchLogs();
   // With: this.cloudWatchLogs = new CloudWatchLogsClient({});
   
   // Replace: await this.cloudWatchLogs.filterLogEvents({...}).promise();
   // With: await this.cloudWatchLogs.send(new FilterLogEventsCommand({...}));
   ```

#### Benefits of Migration:
- Smaller bundle sizes (only import needed services)
- Better tree-shaking and performance
- Modern Promise-based API (no `.promise()` calls)
- Better TypeScript support
- Reduced cold start times

## TypeScript Configuration

The infrastructure uses a dual TypeScript configuration setup for optimal development and build processes:

### Configuration Files
- **`tsconfig.json`**: Main configuration for development, testing, and IDE support with strict type checking
- **`tsconfig.build.json`**: Independent production build configuration optimized for deployment

### Development Configuration (`tsconfig.json`)
The main configuration provides strict type checking for development:
- **Strict Mode**: Full TypeScript strict mode enabled (`strict: true`, `noImplicitAny: true`)
- **Type Definitions**: Configured `types: ["node", "jest"]` for proper Node.js and Jest type support
- **Library Support**: ES2020 library only (Node.js/Lambda environment)
- **Module Interop**: `esModuleInterop` and `allowSyntheticDefaultImports` for better module compatibility

### Build Configuration (`tsconfig.build.json`)
The build configuration is completely independent and optimized for production builds:
- **Relaxed Type Checking**: Uses `strict: false` and `noImplicitAny: false` for build compatibility with legacy code
- **Extended Library Support**: Includes both ES2020 and DOM libraries for maximum compatibility
- **Test Exclusion**: Excludes all test files and directories from production builds:
  - `**/*.test.ts`
  - `**/__tests__/**`
  - `test/**/*`
  - `lambda/**/__tests__/**`
  - `lambda/**/src/__tests__/**`
- **Performance Optimizations**: 
  - `skipLibCheck: true` for faster compilation
  - Empty `types: []` and `typeRoots: []` to avoid type resolution conflicts
- **Build Artifacts**: Excludes `node_modules` and `cdk.out` directories

### Key Benefits
- **Development**: Full type safety and error detection during development
- **Production**: Optimized compilation that handles mixed codebases and legacy dependencies
- **Separation of Concerns**: Independent configurations prevent development settings from affecting builds
- **Compatibility**: Build config handles AWS SDK v2/v3 mixed usage and various dependency types

## Project Structure

```
├── lib/
│   ├── infrastructure-stack.ts    # Main CDK stack
│   └── monitoring-stack.ts        # CloudWatch monitoring
├── lambda/                        # Lambda function source code
│   ├── accounts/                  # Account management APIs
│   ├── balances/                  # Balance comparison APIs
│   ├── parameter-store/           # Configuration management
│   └── sync-monitoring/           # Sync status monitoring
├── test/                          # Infrastructure tests
├── bin/                           # CDK app entry point
├── config/                        # Configuration files
└── tsconfig.json                  # TypeScript configuration (updated)
```

## Lambda Functions

Each Lambda function is a TypeScript project with its own dependencies and build process:

### PocketSmith API Integration

The **accounts** Lambda function includes a robust PocketSmith client that handles API authentication and data retrieval:

#### API Implementation
- **Endpoint Pattern**: Supports both general and user-specific endpoint patterns
- **Authentication Flow**: Fetches and caches user ID via `/me` endpoint for future user-specific operations
- **User ID Caching**: Implements efficient user ID caching to avoid repeated API calls
- **Base URL**: `https://api.pocketsmith.com/v2`
- **Authentication**: X-Developer-Key header with API key

#### Reliability Features
- **Retry Logic**: Automatic retry with exponential backoff (up to 3 attempts)
- **Timeout Protection**: 30-second request timeout
- **Network Resilience**: Handles connection resets, timeouts, and DNS failures
- **Server Error Recovery**: Retries on 5xx server errors

#### Error Handling
- **401 Unauthorized**: Invalid API key detection
- **403 Forbidden**: API key permission issues
- **429 Rate Limited**: Rate limit exceeded handling
- **Network Errors**: Connection and DNS failure handling
- **Timeout Errors**: Request timeout detection and messaging

#### Monitoring & Debugging
- **Request Logging**: Logs all successful API calls with method and URL
- **Error Logging**: Detailed error logging with status codes and response data
- **Retry Logging**: Tracks retry attempts with delay information

### Lambda Function Building

Lambda functions are now built automatically during CDK deployment using bundling. The CDK will:
1. Install dependencies with `npm ci --legacy-peer-deps`
2. Build TypeScript to JavaScript with `npm run build`
3. Copy compiled code and node_modules to the Lambda package

**No manual build step is required** - CDK handles this automatically during deployment.

### Lambda Function Structure

Each Lambda function follows this pattern:
```
lambda/{function-name}/
├── src/
│   ├── __tests__/         # Unit tests
│   ├── index.ts          # Lambda handler entry point
│   ├── types.ts          # TypeScript interfaces
│   └── ...               # Service modules
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Function-specific dependencies
├── tsconfig.json         # TypeScript configuration
└── jest.config.js        # Test configuration
```

## Deployment

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)

### Full Deployment Process

**From project root (recommended):**
```bash
# Install all dependencies
npm run install:all

# Deploy infrastructure
npm run infra:deploy -- --context environment=staging
# or
npm run infra:deploy -- --context environment=production
```

**Or from infrastructure directory:**
```bash
# Install dependencies
npm install

# Build and deploy infrastructure
npm run build
npm run cdk -- deploy --context environment=staging
# or
npm run cdk -- deploy --context environment=production
```

### Multi-Stack Deployment

The deployment wrapper (`deploy_wrapper.sh`) now uses the `--all` flag to deploy all CDK stacks automatically:

```bash
npm run cdk:deploy -- --all
```

**Benefits of `--all` flag:**
- **Automatic Dependency Resolution**: CDK determines the correct deployment order based on stack dependencies
- **Simplified Multi-Stack Management**: No need to manually specify individual stack names
- **Consistent Deployment**: Ensures all stacks are deployed together in production environments
- **Error Prevention**: Reduces risk of deploying stacks in wrong order or missing dependencies

**Stack Deployment Order:**
When using `--all`, CDK automatically handles the deployment sequence for stacks like:
1. Core infrastructure stack (VPC, IAM roles, etc.)
2. Application stack (Lambda functions, API Gateway, etc.)
3. Monitoring stack (CloudWatch dashboards, alarms, etc.)

This ensures that dependent resources are created before the stacks that reference them.

**Note**: Lambda functions are built automatically during CDK deployment using bundling. The CDK will handle installing dependencies and building each Lambda function as part of the deployment process.

### Environment-Specific Deployment

The stack supports multiple environments through CDK context:

```bash
# Deploy to staging
npx cdk deploy --context environment=staging

# Deploy to production
npx cdk deploy --context environment=production
```

## Testing

The infrastructure uses Jest for comprehensive testing of both CDK constructs and Lambda functions:

### Test Configuration
- **Test Environment**: Node.js environment for Lambda and CDK testing
- **Test Roots**: Both `test/` (CDK tests) and `lambda/` (Lambda function tests)
- **Coverage Collection**: Comprehensive coverage for `lib/` and `lambda/` directories
- **File Patterns**: All `*.test.ts` files are automatically discovered

### Running Tests
```bash
# Run all tests (CDK + Lambda functions)
npm run test

# Run with coverage report
npm run test -- --coverage

# Run specific test file
npm run test -- lambda/accounts/src/__tests__/parameterStoreService.test.ts

# Run tests in watch mode
npm run test -- --watch
```

### Test Structure
- **CDK Tests**: Located in `test/` directory for infrastructure validation
- **Lambda Tests**: Co-located with source code in `lambda/{function}/src/__tests__/`
- **Coverage Reports**: Generated for both infrastructure and Lambda code

## Useful Commands

### From Project Root (Workspace Commands)
* `npm run infra:build` - Compile TypeScript to JavaScript
* `npm run infra:test` - Run Jest unit tests (CDK + Lambda functions)
* `npm run infra:deploy` - Deploy stack to AWS
* `npm run infra:diff` - Compare deployed stack with current state
* `npm run infra:synth` - Generate CloudFormation template
* `npm run infra:destroy` - Remove stack from AWS
* `npm run install:all` - Install dependencies for all workspaces with legacy peer deps
* `npm run clean` - Remove all node_modules and build artifacts
* `npm run fresh-install` - Clean and reinstall all dependencies

### From Infrastructure Directory
* `npm run build` - Compile TypeScript to JavaScript
* `npm run watch` - Watch for changes and compile
* `npm run test` - Run Jest unit tests (CDK + Lambda functions)
* `npm run test -- --coverage` - Run tests with coverage report
* `npm run cdk -- deploy` - Deploy stack to AWS
* `npm run cdk -- diff` - Compare deployed stack with current state
* `npm run cdk -- synth` - Generate CloudFormation template
* `npm run cdk -- destroy` - Remove stack from AWS

### Lambda Development
* `cd lambda/{function} && npm run build` - Build specific Lambda function
* `cd lambda/{function} && npm run test` - Test specific Lambda function
* `cd lambda/{function} && npm run test:watch` - Watch mode for tests

## Configuration

### Environment Variables
The stack uses CDK context for environment-specific configuration:
- `environment`: Target environment (staging/production)

### AWS Resources Created
- S3 bucket for webapp hosting
- CloudFront distribution for CDN
- Cognito User Pool and Client for authentication
- API Gateway REST API
- Lambda functions for backend logic
- IAM roles and policies
- CloudWatch log groups

## Monitoring

The infrastructure includes CloudWatch monitoring with:
- Lambda function metrics and alarms
- API Gateway request/error metrics
- CloudFront distribution metrics
- Custom dashboards for operational visibility

## Security

- Lambda functions use least-privilege IAM roles
- API Gateway has CORS configured
- S3 bucket uses CloudFront Origin Access Control
- Cognito enforces strong password policies
- Parameter Store encrypts sensitive configuration
