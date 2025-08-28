import { type AxiosError } from 'axios';

export interface ErrorDetails {
  message: string;
  userMessage: string;
  actionable: boolean;
  actions: ErrorAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'auth' | 'validation' | 'server' | 'client' | 'unknown';
  retryable: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'fatal';
}

export interface ErrorAction {
  label: string;
  action: 'retry' | 'refresh' | 'login' | 'navigate' | 'contact' | 'custom';
  target?: string;
  handler?: () => void;
}

export class ErrorHandler {
  /**
   * Parse and categorize errors to provide user-friendly messages
   */
  static parseError(error: unknown): ErrorDetails {
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      return this.handleJavaScriptError(error);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.handleStringError(error);
    }

    // Handle unknown errors
    return this.handleUnknownError(error);
  }

  private static isAxiosError(error: unknown): error is AxiosError {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
  }

  private static handleAxiosError(error: AxiosError): ErrorDetails {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const responseData = error.response?.data as any;

    // Network errors (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          message: `Request timeout: ${error.message}`,
          userMessage: 'The request took too long to complete. This might be due to a slow connection or server issues.',
          actionable: true,
          actions: [
            { label: 'Try Again', action: 'retry' },
            { label: 'Check Connection', action: 'custom', handler: () => window.open('https://www.google.com', '_blank') }
          ],
          severity: 'medium',
          category: 'network',
          retryable: true,
          logLevel: 'warn'
        };
      }

      return {
        message: `Network error: ${error.message}`,
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        actionable: true,
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Refresh Page', action: 'refresh' }
        ],
        severity: 'high',
        category: 'network',
        retryable: true,
        logLevel: 'error'
      };
    }

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          message: `Bad Request: ${responseData?.error?.message || statusText}`,
          userMessage: responseData?.error?.message || 'The request contains invalid data. Please check your input and try again.',
          actionable: true,
          actions: [
            { label: 'Review Input', action: 'custom' },
            { label: 'Try Again', action: 'retry' }
          ],
          severity: 'medium',
          category: 'validation',
          retryable: false,
          logLevel: 'warn'
        };

      case 401:
        return {
          message: `Unauthorized: ${responseData?.error?.message || statusText}`,
          userMessage: 'Your session has expired or you don\'t have permission to access this resource. Please log in again.',
          actionable: true,
          actions: [
            { label: 'Log In', action: 'login' },
            { label: 'Go Home', action: 'navigate', target: '/' }
          ],
          severity: 'high',
          category: 'auth',
          retryable: false,
          logLevel: 'warn'
        };

      case 403:
        return {
          message: `Forbidden: ${responseData?.error?.message || statusText}`,
          userMessage: 'You don\'t have permission to perform this action. Please contact support if you believe this is an error.',
          actionable: true,
          actions: [
            { label: 'Contact Support', action: 'contact' },
            { label: 'Go Home', action: 'navigate', target: '/' }
          ],
          severity: 'high',
          category: 'auth',
          retryable: false,
          logLevel: 'warn'
        };

      case 404:
        return {
          message: `Not Found: ${responseData?.error?.message || statusText}`,
          userMessage: 'The requested resource could not be found. It may have been moved or deleted.',
          actionable: true,
          actions: [
            { label: 'Go Home', action: 'navigate', target: '/' },
            { label: 'Try Again', action: 'retry' }
          ],
          severity: 'medium',
          category: 'client',
          retryable: false,
          logLevel: 'warn'
        };

      case 409:
        return {
          message: `Conflict: ${responseData?.error?.message || statusText}`,
          userMessage: responseData?.error?.message || 'There was a conflict with the current state. Please refresh and try again.',
          actionable: true,
          actions: [
            { label: 'Refresh Page', action: 'refresh' },
            { label: 'Try Again', action: 'retry' }
          ],
          severity: 'medium',
          category: 'validation',
          retryable: true,
          logLevel: 'warn'
        };

      case 422:
        return {
          message: `Validation Error: ${responseData?.error?.message || statusText}`,
          userMessage: responseData?.error?.message || 'The data you provided is invalid. Please check your input and try again.',
          actionable: true,
          actions: [
            { label: 'Review Input', action: 'custom' },
            { label: 'Try Again', action: 'retry' }
          ],
          severity: 'medium',
          category: 'validation',
          retryable: false,
          logLevel: 'warn'
        };

      case 429:
        return {
          message: `Rate Limited: ${responseData?.error?.message || statusText}`,
          userMessage: 'Too many requests have been made. Please wait a moment before trying again.',
          actionable: true,
          actions: [
            { label: 'Wait and Retry', action: 'retry' }
          ],
          severity: 'medium',
          category: 'client',
          retryable: true,
          logLevel: 'warn'
        };

      case 500:
        return {
          message: `Internal Server Error: ${responseData?.error?.message || statusText}`,
          userMessage: 'A server error occurred. Our team has been notified and is working to fix the issue.',
          actionable: true,
          actions: [
            { label: 'Try Again Later', action: 'retry' },
            { label: 'Contact Support', action: 'contact' }
          ],
          severity: 'high',
          category: 'server',
          retryable: true,
          logLevel: 'error'
        };

      case 502:
      case 503:
      case 504:
        return {
          message: `Service Unavailable: ${responseData?.error?.message || statusText}`,
          userMessage: 'The service is temporarily unavailable. Please try again in a few minutes.',
          actionable: true,
          actions: [
            { label: 'Try Again', action: 'retry' },
            { label: 'Check Status', action: 'custom', handler: () => window.open('/status', '_blank') }
          ],
          severity: 'high',
          category: 'server',
          retryable: true,
          logLevel: 'error'
        };

      default:
        return {
          message: `HTTP ${status}: ${responseData?.error?.message || statusText || 'Unknown error'}`,
          userMessage: responseData?.error?.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.',
          actionable: true,
          actions: [
            { label: 'Try Again', action: 'retry' },
            { label: 'Contact Support', action: 'contact' }
          ],
          severity: 'medium',
          category: 'unknown',
          retryable: true,
          logLevel: 'error'
        };
    }
  }

  private static handleJavaScriptError(error: Error): ErrorDetails {
    const message = error.message.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch')) {
      return {
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        actionable: true,
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Refresh Page', action: 'refresh' }
        ],
        severity: 'high',
        category: 'network',
        retryable: true,
        logLevel: 'error'
      };
    }

    // Parsing errors
    if (message.includes('json') || message.includes('parse')) {
      return {
        message: error.message,
        userMessage: 'The server returned invalid data. This is likely a temporary issue.',
        actionable: true,
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Contact Support', action: 'contact' }
        ],
        severity: 'medium',
        category: 'server',
        retryable: true,
        logLevel: 'warn'
      };
    }

    // Permission errors
    if (message.includes('permission') || message.includes('denied')) {
      return {
        message: error.message,
        userMessage: 'Permission denied. You may not have access to this resource.',
        actionable: true,
        actions: [
          { label: 'Log In', action: 'login' },
          { label: 'Contact Support', action: 'contact' }
        ],
        severity: 'high',
        category: 'auth',
        retryable: false,
        logLevel: 'warn'
      };
    }

    // Generic JavaScript error
    return {
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
      actionable: true,
      actions: [
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Contact Support', action: 'contact' }
      ],
      severity: 'medium',
      category: 'client',
      retryable: true,
      logLevel: 'error'
    };
  }

  private static handleStringError(error: string): ErrorDetails {
    return {
      message: error,
      userMessage: error.length > 100 ? 'An error occurred. Please try again or contact support.' : error,
      actionable: true,
      actions: [
        { label: 'Try Again', action: 'retry' }
      ],
      severity: 'medium',
      category: 'unknown',
      retryable: true,
      logLevel: 'warn'
    };
  }

  private static handleUnknownError(error: unknown): ErrorDetails {
    return {
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
      actionable: true,
      actions: [
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Contact Support', action: 'contact' }
      ],
      severity: 'medium',
      category: 'unknown',
      retryable: true,
      logLevel: 'error'
    };
  }

  /**
   * Get retry delay based on attempt number (exponential backoff)
   */
  static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
  }

  /**
   * Check if an error should be retried automatically
   */
  static shouldAutoRetry(error: ErrorDetails, attempt: number, maxAttempts: number = 3): boolean {
    return (
      error.retryable &&
      attempt < maxAttempts &&
      (error.category === 'network' || error.category === 'server') &&
      error.severity !== 'critical'
    );
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: unknown, context?: string): {
    message: string;
    stack?: string;
    context?: string;
    timestamp: string;
    level: string;
  } {
    const details = this.parseError(error);
    
    return {
      message: details.message,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      level: details.logLevel
    };
  }
}

