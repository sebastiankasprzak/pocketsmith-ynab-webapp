# PocketSmith-YNAB Sync WebApp - Frontend

React TypeScript web application for managing PocketSmith-YNAB synchronization with Material-UI design system.

## Technology Stack

- **React 19** with TypeScript for type-safe component development
- **Vite** as build tool and development server with HMR, auto-browser opening, port 5173, and explicit environment variable configuration
- **Material-UI (MUI) v7** for responsive UI components and theming
- **React Router v7** for client-side routing
- **TanStack React Query v5** for API state management and caching
- **AWS Amplify** for authentication integration

## Features

- **Account Management**: Configure and manage account mappings between PocketSmith and YNAB
- **Sync Monitoring**: Real-time monitoring of synchronization status and history
- **Balance Comparison**: Compare account balances between both financial systems
- **Manual Sync Operations**: Trigger synchronization processes manually when needed
- **User Authentication**: Secure OAuth login with AWS Cognito integration
- **Protected Routes**: Automatic authentication checks and login redirects
- **Test User Management**: Utility script for creating test users in Cognito
- **Responsive Design**: Full mobile, tablet, and desktop support with Material-UI breakpoints
- **Smart API Configuration**: Intelligent mock/real API selection with comprehensive debugging
  - Automatic environment-based API selection
  - Explicit override capabilities for testing scenarios
  - Detailed console logging for troubleshooting

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── __tests__/      # Component unit tests
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Navigation.tsx  # App navigation
│   └── ...
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
│   └── __tests__/      # Hook unit tests
├── services/           # API clients and external services
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test configuration and setup
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Getting Started

**From project root (recommended):**
```bash
# Install all dependencies
npm run install:all

# Start development server
npm run dev
```

**Or from webapp directory:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` and will automatically open in your browser

**Run tests:**
```bash
# From project root
npm run test

# Or from webapp directory
npm run test
```

### Available Scripts

**From project root:**
- `npm run dev` - Start development server with HMR (auto-opens browser on port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests with Vitest
- `npm run test:ci` - Run tests in CI mode with verbose output
- `npm run test:integration` - Run integration tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint for code quality
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking
- `npm run install:all` - Install dependencies for all workspaces
- `npm run clean` - Remove all node_modules and build artifacts
- `npm run fresh-install` - Clean and reinstall all dependencies

**From webapp directory:**
- `npm run dev` - Start development server with HMR (auto-opens browser on port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests with Vitest
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests with verbose output and coverage (CI)
- `npm run test:integration` - Run integration tests
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking



## Configuration

### Environment Variables

Create `.env.local` for local development:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
VITE_AWS_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_56erWzWed
VITE_COGNITO_USER_POOL_CLIENT_ID=6212o7rqtuggpjact1higuf12f
VITE_COGNITO_USER_POOL_DOMAIN=your-cognito-domain.auth.ap-southeast-2.amazoncognito.com
VITE_USE_MOCK_API=true  # Optional: explicitly enable mock API for development
```

**Authentication Configuration**:
- `VITE_COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: Cognito App Client ID  
- `VITE_COGNITO_USER_POOL_DOMAIN`: Cognito hosted UI domain

### Test User Creation

For testing authentication features, create a test user using the utility script in the project root:

```bash
# From project root
node create_test_user.js
```

This creates a test user with credentials:
- **Email**: `test@staging.local`
- **Password**: `TempPassword123!`



### API Configuration

The application includes smart API configuration that automatically selects between mock and real APIs:

- **Development Mode**: Defaults to mock API unless `VITE_USE_MOCK_API=false` is explicitly set
- **Production Mode**: Uses real API unless `VITE_USE_MOCK_API=true` is explicitly set
- **Debug Logging**: Comprehensive console logging shows which API is being used and why

#### Environment Variable Behavior:
- `VITE_USE_MOCK_API=true` - Forces mock API usage
- `VITE_USE_MOCK_API=false` - Forces real API usage  
- `VITE_USE_MOCK_API` unset - Uses mock API in development, real API in production

### Build Configuration

- **Vite**: Modern build tool optimized for React development with Material-UI optimizations
  - Dependency pre-bundling excludes `@mui/material/transitions` for better performance
  - CommonJS module support for node_modules compatibility
  - Hot Module Replacement (HMR) for fast development
  - Explicit environment variable prefix configuration (`VITE_`) for clarity and consistency
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with React hooks and TypeScript rules
- **Vitest**: Fast unit testing with React Testing Library integration

## Testing

The project uses Vitest and React Testing Library for testing:

- **Unit Tests**: Component and hook testing
- **Integration Tests**: API integration and user flow testing
- **Coverage**: Comprehensive test coverage reporting

Run tests in watch mode during development:
```bash
npm run test:watch
```

## Deployment

The application is deployed using GitHub Actions to AWS S3 + CloudFront. See the main project README and DEPLOYMENT.md for full deployment instructions.

### Manual Deployment

For manual deployments, use the deployment script:

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production  
./deploy.sh production
```

**Deployment Script Features:**
- **Environment Validation**: Only accepts `staging` or `production` as valid environments
- **AWS Verification**: Checks AWS CLI configuration and credentials before proceeding
- **Smart Configuration**: Automatically uses `.env.staging` or `.env.production` files when available
- **Optimized S3 Sync**: 
  - Static assets cached for 1 year with immutable headers
  - HTML files set to no-cache for immediate updates
- **CloudFront Integration**: Automatic cache invalidation with completion waiting
- **Resource Discovery**: Automatically finds S3 bucket and CloudFront distribution from CloudFormation outputs
- **Enhanced Status Reporting**: Comprehensive deployment summary with environment details, resource identifiers, and URLs
- **Cleanup Management**: Automatic cleanup of temporary files with clear status messaging

### Build for Production

```bash
npm run build
```

The build artifacts will be generated in the `dist/` directory, ready for deployment to S3.

**Prerequisites for Manual Deployment:**
- Infrastructure must be deployed first (S3 bucket and CloudFront distribution)
- AWS CLI configured with deployment permissions
- CloudFormation stack must exist with proper output values
