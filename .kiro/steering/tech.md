---
inclusion: always
---

# Technology Stack & Development Guidelines

## CRITICAL: Two Separate Node.js Projects

**⚠️ IMPORTANT**: This repository contains TWO COMPLETELY SEPARATE Node.js projects:

1. **Frontend Project**: `pocketsmith-ynab-webapp/` directory
   - Has its own `package.json`, `node_modules/`, and npm dependencies
   - React TypeScript webapp with Vite build system

2. **Infrastructure Project**: `infrastructure/` directory  
   - Has its own `package.json`, `node_modules/`, and npm dependencies
   - AWS CDK TypeScript project for cloud infrastructure

**NEVER run npm commands from the root directory** - always `cd` into the specific project directory first.

### Common Mistakes to Avoid
- ❌ Running `npm install` from project root (there's no package.json there)
- ❌ Trying to install frontend dependencies in infrastructure/ directory
- ❌ Trying to install CDK dependencies in pocketsmith-ynab-webapp/ directory
- ❌ Running `npm run dev` from infrastructure/ (it's a CDK project, not a web server)
- ❌ Running `npx cdk` commands from pocketsmith-ynab-webapp/ directory

### Correct Workflow Examples
```bash
# Working on frontend
cd pocketsmith-ynab-webapp
npm install
npm run dev

# Working on infrastructure  
cd infrastructure
npm install
npx cdk synth
```

## Frontend Stack (pocketsmith-ynab-webapp/)

### Required Technologies
- **React 19** with TypeScript - Use functional components with proper TypeScript interfaces
- **Material-UI v7** - Use `sx` prop for styling, follow MUI theming patterns
- **React Router v7** - Use declarative routing with proper TypeScript route definitions
- **TanStack React Query v5** - Handle all API state management and caching
- **AWS Amplify** - Integrate Cognito authentication (OAuth flows, session management)

### Code Style Requirements
- **Components**: Export as named exports, use PascalCase naming
- **Hooks**: Prefix with `use`, place in `src/hooks/` directory
- **Types**: Define in `src/types/`, use PascalCase interfaces
- **Services**: Place API clients in `src/services/`, use camelCase naming
- **Testing**: Co-locate tests in `__tests__/` directories, use Testing Library patterns

### Development Commands
```bash
# ALWAYS cd into the frontend directory first
cd pocketsmith-ynab-webapp

# Then run frontend commands
npm install          # Install frontend dependencies
npm run dev          # Development server (localhost:5173)
npm run test         # Run Vitest unit tests
npm run lint         # ESLint with TypeScript rules
npm run type-check   # TypeScript validation
npm run build        # Build for production
```

## Infrastructure Stack (infrastructure/)

**Location**: `infrastructure/` directory
**Package Manager**: npm (has its own separate package.json and node_modules)
**Purpose**: AWS CDK project for cloud infrastructure deployment

### Required Technologies
- **AWS CDK v2** with TypeScript - Define all infrastructure as code
- **Node.js 18+** - Lambda runtime, use async/await patterns
- **Jest** - Infrastructure and Lambda function testing

### AWS Architecture Patterns
- **API Gateway + Lambda** - RESTful APIs with proper error handling
- **Cognito** - User authentication and authorization
- **Parameter Store** - Configuration management (never hardcode secrets)
- **CloudWatch** - Comprehensive logging and monitoring

### Lambda Function Guidelines
- Place each function in `lambda/{function-name}/` directory
- Use TypeScript with proper type definitions in `types.ts`
- Include comprehensive error handling and logging
- Write unit tests for all business logic

### Infrastructure Commands
```bash
# ALWAYS cd into the infrastructure directory first
cd infrastructure

# Then run infrastructure commands
npm install          # Install infrastructure dependencies
npm run build        # Compile TypeScript
npm run test         # Jest tests
npx cdk synth        # Generate CloudFormation
npx cdk deploy       # Deploy to AWS
npx cdk diff         # Compare with deployed stack
```

## Development Patterns

### API Integration
- Use React Query for all external API calls
- Centralize API configuration in services
- Implement proper error boundaries and loading states
- Cache responses appropriately with React Query

### State Management
- Use React Query for server state
- Use React Context for global UI state
- Avoid prop drilling - use context or React Query

### Error Handling
- Implement ErrorBoundary components
- Use consistent error logging patterns
- Provide user-friendly error messages
- Log errors to CloudWatch in Lambda functions

### Testing Strategy
- Unit tests for all components and hooks
- Integration tests for API interactions
- Mock external dependencies consistently
- Maintain high test coverage (>80%)

## File Organization Rules

### Frontend Structure
```
src/
├── components/     # Reusable UI components + __tests__/
├── pages/         # Route-level components
├── hooks/         # Custom React hooks + __tests__/
├── services/      # API clients and external services
├── contexts/      # React context providers + __tests__/
├── types/         # TypeScript type definitions
└── utils/         # Pure utility functions
```

### Lambda Structure
```
lambda/{function-name}/
├── src/
│   ├── index.ts      # Handler entry point
│   ├── types.ts      # Function-specific types
│   └── __tests__/    # Unit tests
└── package.json      # Function dependencies
```

## Deployment
- Use `./deploy_wrapper.sh` for full deployment (runs from project root)
- Frontend deploys to S3 + CloudFront
- Infrastructure managed via CDK
- Environment-specific configurations via Parameter Store

## Project Directory Reminders

**When working with files or running commands, always be aware of which project you're in:**

- **Frontend work**: Always `cd pocketsmith-ynab-webapp` first
  - React components, hooks, pages, services
  - Vite configuration, TypeScript config
  - Frontend dependencies and npm scripts

- **Infrastructure work**: Always `cd infrastructure` first  
  - CDK stacks, Lambda functions
  - AWS resource definitions
  - Infrastructure dependencies and CDK commands

- **Root level**: Only for deployment script and project documentation
  - `./deploy_wrapper.sh` (deployment script)
  - `README.md` (project overview)
  - `.kiro/` (Kiro configuration)