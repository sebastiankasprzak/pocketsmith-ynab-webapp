import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

interface AnalyticsEvent {
  name: string;
  value?: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'Milliseconds' | 'Count' | 'Percent';
  page?: string;
}

class AnalyticsService {
  private cloudWatchClient: CloudWatchClient;
  private namespace = 'PocketSmithYnabWebApp';
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENVIRONMENT !== 'development';
    
    if (this.isEnabled) {
      this.cloudWatchClient = new CloudWatchClient({
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      });
    }
  }

  /**
   * Track user actions and interactions
   */
  async trackUserAction(action: UserAction): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        name: `UserAction.${action.category}.${action.action}`,
        value: action.value || 1,
        unit: 'Count',
        dimensions: {
          Category: action.category,
          Action: action.action,
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          ...(action.label && { Label: action.label }),
          ...(action.userId && { UserId: this.hashUserId(action.userId) }),
        },
      };

      await this.sendMetric(event);
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        name: `Performance.${metric.name}`,
        value: metric.value,
        unit: metric.unit,
        dimensions: {
          MetricType: 'Performance',
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          ...(metric.page && { Page: metric.page }),
        },
      };

      await this.sendMetric(event);
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Track application errors
   */
  async trackError(error: Error, context?: Record<string, string>): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        name: 'ApplicationError',
        value: 1,
        unit: 'Count',
        dimensions: {
          ErrorType: error.name || 'UnknownError',
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          ...context,
        },
      };

      await this.sendMetric(event);
    } catch (trackingError) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Track authentication events
   */
  async trackAuthentication(event: 'login' | 'logout' | 'login_failure', userId?: string): Promise<void> {
    const eventMap = {
      login: 'UserLogins',
      logout: 'UserLogouts',
      login_failure: 'AuthenticationErrors',
    };

    try {
      const analyticsEvent: AnalyticsEvent = {
        name: eventMap[event],
        value: 1,
        unit: 'Count',
        dimensions: {
          AuthEvent: event,
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          ...(userId && { UserId: this.hashUserId(userId) }),
        },
      };

      await this.sendMetric(analyticsEvent);
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Track sync operations
   */
  async trackSyncOperation(
    operation: 'manual_sync' | 'balance_comparison' | 'config_change',
    success: boolean,
    duration?: number
  ): Promise<void> {
    const operationMap = {
      manual_sync: 'SyncOperations',
      balance_comparison: 'BalanceComparisons',
      config_change: 'ConfigurationChanges',
    };

    try {
      // Track the operation count
      await this.sendMetric({
        name: operationMap[operation],
        value: 1,
        unit: 'Count',
        dimensions: {
          Operation: operation,
          Success: success.toString(),
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
        },
      });

      // Track duration if provided
      if (duration !== undefined) {
        await this.sendMetric({
          name: `${operationMap[operation]}.Duration`,
          value: duration,
          unit: 'Milliseconds',
          dimensions: {
            Operation: operation,
            Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          },
        });
      }

      // Track errors separately
      if (!success) {
        await this.sendMetric({
          name: 'ApiErrors',
          value: 1,
          unit: 'Count',
          dimensions: {
            Operation: operation,
            Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          },
        });
      }
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Track page views and navigation
   */
  async trackPageView(page: string, userId?: string): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: 'PageViews',
        value: 1,
        unit: 'Count',
        dimensions: {
          Page: page,
          Environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
          ...(userId && { UserId: this.hashUserId(userId) }),
        },
      };

      await this.sendMetric(event);
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  /**
   * Send custom metric to CloudWatch
   */
  private async sendMetric(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled || !this.cloudWatchClient) {
      return;
    }

    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [
        {
          MetricName: event.name,
          Value: event.value || 1,
          Unit: event.unit || 'Count',
          Timestamp: event.timestamp || new Date(),
          Dimensions: event.dimensions
            ? Object.entries(event.dimensions).map(([Name, Value]) => ({
                Name,
                Value,
              }))
            : undefined,
        },
      ],
    });

    await this.cloudWatchClient.send(command);
  }

  /**
   * Hash user ID for privacy
   */
  private hashUserId(userId: string): string {
    // Simple hash for privacy - in production, use a proper hashing function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Batch multiple metrics for efficiency
   */
  async sendBatchMetrics(events: AnalyticsEvent[]): Promise<void> {
    if (!this.isEnabled || !this.cloudWatchClient || events.length === 0) {
      return;
    }

    try {
      // CloudWatch allows up to 20 metrics per request
      const chunks = this.chunkArray(events, 20);

      for (const chunk of chunks) {
        const command = new PutMetricDataCommand({
          Namespace: this.namespace,
          MetricData: chunk.map(event => ({
            MetricName: event.name,
            Value: event.value || 1,
            Unit: event.unit || 'Count',
            Timestamp: event.timestamp || new Date(),
            Dimensions: event.dimensions
              ? Object.entries(event.dimensions).map(([Name, Value]) => ({
                  Name,
                  Value,
                }))
              : undefined,
          })),
        });

        await this.cloudWatchClient.send(command);
      }
    } catch (error) {
      // Silently fail analytics tracking
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for use in components
export type { UserAction, PerformanceMetric, AnalyticsEvent };