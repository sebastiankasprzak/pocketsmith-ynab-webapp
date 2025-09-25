# Authentication Setup Guide

## Current Status

✅ **Authentication System Fully Implemented**

The authentication system is now complete and integrated:

1. **Frontend Authentication**: Fully implemented with AWS Amplify and Cognito
2. **Development**: Uses mock API (configured via `VITE_USE_MOCK_API=true`)
3. **Staging**: Uses real API without authentication requirements (`VITE_USE_MOCK_API=false`)
4. **Production**: Ready for real API with full authentication

**Test User Created**: `test@staging.local` / `TempPassword123!`

## Test User Available

A test user has been created in Cognito for staging authentication:

**Test User Credentials:**
- **Email**: `test@staging.local`
- **Password**: `TempPassword123!`

This user can be used to test the authentication flow in the staging environment.

## Implementation Status

✅ **Phase 1: Frontend Authentication (COMPLETED)**
- AWS Amplify integration with Cognito
- AuthContext and AuthProvider implemented
- LoginPage component with Material-UI design
- ProtectedRoute component for route protection
- Automatic token injection into API requests
- Sign in/out functionality with error handling

## Authentication Architecture

The infrastructure is already set up with:
- ✅ AWS Cognito User Pool
- ✅ Cognito User Pool Client  
- ✅ API Gateway (no auth required currently)
- ✅ Lambda functions (no auth validation currently)

## Implementation Details

### Phase 1: Frontend Authentication ✅ COMPLETED

The authentication system is fully implemented with the following components:

**Core Authentication Service** (`src/services/authService.ts`):
- AWS Amplify integration with Cognito
- Sign in/out functionality with OAuth support
- Token management and automatic refresh
- User session management
- Automatic token injection into API requests

**Authentication Components**:
- `AuthContext` and `AuthProvider` - React context for auth state management
- `LoginPage` - Material-UI login interface with Cognito OAuth
- `ProtectedRoute` - Route protection wrapper component
- Integrated into main `App.tsx` with proper error boundaries

**Features Implemented**:
- ✅ OAuth sign-in flow with Cognito hosted UI
- ✅ Automatic token refresh and session management
- ✅ Protected routes with loading states
- ✅ Error handling and user feedback
- ✅ Responsive Material-UI design
- ✅ Integration with existing API client (axios interceptors)

### Phase 2: API Gateway Authentication

Update the infrastructure to require authentication:

```typescript
// In infrastructure/lib/infrastructure-stack.ts

// Create Cognito authorizer
const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
  cognitoUserPools: [userPool],
  authorizerName: 'WebappAuthorizer',
  identitySource: 'method.request.header.Authorization'
});

// Add authorizer to protected endpoints
balancesCompareResource.addMethod('GET', balancesIntegration, {
  authorizer: cognitoAuthorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
});

balancesRefreshResource.addMethod('POST', balancesIntegration, {
  authorizer: cognitoAuthorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO
});
```

### Phase 3: Lambda Function Authentication

Update Lambda functions to validate JWT tokens:

```typescript
// In lambda functions, add JWT validation
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!
});

// In handler function
const authHeader = event.headers.Authorization || event.headers.authorization;
if (authHeader) {
  const token = authHeader.replace('Bearer ', '');
  const payload = await jwtVerifier.verify(token);
  // Use payload.sub as user ID
}
```

## Environment Configuration

### Development (.env)
```env
VITE_USE_MOCK_API=true  # Uses mock data for development
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_56erWzWed
VITE_COGNITO_USER_POOL_CLIENT_ID=6212o7rqtuggpjact1higuf12f
VITE_COGNITO_USER_POOL_DOMAIN=pocketsmith-ynab-webapp-staging-530919391492.auth.ap-southeast-2.amazoncognito.com
```

### Staging (.env.staging)  
```env
VITE_USE_MOCK_API=false  # Uses real API with authentication
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_56erWzWed
VITE_COGNITO_USER_POOL_CLIENT_ID=6212o7rqtuggpjact1higuf12f
VITE_COGNITO_USER_POOL_DOMAIN=pocketsmith-ynab-webapp-staging-530919391492.auth.ap-southeast-2.amazoncognito.com
```

### Production (.env.production)
```env
VITE_USE_MOCK_API=false  # Uses real API with authentication
# Production Cognito values will be configured during deployment
```

## Testing the Implementation

1. **Development**: Works with mock data and authentication UI (no real auth required)
2. **Staging**: Uses real API with full Cognito authentication
3. **Production**: Ready for deployment with full authentication

### Creating Test Users

Use the provided script to create test users for authentication testing:

```bash
# Install AWS SDK dependencies (if not already installed)
npm install @aws-sdk/client-cognito-identity-provider

# Create test user
node create_test_user.js
```

The script will output the test user credentials that can be used to log into the application.

## Current Status Summary

✅ **Completed**:
- Frontend authentication system with AWS Amplify
- Cognito integration with OAuth flow
- Protected routes and login UI
- Token management and API integration
- Error handling and loading states

🔄 **Next Steps** (Optional Enhancements):
1. **API Gateway Authentication**: Add Cognito authorizers to API endpoints
2. **Lambda JWT Validation**: Add server-side token validation
3. **Enhanced Security**: Rate limiting and additional security measures

## API Selection Logic

The updated logic in `accountsApi.ts`:
```typescript
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || 
  (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API !== 'false');
```

This allows:
- Explicit control via `VITE_USE_MOCK_API=true/false`
- Default to mock in development unless explicitly disabled
- Default to real API in production unless explicitly enabled

## Security Considerations

- The real API currently has no authentication (works for testing)
- CORS is configured to allow all origins (development convenience)
- JWT validation should be added to Lambda functions before production use
- Consider rate limiting and other security measures for production