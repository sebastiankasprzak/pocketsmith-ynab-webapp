import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { analyticsService } from './analyticsService';

interface ErrorContext {
  userId?: string;
  page?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
}

interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: ErrorContext;
  stack?: string;
  metadata?: Record<string, any>;
}

class ErrorLoggingService {
  private cloudWatchLogsClient: CloudWatchLogsClient;
  private logGroupName: string;
  private logStreamName: string;
  private isEnabled: boolean;
  private logBuffer: ErrorLogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 50;
  private sequenceToken?: string;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENVIRONMENT !== 'development';
    this.logGroupName = `/aws/webapp/pocketsmith-ynab-sync/${import.meta.env.VITE_ENVIRONMENT || 'development'}`;
    this.logStreamName = `webapp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (this.isEnabled) {
      this.cloudWatchLogsClient = new CloudWatchLogsClient({
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      });

      this.initializeLogStream();
      this.startPeriodicFlush();
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Log an error with context
   */
  async logError(error: Error, context?: ErrorContext): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'error',
      message: error.message,
      error,
      stack: error.stack,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
    };

    await this.addToBuffer(logEntry);

    // Also track in analytics
    analyticsService.trackError(error, {
      page: context?.page,
      userId: context?.userId ? this.hashUserId(context.userId) : undefined,
    });
  }

  /**
   * Log a warning message
   */
  async logWarning(message: string, context?: ErrorContext, metadata?: Record<string, any>): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'warn',
      message,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      metadata,
    };

    await this.addToBuffer(logEntry);
  }

  /**
   * Log an info message
   */
  async logInfo(message: string, context?: ErrorContext, metadata?: Record<string, any>): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'info',
      message,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      metadata,
    };

    await this.addToBuffer(logEntry);
  }

  /**
   * Log a debug message
   */
  async logDebug(message: string, context?: ErrorContext, metadata?: Record<string, any>): Promise<void> {
    if (import.meta.env.VITE_ENVIRONMENT === 'production') {
      return; // Skip debug logs in production
    }

    const logEntry: ErrorLogEntry = {
      level: 'debug',
      message,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      metadata,
    };

    await this.addToBuffer(logEntry);
  }

  /**
   * Log API errors with request/response details
   */
  async logApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    requestData?: any,
    responseData?: any
  ): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'error',
      message: `API Error: ${method} ${endpoint} - ${error.message}`,
      error,
      stack: error.stack,
      context: {
        ...this.getDefaultContext(),
        url: endpoint,
      },
      metadata: {
        endpoint,
        method,
        statusCode,
        requestData: this.sanitizeData(requestData),
        responseData: this.sanitizeData(responseData),
      },
    };

    await this.addToBuffer(logEntry);

    // Track API error in analytics
    analyticsService.trackUserAction({
      action: 'api_error',
      category: 'error',
      label: `${method} ${endpoint}`,
      value: statusCode || 0,
    });
  }

  /**
   * Log authentication errors
   */
  async logAuthError(error: Error, authAction: string, context?: ErrorContext): Promise<void> {
    const logEntry: ErrorLogEntry = {
      level: 'error',
      message: `Authentication Error: ${authAction} - ${error.message}`,
      error,
      stack: error.stack,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      metadata: {
        authAction,
      },
    };

    await this.addToBuffer(logEntry);

    // Track authentication error in analytics
    analyticsService.trackAuthentication('login_failure');
  }

  /**
   * Flush all buffered logs immediately
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || this.logBuffer.length === 0) {
      return;
    }

    try {
      const logEvents = this.logBuffer.map(entry => ({
        timestamp: Date.now(),
        message: JSON.stringify({
          level: entry.level,
          message: entry.message,
          stack: entry.stack,
          context: entry.context,
          metadata: entry.metadata,
        }),
      }));

      const command = new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents,
        sequenceToken: this.sequenceToken,
      });

      const response = await this.cloudWatchLogsClient.send(command);
      this.sequenceToken = response.nextSequenceToken;
      this.logBuffer = [];
    } catch (error) {
      // Don't throw here to avoid infinite loops
    }
  }

  private async addToBuffer(logEntry: ErrorLogEntry): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logBuffer.push(logEntry);

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  private async initializeLogStream(): Promise<void> {
    try {
      // Try to create log group (will fail if it already exists, which is fine)
      try {
        await this.cloudWatchLogsClient.send(new CreateLogGroupCommand({
          logGroupName: this.logGroupName,
        }));
      } catch (error) {
        // Log group might already exist, ignore error
      }

      // Create log stream
      await this.cloudWatchLogsClient.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      }));
    } catch (error) {
      this.isEnabled = false; // Disable logging if setup fails
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush().catch(() => {
        // Silently fail periodic flush
      });
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush().catch(() => {
        // Ignore errors during page unload
      });
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          page: window.location.pathname,
          url: window.location.href,
        }
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(
        new Error(`Global Error: ${event.message}`),
        {
          page: window.location.pathname,
          url: window.location.href,
        }
      );
    });

    // Handle React error boundary errors (if using error boundaries)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this looks like a React error
      const message = args.join(' ');
      if (message.includes('React') || message.includes('component')) {
        this.logError(
          new Error(`React Error: ${message}`),
          {
            page: window.location.pathname,
            url: window.location.href,
          }
        );
      }
      originalConsoleError.apply(console, args);
    };
  }

  private getDefaultContext(): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      buildVersion: import.meta.env.VITE_BUILD_VERSION || 'unknown',
      sessionId: this.getSessionId(),
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('errorLoggingSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('errorLoggingSessionId', sessionId);
    }
    return sessionId;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization', 'cookie'];
    
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitize(value);
        }
      }
      return sanitized;
    };

    return sanitize(data);
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const errorLoggingService = new ErrorLoggingService();

// Export types
export type { ErrorContext, ErrorLogEntry };