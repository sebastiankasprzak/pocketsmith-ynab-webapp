import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport,
  Home
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

// Error logging service for CloudWatch integration
class ErrorLogger {
  static async logError(error: Error, errorInfo: ErrorInfo, errorId: string, level: string) {
    try {
      // In a real implementation, this would send to CloudWatch
      const errorData = {
        errorId,
        level,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'anonymous'
      };
    } catch (loggingError) {
      // Silently fail error logging
    }
  }
}

// Error boundary component
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error
    ErrorLogger.logError(error, errorInfo, this.state.errorId, this.props.level || 'component');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        level={this.props.level || 'component'}
        onRetry={this.handleRetry}
        showDetails={this.state.showDetails}
        onToggleDetails={this.toggleDetails}
      />;
    }

    return this.props.children;
  }
}

// Error fallback component
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  level: string;
  onRetry: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  level,
  onRetry,
  showDetails,
  onToggleDetails
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const getErrorMessage = () => {
    if (!error) return 'An unexpected error occurred';

    // User-friendly error messages based on common error patterns
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again to continue.';
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You don\'t have permission to access this resource. Please contact support if you believe this is an error.';
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource could not be found. It may have been moved or deleted.';
    }
    
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'A server error occurred. Our team has been notified and is working to fix the issue.';
    }
    
    if (error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }

    // For component-level errors, provide more generic messages
    if (level === 'component') {
      return 'This section encountered an error and couldn\'t load properly.';
    }

    return 'Something went wrong. Please try refreshing the page or contact support if the problem persists.';
  };

  const getActionButtons = () => {
    const buttons = [
      <Button
        key="retry"
        variant="contained"
        startIcon={<Refresh />}
        onClick={onRetry}
        sx={{ minWidth: 120 }}
      >
        Try Again
      </Button>
    ];

    if (level === 'page' || level === 'critical') {
      buttons.push(
        <Button
          key="home"
          variant="outlined"
          startIcon={<Home />}
          onClick={handleGoHome}
          sx={{ minWidth: 120 }}
        >
          Go Home
        </Button>
      );
    }

    return buttons;
  };

  const getSeverity = () => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'page':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: level === 'component' ? 200 : 400,
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        <Alert 
          severity={getSeverity()}
          icon={<ErrorOutline />}
          sx={{ mb: 3, textAlign: 'left' }}
        >
          <AlertTitle>
            {level === 'critical' ? 'Critical Error' : 
             level === 'page' ? 'Page Error' : 'Component Error'}
          </AlertTitle>
          {getErrorMessage()}
        </Alert>

        <Stack spacing={2} alignItems="center">
          <Stack direction="row" spacing={2}>
            {getActionButtons()}
          </Stack>

          <Divider sx={{ width: '100%' }} />

          <Box sx={{ width: '100%' }}>
            <Button
              variant="text"
              size="small"
              startIcon={<BugReport />}
              endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
              onClick={onToggleDetails}
              sx={{ mb: 1 }}
            >
              Technical Details
            </Button>

            <Collapse in={showDetails}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Error ID: {errorId}
                </Typography>
                
                {error && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Error Message:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-word' }}>
                      {error.message}
                    </Typography>
                  </>
                )}

                {error?.stack && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Stack Trace:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        mb: 2, 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem'
                      }}
                    >
                      {error.stack}
                    </Typography>
                  </>
                )}

                {errorInfo?.componentStack && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Component Stack:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem'
                      }}
                    >
                      {errorInfo.componentStack}
                    </Typography>
                  </>
                )}
              </Paper>
            </Collapse>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    ErrorLogger.logError(error, { componentStack: context || 'Unknown' } as ErrorInfo, errorId, 'manual');
    
    // You could also trigger a toast notification here
  }, []);

  return { handleError };
};