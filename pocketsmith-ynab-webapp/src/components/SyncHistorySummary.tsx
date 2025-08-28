import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Error,
  Warning,
  Timeline,
} from '@mui/icons-material';
import type { SyncHistoryEntry } from '../services/syncApi';
import { formatRelativeTime, isWithinDays } from '../utils/dateUtils';

interface SyncHistorySummaryProps {
  syncHistory: SyncHistoryEntry[];
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  totalTransactionsFetched: number;
  totalTransactionsProcessed: number;
  totalTransactionsFailed: number;
  totalDuplicatesSkipped: number;
  averageDuration: number;
  successRate: number;
  lastSuccessfulSync?: string;
  lastFailedSync?: string;
  recentTrend: 'improving' | 'declining' | 'stable';
}

const SyncHistorySummary: React.FC<SyncHistorySummaryProps> = ({ syncHistory }) => {
  const stats = useMemo((): SyncStats => {
    // Filter to last 7 days
    const last7Days = syncHistory.filter(entry => isWithinDays(entry.timestamp, 7));
    
    if (last7Days.length === 0) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        partialSyncs: 0,
        totalTransactionsFetched: 0,
        totalTransactionsProcessed: 0,
        totalTransactionsFailed: 0,
        totalDuplicatesSkipped: 0,
        averageDuration: 0,
        successRate: 0,
        recentTrend: 'stable',
      };
    }

    const totalSyncs = last7Days.length;
    const successfulSyncs = last7Days.filter(entry => entry.status === 'success').length;
    const failedSyncs = last7Days.filter(entry => entry.status === 'failed').length;
    const partialSyncs = last7Days.filter(entry => entry.status === 'partial').length;

    const totalTransactionsFetched = last7Days.reduce((sum, entry) => sum + entry.transactionsFetched, 0);
    const totalTransactionsProcessed = last7Days.reduce((sum, entry) => sum + entry.transactionsProcessed, 0);
    const totalTransactionsFailed = last7Days.reduce((sum, entry) => sum + entry.transactionsFailed, 0);
    const totalDuplicatesSkipped = last7Days.reduce((sum, entry) => sum + entry.duplicatesSkipped, 0);

    const validDurations = last7Days.filter(entry => entry.duration > 0);
    const averageDuration = validDurations.length > 0 
      ? validDurations.reduce((sum, entry) => sum + entry.duration, 0) / validDurations.length 
      : 0;

    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const lastSuccessfulSync = last7Days
      .filter(entry => entry.status === 'success')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;

    const lastFailedSync = last7Days
      .filter(entry => entry.status === 'failed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;

    // Calculate trend by comparing first half vs second half of the period
    const midpoint = Math.floor(last7Days.length / 2);
    const firstHalf = last7Days.slice(midpoint);
    const secondHalf = last7Days.slice(0, midpoint);

    const firstHalfSuccessRate = firstHalf.length > 0 
      ? (firstHalf.filter(entry => entry.status === 'success').length / firstHalf.length) * 100 
      : 0;
    const secondHalfSuccessRate = secondHalf.length > 0 
      ? (secondHalf.filter(entry => entry.status === 'success').length / secondHalf.length) * 100 
      : 0;

    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfSuccessRate > firstHalfSuccessRate + 10) {
      recentTrend = 'improving';
    } else if (secondHalfSuccessRate < firstHalfSuccessRate - 10) {
      recentTrend = 'declining';
    }

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      partialSyncs,
      totalTransactionsFetched,
      totalTransactionsProcessed,
      totalTransactionsFailed,
      totalDuplicatesSkipped,
      averageDuration,
      successRate,
      lastSuccessfulSync,
      lastFailedSync,
      recentTrend,
    };
  }, [syncHistory]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" fontSize="small" />;
      case 'declining':
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return <Timeline color="action" fontSize="small" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'default';
    }
  };

  if (stats.totalSyncs === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            7-Day Sync Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No sync operations found in the last 7 days.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            7-Day Sync Summary
          </Typography>
          <Tooltip title={`Trend based on recent sync success rates`}>
            <Chip
              icon={getTrendIcon(stats.recentTrend)}
              label={stats.recentTrend.charAt(0).toUpperCase() + stats.recentTrend.slice(1)}
              size="small"
              color={getTrendColor(stats.recentTrend) as any}
              variant="outlined"
            />
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Success Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h5" color="primary">
                  {stats.successRate.toFixed(1)}%
                </Typography>
                {stats.successRate >= 90 ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : stats.successRate >= 70 ? (
                  <Warning color="warning" fontSize="small" />
                ) : (
                  <Error color="error" fontSize="small" />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.successRate}
                color={stats.successRate >= 90 ? 'success' : stats.successRate >= 70 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </Grid>

          {/* Total Syncs */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Syncs
              </Typography>
              <Typography variant="h5" gutterBottom>
                {stats.totalSyncs}
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label={`${stats.successfulSyncs} success`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                {stats.failedSyncs > 0 && (
                  <Chip
                    label={`${stats.failedSyncs} failed`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {stats.partialSyncs > 0 && (
                  <Chip
                    label={`${stats.partialSyncs} partial`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Grid>

          {/* Transaction Processing */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Transactions Processed
              </Typography>
              <Typography variant="h5" color="success.main" gutterBottom>
                {stats.totalTransactionsProcessed.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalTransactionsFetched.toLocaleString()} fetched
                {stats.totalTransactionsFailed > 0 && (
                  <>, {stats.totalTransactionsFailed.toLocaleString()} failed</>
                )}
                {stats.totalDuplicatesSkipped > 0 && (
                  <>, {stats.totalDuplicatesSkipped.toLocaleString()} skipped</>
                )}
              </Typography>
            </Box>
          </Grid>

          {/* Average Duration */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Duration
              </Typography>
              <Typography variant="h5" gutterBottom>
                {stats.averageDuration > 0 
                  ? `${Math.round(stats.averageDuration / 1000)}s`
                  : 'N/A'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per sync operation
              </Typography>
            </Box>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Recent Activity
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {stats.lastSuccessfulSync && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">
                      Last success: {formatRelativeTime(stats.lastSuccessfulSync)}
                    </Typography>
                  </Box>
                )}
                {stats.lastFailedSync && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Error color="error" fontSize="small" />
                    <Typography variant="body2">
                      Last failure: {formatRelativeTime(stats.lastFailedSync)}
                    </Typography>
                  </Box>
                )}
                {!stats.lastSuccessfulSync && !stats.lastFailedSync && (
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SyncHistorySummary;