import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle, Stack } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';
import { IOSCapabilities } from '../hooks/useIOSDetection';

interface IOSEnhancementError extends Error {
  capability?: keyof IOSCapabilities;
  fallbackComponent?: React.ComponentType<any>;
  isIOSSpecific?: boolean;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: IOSEnhancementError, errorInfo: ErrorInfo) => void;
  capabilities?: IOSCapabilities;
  enableFallback?: boolean;
}

interface State {
  hasError: boolean;
  error: IOSEnhancementError | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  shouldUseFallback: boolean;
}

/**
 * iOS-specific error boundary that provides graceful degradation
 * for iOS enhancement failures
 */
export class IOSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      shouldUseFallback: false,
    };
  }

  static getDerivedStateFromError(error: IOSEnhancementError): Partial<State> {
    const errorId = `ios_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      shouldUseFallback: false, // Always start with error UI, not fallback
    };
  }

  componentDidCatch(error: IOSEnhancementError, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log iOS-specific error details
    this.logIOSError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logIOSError = (error: IOSEnhancementError, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      type: 'iOS Enhancement Error',
      capability: error.capability,
      isIOSSpecific: error.isIOSSpecific,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      capabilities: this.props.capabilities,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🍎 iOS Enhancement Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.table(errorData);
      console.groupEnd();
    }

    // In production, this would send to CloudWatch or error tracking service
    try {
      // Placeholder for error tracking service
      // errorTrackingService.logError(errorData);
    } catch (loggingError) {
      console.debug('Error logging failed:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      shouldUseFallback: false,
    });
  };

  handleUseFallback = () => {
    this.setState({ shouldUseFallback: true });
  };

  render() {
    if (this.state.hasError) {
      const { error, shouldUseFallback } = this.state;
      const { fallback, enableFallback = true } = this.props;

      // If we should use fallback and it's available, render the fallback component
      if (shouldUseFallback && enableFallback && error?.fallbackComponent) {
        const FallbackComponent = error.fallbackComponent;
        return <FallbackComponent />;
      }

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default iOS error UI
      return (
        <IOSErrorFallback
          error={error}
          errorId={this.state.errorId}
          capabilities={this.props.capabilities}
          onRetry={this.handleRetry}
          onUseFallback={enableFallback && !!error?.fallbackComponent ? this.handleUseFallback : undefined}
          canUseFallback={enableFallback && !!error?.fallbackComponent}
        />
      );
    }

    return this.props.children;
  }
}

interface IOSErrorFallbackProps {
  error: IOSEnhancementError | null;
  errorId: string;
  capabilities?: IOSCapabilities;
  onRetry: () => void;
  onUseFallback?: () => void;
  canUseFallback?: boolean;
}

const IOSErrorFallback: React.FC<IOSErrorFallbackProps> = ({
  error,
  errorId,
  capabilities,
  onRetry,
  onUseFallback,
  canUseFallback,
}) => {
  const getErrorMessage = () => {
    if (!error) return 'An iOS enhancement error occurred';

    // iOS-specific error messages
    if (error.capability === 'supportsHaptics') {
      return 'Haptic feedback is not available on this device. The app will continue to work without haptic feedback.';
    }

    if (error.capability === 'hasNotch' || error.capability === 'hasDynamicIsland') {
      return 'Safe area detection failed. The app layout may not perfectly adapt to your device screen.';
    }

    if (error.message.includes('iOS theme')) {
      return 'iOS theme could not be applied. The app will use the standard theme instead.';
    }

    if (error.message.includes('animation')) {
      return 'iOS animations could not be loaded. The app will work without enhanced animations.';
    }

    if (error.isIOSSpecific) {
      return 'An iOS-specific feature encountered an error. The app will continue with standard functionality.';
    }

    return 'An iOS enhancement failed to load. The app will continue with reduced iOS-specific features.';
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

    if (canUseFallback && onUseFallback) {
      buttons.push(
        <Button
          key="fallback"
          variant="outlined"
          onClick={onUseFallback}
          sx={{ minWidth: 120 }}
        >
          Use Standard Version
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        p: 3,
        // Use iOS-style background if possible
        backgroundColor: capabilities?.isIOS ? 'rgba(242, 242, 247, 0.8)' : 'background.default',
      }}
    >
      <Alert 
        severity="warning"
        icon={<ErrorOutline />}
        sx={{ 
          mb: 3, 
          maxWidth: 500,
          // iOS-style alert styling
          ...(capabilities?.isIOS && {
            borderRadius: 2,
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            border: '1px solid rgba(255, 204, 0, 0.3)',
          })
        }}
      >
        <AlertTitle>iOS Enhancement Error</AlertTitle>
        {getErrorMessage()}
      </Alert>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {getActionButtons()}
      </Stack>

      {process.env.NODE_ENV === 'development' && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontFamily: 'monospace' }}
        >
          Error ID: {errorId}
          {error?.capability && ` | Capability: ${error.capability}`}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Higher-order component for wrapping iOS components with error boundaries
 */
export const withIOSErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallbackComponent?: React.ComponentType<P>;
    capability?: keyof IOSCapabilities;
    enableFallback?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => (
    <IOSErrorBoundary
      enableFallback={options?.enableFallback}
      onError={(error) => {
        // Enhance error with capability information
        if (options?.capability) {
          (error as IOSEnhancementError).capability = options.capability;
        }
        if (options?.fallbackComponent) {
          (error as IOSEnhancementError).fallbackComponent = options.fallbackComponent;
        }
        (error as IOSEnhancementError).isIOSSpecific = true;
      }}
    >
      <Component {...props} />
    </IOSErrorBoundary>
  );

  WrappedComponent.displayName = `withIOSErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for handling iOS-specific errors programmatically
 */
export const useIOSErrorHandler = () => {
  const handleIOSError = React.useCallback((
    error: Error, 
    capability?: keyof IOSCapabilities,
    context?: string
  ) => {
    const enhancedError = error as IOSEnhancementError;
    enhancedError.capability = capability;
    enhancedError.isIOSSpecific = true;
    
    const errorId = `ios_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the error
    if (process.env.NODE_ENV === 'development') {
      console.group('🍎 iOS Error Handler');
      console.error('Error:', error);
      console.error('Capability:', capability);
      console.error('Context:', context);
      console.groupEnd();
    }

    // Throw the enhanced error to be caught by error boundary
    throw enhancedError;
  }, []);

  return { handleIOSError };
};

export default IOSErrorBoundary;