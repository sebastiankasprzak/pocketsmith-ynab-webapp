import { ErrorInfo } from 'react';
import { IOSCapabilities } from '../hooks/useIOSDetection';

/**
 * iOS-specific error logging service
 * Handles logging of iOS enhancement failures and capability issues
 */

export interface IOSErrorData {
  errorId: string;
  type: 'iOS Enhancement Error' | 'Capability Error' | 'Progressive Enhancement Error';
  capability?: keyof IOSCapabilities;
  isIOSSpecific: boolean;
  message: string;
  stack?: string;
  componentStack?: string;
  capabilities: IOSCapabilities;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  environment: 'development' | 'staging' | 'production';
}

export interface IOSPerformanceData {
  eventId: string;
  type: 'Animation Performance' | 'Component Load Time' | 'Gesture Response';
  duration: number;
  capability?: keyof IOSCapabilities;
  componentName?: string;
  timestamp: string;
  capabilities: IOSCapabilities;
}

class IOSErrorLoggingService {
  private static instance: IOSErrorLoggingService;
  private errorQueue: IOSErrorData[] = [];
  private performanceQueue: IOSPerformanceData[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxQueueSize: number = 100;

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Flush queue periodically
    setInterval(() => this.flushQueues(), 30000); // Every 30 seconds
  }

  public static getInstance(): IOSErrorLoggingService {
    if (!IOSErrorLoggingService.instance) {
      IOSErrorLoggingService.instance = new IOSErrorLoggingService();
    }
    return IOSErrorLoggingService.instance;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.flushQueues();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  /**
   * Log iOS-specific errors
   */
  public logIOSError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    capabilities: IOSCapabilities,
    capability?: keyof IOSCapabilities,
    isIOSSpecific: boolean = true
  ): void {
    const errorData: IOSErrorData = {
      errorId,
      type: 'iOS Enhancement Error',
      capability,
      isIOSSpecific,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      capabilities,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: this.getBuildVersion(),
      environment: this.getEnvironment(),
    };

    this.queueError(errorData);
    this.logToConsole(errorData);
  }

  /**
   * Log capability-specific errors
   */
  public logCapabilityError(
    capability: keyof IOSCapabilities,
    error: Error,
    capabilities: IOSCapabilities,
    context?: string
  ): void {
    const errorId = `capability_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorData: IOSErrorData = {
      errorId,
      type: 'Capability Error',
      capability,
      isIOSSpecific: true,
      message: `${capability} capability error: ${error.message}${context ? ` (Context: ${context})` : ''}`,
      stack: error.stack,
      componentStack: context || 'Unknown',
      capabilities,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: this.getBuildVersion(),
      environment: this.getEnvironment(),
    };

    this.queueError(errorData);
    this.logToConsole(errorData);
  }

  /**
   * Log progressive enhancement failures
   */
  public logProgressiveEnhancementError(
    componentName: string,
    error: Error,
    capabilities: IOSCapabilities,
    fallbackUsed: boolean = false
  ): void {
    const errorId = `pe_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorData: IOSErrorData = {
      errorId,
      type: 'Progressive Enhancement Error',
      isIOSSpecific: true,
      message: `Progressive enhancement failed for ${componentName}: ${error.message}${fallbackUsed ? ' (Fallback used)' : ''}`,
      stack: error.stack,
      componentStack: componentName,
      capabilities,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: this.getBuildVersion(),
      environment: this.getEnvironment(),
    };

    this.queueError(errorData);
    this.logToConsole(errorData);
  }

