import { apiClient } from './apiClient';
import type { ApiError } from './apiClient';

export interface SyncStatus {
  lastSyncTime?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  transactionsProcessed: number;
  transactionsFailed: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  nextScheduledSync?: string;
  queueDepth: number;
  queueAge?: number;
}

export interface SyncHistoryEntry {
  timestamp: string;
  requestId: string;
  status: 'success' | 'failed' | 'partial';
  transactionsFetched: number;
  transactionsProcessed: number;
  transactionsFailed: number;
  duplicatesSkipped: number;
  duration: number;
  errorDetails?: string[];
  logGroupName: string;
  logStreamName: string;
}

export interface QueueMetrics {
  queueUrl: string;
  queueName: string;
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateAgeOfOldestMessage?: number;
  lastModified: string;
}

export interface DeadLetterQueueStatus {
  hasMessages: boolean;
  messageCount: number;
  oldestMessageAge?: number;
  sampleMessages?: Array<{
    messageId: string;
    body: string;
    timestamp: string;
    errorReason?: string;
  }>;
}

export interface ProcessingProgress {
  totalMessages: number;
  processingMessages: number;
  queuedMessages: number;
  estimatedCompletionTime?: string;
  processingRate?: number;
}

export interface SyncMonitoringResult {
  currentStatus: SyncStatus;
  queueMetrics: QueueMetrics[];
  deadLetterQueue?: DeadLetterQueueStatus;
  recentHistory: SyncHistoryEntry[];
  lastUpdated: string;
  processingProgress?: ProcessingProgress;
}

export interface SyncHistoryResponse {
  history: SyncHistoryEntry[];
  parameters: {
    hours: number;
    limit: number;
    totalEntries: number;
  };
  lastUpdated: string;
}

export interface SyncProgressResponse {
  syncId: string;
  status: string;
  progress: ProcessingProgress;
  details: SyncHistoryEntry;
  lastUpdated: string;
}

export interface LogStreamResponse {
  logGroup: string;
  events: Array<{
    timestamp: string;
    message: string;
    eventId: string;
  }>;
  startTime: string;
  endTime: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  components: {
    logGroups: Record<string, boolean>;
    queues: Record<string, boolean>;
  };
  timestamp: string;
}

export interface SyncTriggerRequest {
  dateRange?: {
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
  };
  accountFilters?: string[]; // PocketSmith account IDs to sync
  forceSync?: boolean; // Override existing sync in progress
}

export interface SyncTriggerResponse {
  syncId: string;
  status: 'triggered' | 'failed';
  message: string;
  estimatedDuration?: number; // in seconds
  queueDepthBefore: number;
  triggeredAt: string;
  parameters: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    accountFilters?: string[];
    forceSync: boolean;
  };
}

// DynamoDB Sync State interfaces
export interface SyncStateAccount {
  account_id: string;
  last_sync: string | null;
  processed_transactions_count: number;
  last_updated: string;
}

export interface SyncStateOverview {
  accounts: SyncStateAccount[];
  total_accounts: number;
  total_processed_transactions: number;
  last_activity: string | null;
  lastUpdated: string;
}

export interface RecentTransactionActivity {
  account_id: string;
  recent_transactions: Array<{
    transaction_id: string;
    processed_at: string;
  }>;
  count: number;
}

export interface RecentActivityResponse {
  recent_activity: RecentTransactionActivity[];
  parameters: {
    hours: number;
  };
  lastUpdated: string;
}

class SyncApiService {
  constructor() {
    // No need to store baseURL since apiClient handles it
  }

  /**
   * Get comprehensive sync status including logs and queue metrics
   */
  async getSyncStatus(): Promise<SyncMonitoringResult> {
    try {
      const response = await apiClient.get<SyncMonitoringResult>('/sync/status');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get sync status');
    }
  }

  /**
   * Get real-time sync status from DynamoDB (faster than CloudWatch)
   */
  async getRealTimeSyncStatus(syncId?: string): Promise<SyncStatus> {
    try {
      const endpoint = syncId ? `/sync/realtime/${syncId}` : '/sync/realtime/current';
      const response = await apiClient.get<SyncStatus>(endpoint);
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get real-time sync status');
    }
  }

  /**
   * Get all active syncs
   */
  async getActiveSyncs(): Promise<SyncStatus[]> {
    try {
      const response = await apiClient.get<SyncStatus[]>('/sync/active');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get active syncs');
    }
  }

  /**
   * Get detailed sync history
   */
  async getSyncHistory(hours: number = 24, limit: number = 50): Promise<SyncHistoryResponse> {
    try {
      const response = await apiClient.get<SyncHistoryResponse>('/sync/history', {
        params: { hours, limit }
      });
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get sync history');
    }
  }

  /**
   * Get real-time sync progress for active operations
   */
  async getSyncProgress(syncId: string): Promise<SyncProgressResponse> {
    try {
      const response = await apiClient.get<SyncProgressResponse>(`/sync/progress/${syncId}`);
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get sync progress');
    }
  }

  /**
   * Stream real-time log events
   */
  async getLogStream(logGroup: string, since?: string): Promise<LogStreamResponse> {
    try {
      const params: any = { logGroup };
      if (since) {
        params.since = since;
      }

      const response = await apiClient.get<LogStreamResponse>('/sync/logs/stream', { params });
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get log stream');
    }
  }

  /**
   * Health check for monitoring infrastructure
   */
  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/sync/health');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get health check');
    }
  }

  /**
   * Trigger manual sync operation
   */
  async triggerSync(request: SyncTriggerRequest): Promise<SyncTriggerResponse> {
    try {
      const response = await apiClient.post<SyncTriggerResponse>('/sync/trigger', request);
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to trigger sync');
    }
  }

  /**
   * Get sync state overview from DynamoDB
   */
  async getSyncStateOverview(): Promise<SyncStateOverview> {
    try {
      const response = await apiClient.get<SyncStateOverview>('/sync/state/overview');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get sync state overview');
    }
  }

  /**
   * Get sync state for a specific account
   */
  async getAccountSyncState(accountId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/sync/state/account/${accountId}`);
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get account sync state');
    }
  }

  /**
   * Get recent transaction activity from DynamoDB
   */
  async getRecentActivity(hours: number = 24): Promise<RecentActivityResponse> {
    try {
      const response = await apiClient.get<RecentActivityResponse>('/sync/state/recent-activity', {
        params: { hours }
      });
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to get recent activity');
    }
  }

  /**
   * Handle API errors with standardized error messages
   */
  private handleApiError(error: ApiError, defaultMessage: string): never {
    // If it's already an ApiError from our interceptor, use its message
    if (error.code && error.message) {
      throw new Error(error.message);
    }
    
    // Fallback to default message
    throw new Error(defaultMessage);
  }
}

export const syncApiService = new SyncApiService();
export default syncApiService;

// Re-export types for easier importing
export type { SyncStateAccount, SyncStateOverview, RecentTransactionActivity, RecentActivityResponse };