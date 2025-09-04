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
import { IOSNavigationBar } from '../components/IOSNavigationBar';
import { NotificationPanel } from '../components/NotificationPanel';
import { IOSButton } from '../components/IOSButton';
import { useIOSDetection } from '../hooks/useIOSDetection';
import { useSyncStatus } from '../hooks/useSyncStatus';
import type { SyncTriggerResponse } from '../services/syncApi';

// Constants for localStorage keys
const ACTIVITY_HOURS_KEY = 'syncStatus.activityHours';
const AUTO_REFRESH_KEY = 'syncStatus.autoRefresh';

export const SyncStatus: React.FC = () => {
  const { shouldUseIOSExperience } = useIOSDetection();
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  
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

  // Generate notifications based on sync status
  const notifications = React.useMemo(() => {
    const notifs = [];

    // Sync state error notifications
    if (syncStateError) {
      notifs.push({
        id: 'sync-state-error',
        type: 'error' as const,
        title: 'Unable to load sync status',
        message: 'There was an error loading the sync status. Please check your connection and try again.',
        dismissible: true
      });
    }

    // Recent activity error notifications
    if (recentActivityError) {
      notifs.push({
        id: 'activity-error',
        type: 'error' as const,
        title: 'Unable to load recent activity',
        message: 'There was an error loading recent sync activity.',
        dismissible: true
      });
    }

    // Sync trigger error notifications
    if (syncTriggerError) {
      notifs.push({
        id: 'sync-trigger-error',
        type: 'error' as const,
        title: 'Sync failed to start',
        message: 'There was an error starting the synchronization process. Please try again.',
        dismissible: true
      });
    }

    // Active sync notification
    if (syncStateOverview.data?.status === 'syncing') {
      notifs.push({
        id: 'sync-in-progress',
        type: 'info' as const,
        title: 'Synchronization in progress',
        message: 'Data is currently being synchronized between PocketSmith and YNAB.',
        dismissible: false
      });
    }

    // Failed sync notification
    if (syncStateOverview.data?.status === 'error') {
      notifs.push({
        id: 'sync-failed',
        type: 'error' as const,
        title: 'Synchronization failed',
        message: syncStateOverview.data.message || 'The last synchronization attempt failed. Please check the details and try again.',
        dismissible: true
      });
    }

    // Filter out dismissed notifications
    return notifs.filter(n => !dismissedNotifications.includes(n.id));
  }, [
    syncStateError,
    recentActivityError,
    syncTriggerError,
    syncStateOverview.data,
    dismissedNotifications
  ]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
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
      {/* iOS Navigation Bar */}
      {shouldUseIOSExperience && (
        <IOSNavigationBar
          title="Sync Status"
          large={false}
          rightAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationPanel
                notifications={notifications}
                onDismiss={handleDismissNotification}
              />
              <IOSButton
                variant="plain"
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                hapticFeedback={true}
                pressAnimation={true}
              >
                <Refresh sx={{ fontSize: '20px' }} />
              </IOSButton>
            </Box>
          }
        />
      )}

      {/* Standard Header for non-iOS */}
      {!shouldUseIOSExperience && (
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
        </Box>
      )}

      {/* Status info for iOS */}
      {shouldUseIOSExperience && (
        <Box sx={{ px: 2, py: 1, mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2} sx={{ mb: 1 }}>
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
        </Box>
      )}

      {/* Controls for non-iOS */}
      {!shouldUseIOSExperience && (
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
      )}

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