/**
 * Specific error handlers for common scenarios
 */
export class SpecificErrorHandlers {
  /**
   * Handle API authentication errors
   */
  static handleAuthError(error: unknown): ErrorDetails {
    const details = ErrorHandler.parseError(error);
    
    if (details.category === 'auth') {
      return details;
    }

    // Override for non-auth errors that might be auth-related
    return {
      ...details,
      userMessage: 'Authentication failed. Please log in again to continue.',
      actions: [
        { label: 'Log In', action: 'login' },
        { label: 'Go Home', action: 'navigate', target: '/' }
      ],
      category: 'auth'
    };
  }

  /**
   * Handle sync operation errors
   */
  static handleSyncError(error: unknown): ErrorDetails {
    const details = ErrorHandler.parseError(error);
    
    // Add sync-specific context
    return {
      ...details,
      userMessage: details.category === 'network' 
        ? 'Unable to connect to the sync service. Please check your connection and try again.'
        : details.category === 'server'
        ? 'The sync service is experiencing issues. Please try again later.'
        : details.userMessage,
      actions: [
        { label: 'Retry Sync', action: 'retry' },
        { label: 'Check Status', action: 'navigate', target: '/sync-status' },
        ...details.actions.filter(a => a.action !== 'retry')
      ]
    };
  }

  /**
   * Handle account mapping errors
   */
  static handleMappingError(error: unknown): ErrorDetails {
    const details = ErrorHandler.parseError(error);
    
    return {
      ...details,
      userMessage: details.category === 'validation'
        ? 'The account mapping configuration is invalid. Please check your selections and try again.'
        : details.userMessage,
      actions: [
        { label: 'Review Mappings', action: 'custom' },
        { label: 'Reset Mappings', action: 'custom' },
        ...details.actions
      ]
    };
  }

  /**
   * Handle balance comparison errors
   */
  static handleBalanceError(error: unknown): ErrorDetails {
    const details = ErrorHandler.parseError(error);
    
    return {
      ...details,
      userMessage: details.category === 'network'
        ? 'Unable to fetch balance data from PocketSmith or YNAB. Please check your API credentials and try again.'
        : details.userMessage,
      actions: [
        { label: 'Refresh Balances', action: 'retry' },
        { label: 'Check Credentials', action: 'navigate', target: '/account-mappings' },
        ...details.actions.filter(a => a.action !== 'retry')
      ]
    };
  }
}