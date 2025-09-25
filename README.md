# PocketSmith-YNAB Sync WebApp

A React web application that provides a management interface for the existing PocketSmith-YNAB synchronization solution.

## Project Structure

```
├── pocketsmith-ynab-webapp/    # React TypeScript webapp with Vite
├── infrastructure/             # AWS CDK infrastructure as code
├── docs/                       # Implementation guides and documentation
├── scripts/                    # Utility scripts for testing and debugging
├── deploy_wrapper.sh          # Main deployment script
└── README.md                  # This file
```

## Features

- **Account Management**: Configure account mappings between PocketSmith and YNAB
- **Sync Monitoring**: Monitor synchronization status and history
- **Balance Comparison**: Compare PocketSmith posted balances with YNAB cleared balances
- **Manual Sync**: Trigger synchronization operations manually
- **User Authentication**: Secure access with AWS Cognito OAuth integration
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- React 19 with TypeScript
- Material-UI (MUI) v7 for responsive design with optimized bundling
- TanStack React Query v5 for API state management
- React Router v7 for navigation
- **AWS Amplify** for Cognito authentication integration
- Vite for fast development with Material-UI performance optimizations
  - Optimized dependency pre-bundling for Material-UI components
  - CommonJS module compatibility for better third-party library support
  - Explicit environment variable prefix configuration for consistency
- **Smart API Configuration**: Automatic mock/real API selection with enhanced debugging
  - Development mode defaults to mock API unless explicitly disabled
  - Production environments use real API unless explicitly configured otherwise
  - Comprehensive logging for API configuration troubleshooting
- **Authentication System**: Complete OAuth integration with protected routes and session management

### Infrastructure
- AWS CDK v2 for Infrastructure as Code
- AWS SDK v3 for Lambda functions (migration in progress)
- S3 + CloudFront for static hosting
- **Cognito** for user authentication with OAuth support
- API Gateway + Lambda for backend
- Jest for comprehensive testing of CDK constructs and Lambda functions
- Robust PocketSmith API integration with retry logic and comprehensive error handling
- Integration with existing sync infrastructure

## Getting Started

### Prerequisites
- Node.js 18+ 
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)

### Development Setup

1. **Install all dependencies (recommended):**
   ```bash
   npm run install:all
   ```

   This installs dependencies for all workspaces using npm workspaces. Individual workspace dependencies are automatically managed.

2. **Start development server:**
   ```bash
   npm run dev
   ```

   This starts the React development server on `http://localhost:5173` and automatically opens your browser

### Authentication Setup

For testing authentication features, you can create a test user in Cognito:

```bash
# Create test user for staging environment
node create_test_user.js
```

This script will create a test user with the following credentials:
- **Email**: `test@staging.local`
- **Password**: `TempPassword123!`

The script handles existing users gracefully and will display the credentials if the user already exists.



### Deployment

**Quick deployment (recommended):**
```bash
npm run deploy [staging|production]
```

**✅ Note**: Infrastructure deployment TypeScript issues have been resolved with an updated build configuration (`tsconfig.build.json`). The deployment wrapper can now be safely re-enabled for full-stack deployments.

**🔄 Multi-Stack Deployment**: The deployment wrapper now uses `--all` flag to deploy all CDK stacks in the correct dependency order automatically, ensuring proper infrastructure setup for complex multi-stack architectures.

**Deploy components individually:**

1. **Deploy webapp only:**
   ```bash
   cd pocketsmith-ynab-webapp
   ./deploy.sh [staging|production]
   ```

2. **Deploy infrastructure only:**
   ```bash
   npm run infra:build
   npm run infra:deploy -- --context environment=staging
   # or
   npm run infra:deploy -- --context environment=production
   ```

**Webapp Deployment Features:**
- Environment validation (staging/production only)
- AWS credential verification
- Automatic dependency installation with legacy peer deps support
- Environment-specific configuration loading (`.env.staging`/`.env.production`)
- Optimized S3 sync with cache headers (1-year cache for assets, no cache for HTML)
- CloudFront cache invalidation with completion waiting
- Resource discovery via CloudFormation stack outputs
- Enhanced deployment reporting with comprehensive environment summary
- Automatic cleanup of temporary files with clear progress messaging

