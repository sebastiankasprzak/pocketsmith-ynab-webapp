# Project Structure

## Root Level Organization

```
├── pocketsmith-ynab-webapp/    # React TypeScript frontend application
├── infrastructure/             # AWS CDK infrastructure as code
├── deploy_wrapper.sh          # Deployment script for both components
└── README.md                  # Project overview and setup instructions
```

## Frontend Structure (pocketsmith-ynab-webapp/)

### Source Code Organization
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
├── assets/             # Static assets (images, icons)
└── test/               # Test configuration and setup
```

### Configuration Files
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration (references app/node configs)
- `eslint.config.js` - ESLint rules and plugins
- `vitest.config.ts` - Unit test configuration
- `package.json` - Dependencies and npm scripts

## Infrastructure Structure (infrastructure/)

### CDK Organization
```
lib/
├── infrastructure-stack.ts  # Main CDK stack (S3, CloudFront, Cognito, API Gateway)
└── monitoring-stack.ts     # CloudWatch monitoring and alerting

lambda/                     # Lambda function source code
├── accounts/              # Account management APIs
├── balances/              # Balance comparison APIs
├── parameter-store/       # Configuration management APIs
└── sync-monitoring/       # Sync status and monitoring APIs

test/                      # Infrastructure unit tests
bin/                       # CDK app entry point
config/                    # Configuration files (CloudWatch dashboards)
```

### Lambda Function Structure
Each Lambda function follows this pattern:
```
lambda/{function-name}/
├── src/
│   ├── __tests__/         # Unit tests
│   ├── index.ts          # Lambda handler entry point
│   ├── types.ts          # TypeScript interfaces
│   └── ...               # Service modules
├── package.json          # Function-specific dependencies
├── tsconfig.json         # TypeScript configuration
└── jest.config.js        # Test configuration
```

## Code Organization Patterns

### Component Structure
- Use functional components with TypeScript interfaces
- Co-locate tests with components in `__tests__/` directories
- Export components as named exports
- Use Material-UI's `sx` prop for styling

### API Integration
- Services in `src/services/` handle external API calls
- Use React Query for state management and caching
- Centralize API configuration and error handling

### Type Definitions
- Shared types in `src/types/` organized by domain
- Interface naming: `PascalCase` with descriptive names
- Export types from index files for clean imports

### Testing Strategy
- Unit tests co-located with source files
- Integration tests in dedicated test directories
- Use Testing Library for component testing
- Jest/Vitest for Lambda function testing