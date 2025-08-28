import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  Error,
  CheckCircle,
  Warning,
  Timeline,
  Queue,
  Assessment,
  PlayCircle,
  Settings,
} from '@mui/icons-material';
import SyncStatusCard from '../components/SyncStatusCard';
import SyncHistorySection from '../components/SyncHistorySection';
import SyncHistorySummary from '../components/SyncHistorySummary';
import ManualSyncDialog from '../components/ManualSyncDialog';
import { SyncProgressTracker } from '../components/SyncProgressTracker';
import { syncApiService } from '../services/syncApi';
import type { SyncMonitoringResult, SyncHistoryEntry, SyncTriggerResponse } from '../services/syncApi';
import { formatTimestamp, formatTooltipTimestamp, formatTableTimestamp } from '../utils/dateUtils';

export const SyncStatus: React.FC = () => {
  const [syncData, setSyncData] = useState<SyncMonitoringResult | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Manual sync dialog and progress tracking
  const [showManualSyncDialog, setShowManualSyncDialog] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [currentSyncResponse, setCurrentSyncResponse] = useState<SyncTriggerResponse | null>(null);

  const fetchSyncData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, historyData] = await Promise.all([
        syncApiService.getSyncStatus(),
        syncApiService.getSyncHistory(168, 200) // 7 days (168 hours), 200 entries
      ]);

      setSyncData(statusData);
      setSyncHistory(historyData.history);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSyncData();
  };

  const handleOpenManualSyncDialog = () => {
    setShowManualSyncDialog(true);
  };

  const handleCloseManualSyncDialog = () => {
    setShowManualSyncDialog(false);
  };

  const handleSyncTriggered = (response: SyncTriggerResponse) => {
    setCurrentSyncResponse(response);
    setShowProgressTracker(true);
    // Refresh data after triggering sync
    setTimeout(() => {
      handleRefresh();
    }, 2000);
  };

  const handleCloseProgressTracker = () => {
    setShowProgressTracker(false);
    setCurrentSyncResponse(null);
  };

  const handleSyncComplete = () => {
    // Refresh data when sync completes
    handleRefresh();
  };

  const handleAutoRefreshToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
  };

  // Enhanced auto-refresh with configurable intervals
  useEffect(() => {
    fetchSyncData();
  }, [fetchSyncData]);

  useEffect(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    if (autoRefresh) {
      // More frequent refresh when sync is running
      const interval = syncData?.currentStatus.status === 'running' ? 10000 : 30000;
      const newInterval = setInterval(fetchSyncData, interval);
      setRefreshInterval(newInterval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, syncData?.currentStatus.status, fetchSyncData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'failed':
        return <Error color="error" fontSize="small" />;
      case 'partial':
        return <Warning color="warning" fontSize="small" />;
      default:
        return <Warning color="action" fontSize="small" />;
    }
  };





  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box py={4} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Sync Status Dashboard
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </Typography>
              {syncData?.currentStatus.status === 'running' && (
                <Chip
                  icon={<PlayCircle />}
                  label="Live Updates"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  color="primary"
                />
              }
              label="Auto-refresh"
            />
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={handleOpenManualSyncDialog}
              disabled={refreshing}
            >
              Manual Sync
            </Button>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {syncData && (
          <Box>
            {/* Dashboard Overview Cards */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={3} mb={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Assessment color="primary" />
                    <Box>
                      <Typography variant="h6" color="primary">
                        {syncData.currentStatus.status === 'running' ? 'ACTIVE' :
                          syncData.currentStatus.status === 'failed' ? 'ERROR' :
                            syncData.currentStatus.status === 'completed' ? 'HEALTHY' : 'IDLE'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        System Status
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Queue color="info" />
                    <Box>
                      <Typography variant="h6">
                        {syncData.queueMetrics.reduce((total, queue) => total + queue.approximateNumberOfMessages, 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Queued Messages
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Timeline color="success" />
                    <Box>
                      <Typography variant="h6">
                        {syncData.currentStatus.transactionsProcessed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Sync Processed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Error color={syncData.deadLetterQueue?.hasMessages ? "error" : "disabled"} />
                    <Box>
                      <Typography variant="h6" color={syncData.deadLetterQueue?.hasMessages ? "error" : "text.primary"}>
                        {syncData.deadLetterQueue?.messageCount || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed Messages
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Recent Sync Results Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Sync Results Summary
                </Typography>
                <Box display="flex" gap={3} mb={2}>
                  {syncHistory.slice(0, 5).map((entry, index) => (
                    <Tooltip key={index} title={`${formatTimestamp(entry.timestamp)} - ${entry.status}`}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(entry.status)}
                        <Typography variant="caption">
                          {formatTableTimestamp(entry.timestamp)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>

                {/* Error Summary */}
                {syncHistory.some(entry => entry.errorDetails && entry.errorDetails.length > 0) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Errors Detected
                    </Typography>
                    {syncHistory
                      .filter(entry => entry.errorDetails && entry.errorDetails.length > 0)
                      .slice(0, 3)
                      .map((entry, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                          • {formatTimestamp(entry.timestamp)}: {entry.errorDetails?.[0]}
                        </Typography>
                      ))}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Main Status Card */}
            <Box mb={3}>
              <SyncStatusCard
                syncStatus={syncData.currentStatus}
                queueMetrics={syncData.queueMetrics}
                deadLetterQueue={syncData.deadLetterQueue}
                processingProgress={syncData.processingProgress}
                onRefresh={handleRefresh}
                loading={refreshing}
              />
            </Box>

            {/* Queue Metrics and Processing Progress */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Queue Details
                  </Typography>
                  {syncData.queueMetrics.map((queue, index) => (
                    <Box key={index} mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        {queue.queueName}
                      </Typography>
                      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          Messages: {queue.approximateNumberOfMessages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Processing: {queue.approximateNumberOfMessagesNotVisible}
                        </Typography>
                      </Box>
                      {queue.approximateAgeOfOldestMessage && (
                        <Typography variant="body2" color="text.secondary">
                          Oldest: {Math.floor(queue.approximateAgeOfOldestMessage / 60)}m ago
                        </Typography>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Processing Progress */}
              {syncData.processingProgress && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Processing Progress
                    </Typography>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Messages
                        </Typography>
                        <Typography variant="h6">
                          {syncData.processingProgress.totalMessages}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Queued
                        </Typography>
                        <Typography variant="h6">
                          {syncData.processingProgress.queuedMessages}
                        </Typography>
                      </Box>
                      {syncData.processingProgress.processingRate && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Rate (msg/min)
                          </Typography>
                          <Typography variant="h6">
                            {syncData.processingProgress.processingRate.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                      {syncData.processingProgress.estimatedCompletionTime && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            ETA
                          </Typography>
                          <Typography variant="body1">
                            {formatTimestamp(syncData.processingProgress.estimatedCompletionTime)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* 7-Day Sync History Summary */}
            <Box mb={3}>
              <SyncHistorySummary syncHistory={syncHistory} />
            </Box>

            {/* Enhanced Sync History with Filtering */}
            <SyncHistorySection
              syncHistory={syncHistory}
              onRefresh={handleRefresh}
              loading={refreshing}
            />
          </Box>
        )}

        {/* Manual Sync Dialog */}
        <ManualSyncDialog
          open={showManualSyncDialog}
          onClose={handleCloseManualSyncDialog}
          onSyncTriggered={handleSyncTriggered}
          currentQueueDepth={syncData?.currentStatus.queueDepth}
          syncInProgress={syncData?.currentStatus.status === 'running'}
        />

        {/* Sync Progress Tracker */}
        {currentSyncResponse && (
          <SyncProgressTracker
            open={showProgressTracker}
            onClose={handleCloseProgressTracker}
            syncResponse={currentSyncResponse}
            onSyncComplete={handleSyncComplete}
          />
        )}
      </Box>
    </Container>
  );
};