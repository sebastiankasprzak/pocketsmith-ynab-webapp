import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { IOSCard } from '../components/IOSCard';
import { IOSButton } from '../components/IOSButton';
import { IOSLayout } from '../components/IOSLayout';
import { IOSContextMenu } from '../components/IOSContextMenu';
import { IOSBottomSheet } from '../components/IOSBottomSheet';
import { IOSSearchBar } from '../components/IOSSearchBar';
import { IOSSegmentedControl } from '../components/IOSSegmentedControl';
import { IOSToggle } from '../components/IOSToggle';
import { IOSNotification, useIOSNotifications } from '../components/IOSNotification';
import { useIOSSyncNotifications } from '../components/IOSSyncNotifications';
import { 
  IOSSpinner, 
  IOSSkeleton, 
  IOSLoadingOverlay, 
  IOSProgressBar, 
  IOSPulsingDot 
} from '../components/IOSLoadingStates';
import { IOSProgressIndicator } from '../components/IOSProgressIndicator';
import { IOSStatusBadge } from '../components/IOSStatusBadge';
import { IOSDetectionDemo } from '../components/IOSDetectionDemo';
import { IOSSyncControls } from '../components/IOSSyncControls';

export const IOSDemo = () => {
  const [searchValue, setSearchValue] = useState('');
  const [segmentValue, setSegmentValue] = useState('accounts');
  const [toggleValue, setToggleValue] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(65);
  
  const { showSuccess, showError, showWarning, showInfo, NotificationContainer } = useIOSNotifications();
  const { 
    showSyncStarted, 
    showSyncProgress, 
    showSyncCompleted, 
    showSyncFailed, 
    showSyncWarning,
    NotificationContainer: SyncNotificationContainer 
  } = useIOSSyncNotifications();

  const segmentOptions = [
    { value: 'accounts', label: 'Accounts' },
    { value: 'sync', label: 'Sync' },
    { value: 'settings', label: 'Settings' }
  ];

  const contextMenuActions = [
    {
      label: 'Edit Account',
      icon: <EditIcon fontSize="small" />,
      onAction: () => showInfo('Edit Account', 'Opening account editor...')
    },
    {
      label: 'Share',
      icon: <ShareIcon fontSize="small" />,
      onAction: () => showSuccess('Shared', 'Account details shared successfully')
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      destructive: true,
      onAction: () => showError('Delete Account', 'This action cannot be undone')
    }
  ];

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Demo Complete', 'Loading demonstration finished');
    }, 3000);
  };

  return (
    <IOSLayout title="iOS Demo - Phase 2">
      <Box sx={{ pb: 2 }}>
        <NotificationContainer />
        
        {/* Enhanced iOS Detection Demo */}
        <IOSDetectionDemo />
        
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Phase 2: Advanced iOS Components
        </Typography>

        {/* Search Bar Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            iOS Search Bar
          </Typography>
          <IOSSearchBar
            placeholder="Search accounts..."
            value={searchValue}
            onChange={setSearchValue}
            onFocus={() => showInfo('Search', 'Search bar focused')}
          />
        </IOSCard>

        {/* Segmented Control Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Segmented Control
          </Typography>
          <IOSSegmentedControl
            options={segmentOptions}
            value={segmentValue}
            onChange={setSegmentValue}
            fullWidth
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Selected: {segmentValue}
          </Typography>
        </IOSCard>

        {/* Toggle Switch Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            iOS Toggle Switches
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <IOSToggle
              checked={toggleValue}
              onChange={setToggleValue}
              label="Auto Sync Enabled"
            />
            <IOSToggle
              checked={true}
              onChange={() => {}}
              label="Push Notifications"
              color="primary"
            />
            <IOSToggle
              checked={false}
              onChange={() => {}}
              label="Disabled Option"
              disabled
            />
          </Box>
        </IOSCard>

        {/* Context Menu Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Context Menu (Long Press)
          </Typography>
          <IOSContextMenu actions={contextMenuActions}>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'action.hover',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <Typography variant="body2">
                Long press or hold this card to see context menu
              </Typography>
            </Box>
          </IOSContextMenu>
        </IOSCard>

        {/* Bottom Sheet Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Bottom Sheet Modal
          </Typography>
          <IOSButton 
            variant="primary" 
            fullWidth
            onClick={() => setSheetOpen(true)}
          >
            Open Bottom Sheet
          </IOSButton>
        </IOSCard>

        {/* Loading States Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading States
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Spinners */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>iOS Spinners:</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <IOSSpinner size="small" />
                <IOSSpinner size="medium" />
                <IOSSpinner size="large" />
                <IOSPulsingDot />
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Progress Bar:</Typography>
              <IOSProgressBar progress={progress} showLabel />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <IOSButton 
                  variant="secondary" 
                  size="small"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10%
                </IOSButton>
                <IOSButton 
                  variant="secondary" 
                  size="small"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10%
                </IOSButton>
              </Box>
            </Box>

            {/* Skeletons */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Skeleton Loading:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <IOSSkeleton width="100%" height="20px" />
                <IOSSkeleton width="80%" height="16px" />
                <IOSSkeleton width="60%" height="16px" />
              </Box>
            </Box>

            {/* Loading Overlay */}
            <IOSLoadingOverlay loading={loading} message="Processing...">
              <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: '8px' }}>
                <Typography variant="body2">
                  This content can be overlaid with loading state
                </Typography>
                <IOSButton 
                  variant="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={handleLoadingDemo}
                >
                  Demo Loading Overlay
                </IOSButton>
              </Box>
            </IOSLoadingOverlay>
          </Box>
        </IOSCard>

        {/* Progress Indicators Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            iOS Progress Indicators
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Linear Progress Indicators */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Linear Progress:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <IOSProgressIndicator 
                  progress={progress} 
                  variant="linear" 
                  showLabel={true}
                  label="Sync Progress"
                />
                <IOSProgressIndicator 
                  progress={85} 
                  variant="linear" 
                  color="success"
                  size="small"
                  showLabel={true}
                />
                <IOSProgressIndicator 
                  variant="linear" 
                  color="warning"
                  size="large"
                  showLabel={true}
                  label="Processing..."
                />
              </Box>
            </Box>

            {/* Circular Progress Indicators */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Circular Progress:</Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                <IOSProgressIndicator 
                  progress={progress} 
                  variant="circular" 
                  showLabel={true}
                  size="small"
                />
                <IOSProgressIndicator 
                  progress={75} 
                  variant="circular" 
                  color="success"
                  showLabel={true}
                />
                <IOSProgressIndicator 
                  variant="circular" 
                  color="primary"
                  size="large"
                  showLabel={true}
                  label="Loading"
                />
              </Box>
            </Box>
          </Box>
        </IOSCard>

        {/* Status Badges Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            iOS Status Badges
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Filled Badges */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Filled Badges:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <IOSStatusBadge status="success" text="Synced" />
                <IOSStatusBadge status="error" text="Failed" />
                <IOSStatusBadge status="warning" text="Pending" />
                <IOSStatusBadge status="info" text="Info" />
                <IOSStatusBadge status="active" text="Online" />
                <IOSStatusBadge status="inactive" text="Offline" />
              </Box>
            </Box>

            {/* Outlined Badges */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Outlined Badges:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <IOSStatusBadge status="success" text="Connected" variant="outlined" />
                <IOSStatusBadge status="warning" text="Attention" variant="outlined" />
                <IOSStatusBadge status="error" text="Disconnected" variant="outlined" />
              </Box>
            </Box>

            {/* Dot Badges */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Dot Badges:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <IOSStatusBadge status="active" text="Account is active" variant="dot" />
                <IOSStatusBadge status="syncing" text="Syncing in progress..." variant="dot" animated />
                <IOSStatusBadge status="pending" text="Waiting for response..." variant="dot" animated />
                <IOSStatusBadge status="inactive" text="Account is inactive" variant="dot" />
              </Box>
            </Box>

            {/* Different Sizes */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Different Sizes:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IOSStatusBadge status="success" text="Small" size="small" />
                <IOSStatusBadge status="warning" text="Medium" size="medium" />
                <IOSStatusBadge status="error" text="Large" size="large" />
              </Box>
            </Box>

            {/* Interactive Badges */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Interactive Badges:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <IOSStatusBadge 
                  status="info" 
                  text="Click me" 
                  onClick={() => showInfo('Badge Clicked', 'You clicked the status badge!')}
                />
                <IOSStatusBadge 
                  status="success" 
                  text="Refresh" 
                  onClick={() => showSuccess('Refreshed', 'Data has been refreshed')}
                />
              </Box>
            </Box>
          </Box>
        </IOSCard>

        {/* Sync Progress Indicators Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sync Progress Indicators
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Sync Variant Progress */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Sync States:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <IOSProgressIndicator 
                  variant="sync"
                  syncState="syncing"
                  showIcon={true}
                  animated={true}
                  transitionsCount={150}
                  estimatedTime="2 minutes"
                />
                <IOSProgressIndicator 
                  variant="sync"
                  syncState="completed"
                  showIcon={true}
                  transitionsCount={200}
                />
                <IOSProgressIndicator 
                  variant="sync"
                  syncState="failed"
                  showIcon={true}
                />
                <IOSProgressIndicator 
                  variant="sync"
                  syncState="pending"
                  showIcon={true}
                  estimatedTime="5 minutes"
                />
              </Box>
            </Box>

            {/* Sync Status Badges */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Sync Status Badges:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <IOSStatusBadge status="syncing" text="Syncing" animated />
                <IOSStatusBadge status="completed" text="Completed" />
                <IOSStatusBadge status="failed" text="Failed" />
                <IOSStatusBadge status="queued" text="Queued" animated />
                <IOSStatusBadge status="processing" text="Processing" animated />
                <IOSStatusBadge status="idle" text="Idle" />
              </Box>
            </Box>

            {/* Progress with Sync States */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>Progress with Sync Data:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <IOSProgressIndicator 
                  variant="sync"
                  progress={progress}
                  syncState="syncing"
                  showIcon={true}
                  transitionsCount={Math.round(progress * 2)}
                  estimatedTime={`${Math.round((100 - progress) / 10)} minutes`}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <IOSButton 
                    variant="secondary" 
                    size="small"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    -10%
                  </IOSButton>
                  <IOSButton 
                    variant="secondary" 
                    size="small"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    +10%
                  </IOSButton>
                </Box>
              </Box>
            </Box>
          </Box>
        </IOSCard>

        {/* Notification Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            iOS Notifications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSuccess('Success!', 'Operation completed successfully')}
            >
              Show Success
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showError('Error!', 'Something went wrong')}
            >
              Show Error
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showWarning('Warning!', 'Please check your settings')}
            >
              Show Warning
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showInfo('Info', 'Here is some information')}
            >
              Show Info
            </IOSButton>
          </Box>
        </IOSCard>

        {/* Sync Notifications Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Sync Notifications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSyncStarted('Test Account', 150)}
            >
              Show Sync Started
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSyncProgress(progress, Math.round(progress * 2), '2 minutes')}
            >
              Show Sync Progress
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSyncCompleted(200, 'Test Account')}
            >
              Show Sync Completed
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSyncFailed('Network timeout', 'Test Account')}
            >
              Show Sync Failed
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => showSyncWarning('Partial sync completed', 'Test Account')}
            >
              Show Sync Warning
            </IOSButton>
          </Box>
        </IOSCard>

        {/* Phase 1 Components */}
        <Typography variant="h5" sx={{ mb: 3, mt: 4, fontWeight: 600 }}>
          Phase 1: Basic iOS Components
        </Typography>

        {/* iOS Cards Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Account Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your PocketSmith and YNAB accounts are synchronized and up to date.
          </Typography>
        </IOSCard>

        <IOSCard elevated>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Sync
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last synchronized 5 minutes ago
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IOSButton variant="primary" size="small">
              Sync Now
            </IOSButton>
            <IOSButton variant="secondary" size="small">
              View Details
            </IOSButton>
          </Box>
        </IOSCard>

        {/* iOS Buttons Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Button Styles
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <IOSButton variant="primary" fullWidth>
              Primary Action
            </IOSButton>
            <IOSButton variant="secondary" fullWidth>
              Secondary Action
            </IOSButton>
            <IOSButton variant="destructive" fullWidth>
              Delete Account
            </IOSButton>
            <IOSButton variant="plain" fullWidth>
              Cancel
            </IOSButton>
          </Box>
        </IOSCard>

        {/* Enhanced iOS Sync Controls Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Enhanced Sync Controls
          </Typography>
          <IOSSyncControls
            autoRefresh={true}
            onAutoRefreshToggle={(enabled) => {
              console.log('Auto-refresh:', enabled);
              showInfo('Setting Updated', `Auto-refresh ${enabled ? 'enabled' : 'disabled'}`);
            }}
            onRefresh={() => {
              console.log('Refresh triggered');
              showInfo('Refreshing', 'Data refresh initiated');
            }}
            onManualSync={(options) => {
              console.log('Manual sync:', options);
              if (options?.forceSync) {
                showSyncStarted('All Accounts', 500);
                setTimeout(() => showSyncCompleted(500), 3000);
              } else {
                showSyncStarted('Recent Transactions', 50);
                setTimeout(() => showSyncCompleted(50), 1500);
              }
            }}
            isRefreshing={false}
            isSyncTriggering={false}
            lastUpdated={new Date()}
            syncNotifications={true}
            onSyncNotificationsToggle={(enabled) => {
              console.log('Sync notifications:', enabled);
              showInfo('Notifications', `Sync notifications ${enabled ? 'enabled' : 'disabled'}`);
            }}
            backgroundSync={false}
            onBackgroundSyncToggle={(enabled) => {
              console.log('Background sync:', enabled);
              showInfo('Background Sync', `Background sync ${enabled ? 'enabled' : 'disabled'}`);
            }}
            syncFrequency="30s"
            onSyncFrequencyChange={(frequency) => {
              console.log('Sync frequency:', frequency);
              showInfo('Frequency Updated', `Sync frequency set to ${frequency}`);
            }}
          />
        </IOSCard>
      </Box>

      {/* Bottom Sheet */}
      <IOSBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Account Settings"
        height="half"
      >
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Configure your account settings
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <IOSToggle
              checked={true}
              onChange={() => {}}
              label="Enable notifications"
            />
            <IOSToggle
              checked={false}
              onChange={() => {}}
              label="Auto-sync on app open"
            />
            <IOSToggle
              checked={true}
              onChange={() => {}}
              label="Background sync"
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <IOSButton 
              variant="primary" 
              fullWidth
              onClick={() => {
                showSuccess('Settings Saved', 'Your preferences have been updated');
                setSheetOpen(false);
              }}
            >
              Save Changes
            </IOSButton>
            <IOSButton 
              variant="secondary" 
              fullWidth
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </IOSButton>
          </Box>
        </Box>
      </IOSBottomSheet>
      
      {/* Notification Containers */}
      <NotificationContainer />
      <SyncNotificationContainer position="top" />
    </IOSLayout>
  );
};

export default IOSDemo;