  /**
   * Log iOS performance metrics
   */
  public logPerformanceMetric(
    type: IOSPerformanceData['type'],
    duration: number,
    capabilities: IOSCapabilities,
    componentName?: string,
    capability?: keyof IOSCapabilities
  ): void {
    const performanceData: IOSPerformanceData = {
      eventId: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      duration,
      capability,
      componentName,
      timestamp: new Date().toISOString(),
      capabilities,
    };

    this.queuePerformanceData(performanceData);
    
    // Log slow performance to console in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`🐌 Slow iOS performance detected:`, performanceData);
    }
  }

  private queueError(errorData: IOSErrorData): void {
    this.errorQueue.push(errorData);
    
    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Try to flush immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }
  }

  private queuePerformanceData(performanceData: IOSPerformanceData): void {
    this.performanceQueue.push(performanceData);
    
    // Prevent queue from growing too large
    if (this.performanceQueue.length > this.maxQueueSize) {
      this.performanceQueue = this.performanceQueue.slice(-this.maxQueueSize);
    }

    // Try to flush immediately if online
    if (this.isOnline) {
      this.flushQueues();
    }
  }

  private async flushQueues(): Promise<void> {
    if (!this.isOnline || (this.errorQueue.length === 0 && this.performanceQueue.length === 0)) {
      return;
    }

    try {
      // Flush errors
      if (this.errorQueue.length > 0) {
        await this.sendErrors([...this.errorQueue]);
        this.errorQueue = [];
      }

      // Flush performance data
      if (this.performanceQueue.length > 0) {
        await this.sendPerformanceData([...this.performanceQueue]);
        this.performanceQueue = [];
      }
    } catch (error) {
      console.debug('Failed to flush iOS error logs:', error);
      // Keep data in queue for next attempt
    }
  }

  private async sendErrors(errors: IOSErrorData[]): Promise<void> {
    // In a real implementation, this would send to CloudWatch, Sentry, or another logging service
    if (process.env.NODE_ENV === 'development') {
      console.group('📤 Sending iOS Error Logs');
      console.table(errors);
      console.groupEnd();
      return;
    }

    // Placeholder for actual error reporting service
    try {
      // Example: Send to CloudWatch Logs
      // await fetch('/api/logs/ios-errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors })
      // });
    } catch (error) {
      throw new Error(`Failed to send iOS error logs: ${error}`);
    }
  }

  private async sendPerformanceData(performanceData: IOSPerformanceData[]): Promise<void> {
    // In a real implementation, this would send to CloudWatch Metrics or similar
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Sending iOS Performance Data');
      console.table(performanceData);
      console.groupEnd();
      return;
    }

    // Placeholder for actual metrics service
    try {
      // Example: Send to CloudWatch Metrics
      // await fetch('/api/metrics/ios-performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ metrics: performanceData })
      // });
    } catch (error) {
      throw new Error(`Failed to send iOS performance data: ${error}`);
    }
  }

  private logToConsole(errorData: IOSErrorData): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🍎 iOS Error: ${errorData.type}`);
      console.error('Error Data:', errorData);
      console.error('Message:', errorData.message);
      if (errorData.capability) {
        console.error('Capability:', errorData.capability);
      }
      console.error('Capabilities:', errorData.capabilities);
      if (errorData.stack) {
        console.error('Stack:', errorData.stack);
      }
      console.groupEnd();
    }
  }

  private getUserId(): string {
    // In a real implementation, get from auth context
    return 'anonymous';
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('ios-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ios-session-id', sessionId);
    }
    return sessionId;
  }

  private getBuildVersion(): string {
    // In a real implementation, get from build process
    return process.env.REACT_APP_VERSION || 'unknown';
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (process.env.NODE_ENV === 'development') return 'development';
    if (window.location.hostname.includes('staging')) return 'staging';
    return 'production';
  }

  /**
   * Get error statistics for debugging
   */
  public getErrorStats(): {
    queuedErrors: number;
    queuedPerformanceData: number;
    isOnline: boolean;
  } {
    return {
      queuedErrors: this.errorQueue.length,
      queuedPerformanceData: this.performanceQueue.length,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear all queued data (for testing)
   */
  public clearQueues(): void {
    this.errorQueue = [];
    this.performanceQueue = [];
  }
}

// Export singleton instance
export const iosErrorLogger = IOSErrorLoggingService.getInstance();

/**
 * Utility functions for common iOS error scenarios
 */
export const logIOSCapabilityError = (
  capability: keyof IOSCapabilities,
  error: Error,
  capabilities: IOSCapabilities,
  context?: string
) => {
  iosErrorLogger.logCapabilityError(capability, error, capabilities, context);
};

export const logIOSComponentError = (
  componentName: string,
  error: Error,
  capabilities: IOSCapabilities,
  fallbackUsed: boolean = false
) => {
  iosErrorLogger.logProgressiveEnhancementError(componentName, error, capabilities, fallbackUsed);
};

export const logIOSPerformance = (
  type: IOSPerformanceData['type'],
  startTime: number,
  capabilities: IOSCapabilities,
  componentName?: string,
  capability?: keyof IOSCapabilities
) => {
  const duration = performance.now() - startTime;
  iosErrorLogger.logPerformanceMetric(type, duration, capabilities, componentName, capability);
};

/**
 * Performance measurement decorator
 */
export const measureIOSPerformance = (
  type: IOSPerformanceData['type'],
  capabilities: IOSCapabilities,
  componentName?: string,
  capability?: keyof IOSCapabilities
) => {
  return <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) => {
    const method = descriptor.value!;
    
    descriptor.value = ((...args: any[]) => {
      const startTime = performance.now();
      
      try {
        const result = method.apply(target, args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            logIOSPerformance(type, startTime, capabilities, componentName, capability);
          });
        }
        
        // Handle sync functions
        logIOSPerformance(type, startTime, capabilities, componentName, capability);
        return result;
      } catch (error) {
        logIOSPerformance(type, startTime, capabilities, componentName, capability);
        throw error;
      }
    }) as T;
  };
};

export default iosErrorLogger;