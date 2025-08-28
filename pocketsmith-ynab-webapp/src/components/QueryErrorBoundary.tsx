import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';
import { ApiErrorDisplay } from './ApiErrorDisplay';
import { isAuthError } from '../hooks/useAuthErrorHandler';

interface QueryErrorFallbackProps {
  error: any;
  resetErrorBoundary: () => void;
}

const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  // If it's an authentication error, show a more specific message
  if (isAuthError(error)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <ApiErrorDisplay 
          error={error} 
          onRetry={resetErrorBoundary}
          showDetails={false}
          variant="standard"
        />
      </Box>
    );
  }

  // For other API errors, show the full error display
  if (error?.code || error?.statusCode) {
    return (
      <Box sx={{ p: 3 }}>
        <ApiErrorDisplay 
          error={error} 
          onRetry={resetErrorBoundary}
          showDetails={true}
          variant="standard"
        />
      </Box>
    );
  }

  // For unexpected errors, show a generic error boundary
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Alert severity="error" icon={<BugReport />}>
        <AlertTitle>Something went wrong</AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          An unexpected error occurred while loading this content.
        </Typography>
        <Button
          variant="contained"
          onClick={resetErrorBoundary}
          startIcon={<Refresh />}
          size="small"
        >
          Try Again
        </Button>
      </Alert>
      
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {error?.message || String(error)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<QueryErrorFallbackProps>;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = QueryErrorFallback 
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={Fallback}
          onError={(error, errorInfo) => {
            console.error('Query Error Boundary caught an error:', error, errorInfo);
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default QueryErrorBoundary;