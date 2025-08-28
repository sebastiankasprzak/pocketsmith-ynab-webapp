# Authentication Implementation

This document describes the comprehensive authentication implementation for the PocketSmith-YNAB Sync WebApp.

## Overview

The application uses AWS Cognito for authentication with JWT tokens. All API calls are automatically authenticated using Bearer tokens, and the frontend handles authentication errors gracefully.

## Architecture

### Backend Authentication
- **JWT Validation**: All Lambda functions validate JWT tokens using `aws-jwt-verify`
- **Cognito Integration**: API Gateway uses Cognito User Pool authorizers
- **Error Handling**: Standardized authentication error responses across all endpoints

### Frontend Authentication
- **AWS Amplify**: Handles Cognito authentication flows
- **Automatic Token Management**: API client automatically includes JWT tokens
- **Session Management**: Automatic token refresh and session expiration handling

## Components

### Core Services

#### `authService.ts`
- Manages Cognito authentication
- Provides sign in/out functionality
- Handles token retrieval and refresh
- Supports development mode (auth disabled)

#### `apiClient.ts`
- Centralized HTTP client with authentication
- Automatic token injection in request headers
- Standardized error handling and retry logic
- Session expiration detection and handling

### React Components

#### `AuthProvider`
- React context for authentication state
- Manages user session and loading states
- Provides authentication methods to components

#### `ProtectedRoute`
- Wraps protected content
- Shows login form for unauthenticated users
- Displays loading state during auth checks

#### `LoginForm`
- Material-UI login interface
- Email/password authentication
- Error display and loading states

#### `UserProfile`
- User menu with profile information
- Sign out functionality
- Authentication status display

#### `AuthErrorHandler`
- Global authentication error handling
- Session expiration notifications
- Automatic sign out on auth failures

### Error Handling

#### `useAuthErrorHandler`
- React Query integration for auth errors
- Automatic query cache clearing on auth failures
- User-friendly error message mapping

#### `ApiErrorDisplay`
- Standardized error display component
- Authentication-specific error handling
- Expandable error details for debugging

#### `QueryErrorBoundary`
- Error boundary for React Query errors
- Graceful fallback UI for API failures
- Development mode error details

## Configuration

### Environment Variables

```bash
# Required for authentication
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_56erWzWed
VITE_COGNITO_USER_POOL_CLIENT_ID=6212o7rqtuggpjact1higuf12f
VITE_COGNITO_USER_POOL_DOMAIN=pocketsmith-ynab-webapp-staging-530919391492.auth.ap-southeast-2.amazoncognito.com
VITE_AWS_REGION=ap-southeast-2
VITE_API_BASE_URL=https://aqyuit04jc.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Development Mode
- Set `VITE_USE_MOCK_API=true` to use mock data without authentication
- Authentication is automatically disabled in development if Cognito config is missing

## API Integration

### Automatic Authentication
All API calls automatically include authentication headers:

```typescript
// No manual token management needed
const response = await apiClient.get('/accounts/pocketsmith');
```

### Error Handling
API errors are automatically handled with user-friendly messages:

```typescript
try {
  const data = await accountsApi.fetchAccounts();
} catch (error) {
  // Error is already formatted with user-friendly message
  console.error(error.message);
}
```

### React Query Integration
Authentication errors automatically trigger session cleanup:

```typescript
const { data, error } = useQuery({
  queryKey: ['accounts'],
  queryFn: accountsApi.fetchAccounts
});

// Authentication errors are handled automatically
// User will be signed out if session expires
```

## Security Features

### Token Management
- Automatic token refresh before expiration
- Secure token storage using AWS Amplify
- Token validation on every API request

### Session Security
- Automatic sign out on token expiration
- Session timeout handling
- Secure redirect flows

### Error Security
- No sensitive information in error messages
- Standardized error codes
- Audit logging for authentication events

## Usage Examples

### Protecting a Page
```typescript
// Pages are automatically protected by ProtectedRoute in App.tsx
export const MyPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      {/* Page content */}
    </div>
  );
};
```

### Making Authenticated API Calls
```typescript
// Authentication is handled automatically
const MyComponent: React.FC = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => apiClient.get('/my-endpoint')
  });

  if (error) {
    return <ApiErrorDisplay error={error} onRetry={refetch} />;
  }

  return <div>{/* Render data */}</div>;
};
```

### Handling Authentication State
```typescript
const MyComponent: React.FC = () => {
  const { isAuthenticated, loading, signOut } = useAuth();

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div>
      {isAuthenticated ? (
        <Button onClick={signOut}>Sign Out</Button>
      ) : (
        <div>Please sign in</div>
      )}
    </div>
  );
};
```

## Testing

### Development Testing
- Use staging environment with real Cognito credentials
- Mock API can be enabled with `VITE_USE_MOCK_API=true`
- Authentication is optional in development mode

### Production Testing
- All API endpoints require valid JWT tokens
- Session expiration is handled gracefully
- Error states are user-friendly

## Troubleshooting

### Common Issues

1. **"Authentication is not configured"**
   - Check environment variables are set correctly
   - Verify Cognito User Pool configuration

2. **"Token expired" errors**
   - Normal behavior - user will be automatically signed out
   - Check token refresh configuration

3. **API calls failing with 401**
   - Verify API Gateway authorizer configuration
   - Check Lambda function environment variables

### Debug Mode
Enable detailed logging in development:
```typescript
// Set in browser console
localStorage.setItem('debug', 'auth:*');
```

## Security Considerations

- Never log JWT tokens in production
- Use HTTPS for all API communications
- Implement proper CORS policies
- Regular security audits of dependencies
- Monitor authentication failures

## Future Enhancements

- Multi-factor authentication (MFA)
- Social login providers
- Role-based access control (RBAC)
- Session analytics and monitoring
- Advanced security headers