**Note**: Lambda functions are built automatically during CDK deployment using bundling. No manual build step required for Lambda functions.

## Requirements Addressed

This setup addresses the following requirements:

- **6.1**: Responsive design with Material-UI breakpoints and mobile optimization
- **6.2**: Clear navigation structure with React Router and Material-UI components
- **6.3**: Loading states and progress indicators with Material-UI components

## Next Steps

After completing this initial setup, the next tasks will involve:

1. Setting up AWS infrastructure (S3, CloudFront, Cognito, API Gateway)
2. Implementing authentication integration
3. Building account mapping management interface
4. Integrating with existing sync infrastructure monitoring
5. Creating balance comparison functionality

## API Configuration

The webapp includes intelligent API configuration that automatically selects between mock and real APIs based on environment and explicit configuration:

### Smart API Selection Logic
- **Development Mode**: Automatically uses mock API unless explicitly disabled with `VITE_USE_MOCK_API=false`
- **Production Mode**: Uses real API unless explicitly overridden with `VITE_USE_MOCK_API=true`
- **Staging Override**: Currently configured to use mock API (`VITE_USE_MOCK_API=true`) until authentication is fully implemented

### Configuration Options
```env
# Force mock API usage (useful for staging/testing)
VITE_USE_MOCK_API=true

# Force real API usage (useful for development with real backend)
VITE_USE_MOCK_API=false

# Automatic selection (recommended)
# VITE_USE_MOCK_API=  # Leave unset for smart defaults
```

### Debug Information
The application logs comprehensive API configuration details to the console, including:
- Environment detection (`VITE_ENVIRONMENT`, `DEV` mode)
- Mock API override settings
- Final API selection decision
- Base URL configuration

This makes it easy to troubleshoot API configuration issues during development and deployment.

## Documentation & Scripts

- **Documentation**: See `docs/` directory for implementation guides, troubleshooting, and feature documentation
- **Utility Scripts**: See `scripts/` directory for debugging and testing utilities

## Development Commands

### Root Level (Workspace Commands)

#### Project Management
- `npm run install:all` - Install dependencies for all workspaces with legacy peer deps support
- `npm run clean` - Remove all node_modules and build artifacts from all workspaces
- `npm run fresh-install` - Clean and reinstall all dependencies (useful for dependency issues)

#### Frontend Development
- `npm run dev` - Start webapp development server (localhost:5173)
- `npm run build` - Build webapp for production
- `npm run preview` - Preview webapp production build locally
- `npm run test` - Run webapp unit tests
- `npm run test:ci` - Run webapp tests in CI mode with verbose output
- `npm run test:integration` - Run webapp integration tests
- `npm run test:coverage` - Run webapp tests with coverage report
- `npm run lint` - Run webapp ESLint for code quality
- `npm run lint:fix` - Run webapp ESLint with auto-fix
- `npm run type-check` - Run webapp TypeScript type checking

#### Infrastructure Management
- `npm run infra:build` - Build infrastructure TypeScript
- `npm run infra:test` - Run infrastructure tests (CDK + Lambda functions)
- `npm run infra:deploy` - Deploy infrastructure to AWS
- `npm run infra:synth` - Generate CloudFormation template
- `npm run infra:diff` - Compare deployed stack with current state
- `npm run infra:destroy` - Remove infrastructure stack from AWS

#### Deployment
- `npm run deploy` - Deploy both webapp and infrastructure using deployment wrapper

### Webapp (Direct Commands)
```bash
cd pocketsmith-ynab-webapp
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run preview      # Preview production build
```

### Infrastructure (Direct Commands)
```bash
cd infrastructure
npm run build        # Compile TypeScript
npm run test         # Run Jest tests
npm run cdk -- synth # Generate CloudFormation template
npm run cdk -- deploy # Deploy to AWS
npm run cdk -- diff  # Compare with deployed stack
npm run cdk -- destroy # Remove stack from AWS
```