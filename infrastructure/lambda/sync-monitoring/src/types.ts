export interface SyncStatus {
  lastSyncTime?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  transactionsProcessed: number;
  transactionsFailed: number;
  duplicatesSkipped: number;
  errorMessage?: string;
  nextScheduledSync?: string;
  queueDepth: number;
  queueAge?: number; // Age of oldest message in seconds
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

export interface LogEvent {
  timestamp: number;
  message: string;
  ingestionTime: number;
  eventId: string;
}

export interface ParsedLogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  transactionCount?: number;
  errorDetails?: string;
  duration?: number;
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

export interface SyncMonitoringResult {
  currentStatus: SyncStatus;
  queueMetrics: QueueMetrics[];
  deadLetterQueue?: DeadLetterQueueStatus;
  recentHistory: SyncHistoryEntry[];
  lastUpdated: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// CloudWatch Logs configuration
export interface LogGroupConfig {
  name: string;
  description: string;
  retentionDays?: number;
}

// Known log groups for existing Lambda functions
export const EXISTING_LOG_GROUPS = {
  TRANSACTION_FETCHER: '/aws/lambda/dev-pocketsmith-transaction-fetcher',
  TRANSACTION_PROCESSOR: '/aws/lambda/dev-pocketsmith-transaction-processor',
} as const;

// Function to get all relevant log groups dynamically
export const getAllSyncLogGroups = (): string[] => {
  const staticGroups = Object.values(EXISTING_LOG_GROUPS);

  // Add environment-specific log groups that might exist
  const environmentGroups: string[] = [
    // CDK-generated Lambda function log groups (these have dynamic names)
    // We'll discover these dynamically in the service
  ];

  return [...staticGroups, ...environmentGroups];
};

// Known SQS queue names
export const EXISTING_QUEUES = {
  TRANSACTION_PROCESSING: 'pocketsmith-ynab-sync-transactions',
  DEAD_LETTER: 'pocketsmith-ynab-sync-transactions-dlq',
} as const;

// Manual sync trigger types
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

// Lambda invocation payload for existing transaction fetcher
export interface TransactionFetcherPayload {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string;   // YYYY-MM-DD format
  account_ids?: string[]; // PocketSmith account IDs
  force_sync?: boolean;
  triggered_by: 'manual' | 'scheduled';
  request_id: string;
}