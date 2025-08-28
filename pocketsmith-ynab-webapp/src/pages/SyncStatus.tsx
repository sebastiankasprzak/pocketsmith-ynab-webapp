import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Refresh,
  Settings,
} from '@mui/icons-material';
import ManualSyncDialog from '../components/ManualSyncDialog';
import { SyncProgressTracker } from '../components/SyncProgressTracker';
import ModernSyncStatusCard from '../components/ModernSyncStatusCard';
import AccountSyncStateTable from '../components/AccountSyncStateTable';
import RecentActivityCard from '../components/RecentActivityCard';
import { syncApiService } from '../services/syncApi';
import type { 
  SyncTriggerResponse,
  SyncStateOverview,
  RecentActivityResponse
} from '../services/syncApi';

export const SyncStatus: React.FC = () => {
  const [syncStateOverview, setSyncStateOverview] = useState<SyncStateOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse | null>(null);
  const [activityHours, setActivityHours] = useState(24);
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
      const [stateOverview, activityData] = await Promise.all([
        syncApiService.getSyncStateOverview(),
        syncApiService.getRecentActivity(activityHours)
      ]);

      setSyncStateOverview(stateOverview);
      setRecentActivity(activityData);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityHours]);

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

  const handleActivityHoursChange = (hours: number) => {
    setActivityHours(hours);
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
      // Refresh every 30 seconds when auto-refresh is enabled
      const newInterval = setInterval(fetchSyncData, 30000);
      setRefreshInterval(newInterval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, fetchSyncData]);







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

        {/* Modern DynamoDB-based Sync State Overview */}
        {syncStateOverview && (
          <ModernSyncStatusCard
            syncStateOverview={syncStateOverview}
            onRefresh={handleRefresh}
            loading={refreshing}
          />
        )}

        {/* Recent Activity from DynamoDB */}
        {recentActivity && (
          <Box mb={3}>
            <RecentActivityCard
              recentActivity={recentActivity.recent_activity}
              hours={activityHours}
              onHoursChange={handleActivityHoursChange}
              loading={refreshing}
            />
          </Box>
        )}

        {/* Detailed Account Sync State Table */}
        {syncStateOverview && (
          <Box mb={3}>
            <AccountSyncStateTable
              accounts={syncStateOverview.accounts}
              loading={refreshing}
            />
          </Box>
        )}

        {/* Manual Sync Dialog */}
        <ManualSyncDialog
          open={showManualSyncDialog}
          onClose={handleCloseManualSyncDialog}
          onSyncTriggered={handleSyncTriggered}
          currentQueueDepth={0}
          syncInProgress={false}
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