import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  PlayArrow,
  Pause,
} from '@mui/icons-material';

interface SyncStatus {
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

interface QueueMetrics {
  queueUrl: string;
  queueName: string;
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateAgeOfOldestMessage?: number;
  lastModified: string;
}

interface DeadLetterQueueStatus {
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

interface ProcessingProgress {
  totalMessages: number;
  processingMessages: number;
  queuedMessages: number;
  estimatedCompletionTime?: string;
  processingRate?: number;
}

interface SyncStatusCardProps {
  syncStatus: SyncStatus;
  queueMetrics: QueueMetrics[];
  deadLetterQueue?: DeadLetterQueueStatus;
  processingProgress?: ProcessingProgress;
  onRefresh?: () => void;
  loading?: boolean;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  syncStatus,
  queueMetrics,
  deadLetterQueue,
  processingProgress,
  onRefresh,
  loading = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'running':
        return <PlayArrow color="primary" />;
      case 'idle':
        return <Pause color="action" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      case 'idle':
        return 'default';
      default:
        return 'warning';
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const mainQueue = queueMetrics.find(q => q.queueName.includes('transactions') && !q.queueName.includes('dlq'));
  const processingRate = processingProgress?.processingRate;
  const estimatedCompletion = processingProgress?.estimatedCompletionTime;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Sync Status
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={getStatusIcon(syncStatus.status)}
              label={syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}
              color={getStatusColor(syncStatus.status) as any}
              variant="outlined"
            />
            <Tooltip title="Refresh status">
              <IconButton onClick={onRefresh} disabled={loading} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Current Status Details */}
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last Sync: {formatTimestamp(syncStatus.lastSyncTime)}
          </Typography>
          
          {syncStatus.status === 'running' && processingProgress && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Processing Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={processingProgress.totalMessages > 0 
                  ? ((processingProgress.totalMessages - processingProgress.queuedMessages) / processingProgress.totalMessages) * 100 
                  : 0}
                sx={{ mb: 1 }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  {processingProgress.totalMessages - processingProgress.queuedMessages} / {processingProgress.totalMessages} processed
                </Typography>
                {estimatedCompletion && (
                  <Typography variant="caption">
                    ETA: {formatTimestamp(estimatedCompletion)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {syncStatus.errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {syncStatus.errorMessage}
            </Alert>
          )}
        </Box>

        {/* Queue Metrics */}
        {mainQueue && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Queue Status
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Queued Messages
                </Typography>
                <Typography variant="h6">
                  {mainQueue.approximateNumberOfMessages}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Processing
                </Typography>
                <Typography variant="h6">
                  {mainQueue.approximateNumberOfMessagesNotVisible}
                </Typography>
              </Box>
              {mainQueue.approximateAgeOfOldestMessage && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Oldest Message Age
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(mainQueue.approximateAgeOfOldestMessage)}
                  </Typography>
                </Box>
              )}
              {processingRate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Processing Rate
                  </Typography>
                  <Typography variant="body1">
                    {processingRate.toFixed(1)} msg/min
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Transaction Statistics */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Last Sync Statistics
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {syncStatus.transactionsProcessed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Processed
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                {syncStatus.duplicatesSkipped}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Skipped
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">
                {syncStatus.transactionsFailed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Failed
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Dead Letter Queue Alert */}
        {deadLetterQueue?.hasMessages && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {deadLetterQueue.messageCount} failed message{deadLetterQueue.messageCount > 1 ? 's' : ''} in dead letter queue
            </Typography>
            {deadLetterQueue.sampleMessages && deadLetterQueue.sampleMessages.length > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Latest error: {deadLetterQueue.sampleMessages[0].errorReason || 'Unknown error'}
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncStatusCard;