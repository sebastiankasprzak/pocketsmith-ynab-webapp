import React, { useState } from 'react';
import {
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
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
import { useSyncStatus } from '../hooks/useSyncStatus';
import type { SyncTriggerResponse } from '../services/syncApi';

// Constants for localStorage keys
const ACTIVITY_HOURS_KEY = 'syncStatus.activityHours';
const AUTO_REFRESH_KEY = 'syncStatus.autoRefresh';

export const SyncStatus: React.FC = () => {
  // Initialize state from localStorage or defaults
  const [activityHours, setActivityHours] = useState(() => {
    const saved = localStorage.getItem(ACTIVITY_HOURS_KEY);
    return saved ? parseInt(saved, 10) : 24;
  });
  
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem(AUTO_REFRESH_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  // Manual sync dialog and progress tracking
  const [showManualSyncDialog, setShowManualSyncDialog] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [currentSyncResponse, setCurrentSyncResponse] = useState<SyncTriggerResponse | null>(null);

  // Use React Query hooks for data management with proper activityHours
  const {
    syncStateOverview,
    recentActivity,
    isLoading,
    isRefreshing,
    hasError,
    syncStateError,
    recentActivityError,
    lastUpdated,
    refreshAllData,
    triggerSyncAsync,
    isSyncTriggering,
    syncTriggerError,
  } = useSyncStatus({ 
    autoRefresh, 
    activityHours,
    refreshInterval: autoRefresh ? 30 * 1000 : undefined, // 30 seconds when auto-refresh is on
  });

  const handleRefresh = () => {
    refreshAllData();
  };

  const handleOpenManualSyncDialog = () => {
    setShowManualSyncDialog(true);
  };

  const handleCloseManualSyncDialog = () => {
    setShowManualSyncDialog(false);
  };

  const handleSyncTriggered = async (options: { 
    forceSync?: boolean; 
    accountIds?: string[]; 
    dateRange?: { startDate: string; endDate: string } 
  } = {}) => {
    try {
      const response = await triggerSyncAsync(options);
      setCurrentSyncResponse(response);
      setShowProgressTracker(true);
      // Data will be automatically refreshed by React Query after mutation
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
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
    const newValue = event.target.checked;
    setAutoRefresh(newValue);
    localStorage.setItem(AUTO_REFRESH_KEY, JSON.stringify(newValue));
  };

  const handleActivityHoursChange = (hours: number) => {
    setActivityHours(hours);
    localStorage.setItem(ACTIVITY_HOURS_KEY, hours.toString());
  };

  if (isLoading) {
    return (
      <Box py={4} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '100%',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Sync Status Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </Typography>
          {isRefreshing && (
            <Chip 
              size="small" 
              label="Refreshing..." 
              color="primary" 
              icon={<CircularProgress size={12} />} 
            />
          )}
        </Box>
        <Box 
          display="flex" 
          gap={2} 
          alignItems="center"
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
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
            disabled={isRefreshing || isSyncTriggering}
            fullWidth={false}
            sx={{ minWidth: { xs: 'auto', sm: 140 } }}
          >
            Manual Sync
          </Button>
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            fullWidth={false}
            sx={{ minWidth: { xs: 'auto', sm: 100 } }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {syncStateError && <div>Sync State Error: {syncStateError}</div>}
          {recentActivityError && <div>Recent Activity Error: {recentActivityError}</div>}
          {syncTriggerError && <div>Sync Trigger Error: {syncTriggerError}</div>}
        </Alert>
      )}

      {/* Modern DynamoDB-based Sync State Overview */}
      {syncStateOverview && (
        <ModernSyncStatusCard
          syncStateOverview={syncStateOverview}
          onRefresh={handleRefresh}
          loading={isRefreshing}
        />
      )}

      {/* Recent Activity from DynamoDB */}
      {recentActivity && (
        <Box mb={3}>
          <RecentActivityCard
            recentActivity={recentActivity.recent_activity}
            hours={activityHours}
            onHoursChange={handleActivityHoursChange}
            loading={isRefreshing}
          />
        </Box>
      )}

      {/* Detailed Account Sync State Table */}
      {syncStateOverview && (
        <Box mb={3}>
          <AccountSyncStateTable
            accounts={syncStateOverview.accounts}
            loading={isRefreshing}
          />
        </Box>
      )}

      {/* Manual Sync Dialog */}
      <ManualSyncDialog
        open={showManualSyncDialog}
        onClose={handleCloseManualSyncDialog}
        onSyncTriggered={handleSyncTriggered}
        currentQueueDepth={0}
        syncInProgress={isSyncTriggering}
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
  );
};