import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  Settings,
  Refresh,
  PlayArrow,
  Schedule,
  Notifications,
  CloudSync
} from '@mui/icons-material';
import { IOSSection } from './IOSSection';
import { IOSCard } from './IOSCard';
import { IOSListItem } from './IOSListItem';
import { IOSButton } from './IOSButton';
import { IOSToggle } from './IOSToggle';
import { IOSActionSheet } from './IOSActionSheet';
import { IOSConfirmationDialog } from './IOSConfirmationDialog';
import { IOSStatusBadge } from './IOSStatusBadge';

interface IOSSyncControlsProps {
  autoRefresh: boolean;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  onManualSync: (options?: { 
    forceSync?: boolean; 
    accountIds?: string[]; 
    dateRange?: { startDate: string; endDate: string } 
  }) => void;
  isRefreshing?: boolean;
  isSyncTriggering?: boolean;
  lastUpdated?: Date;
  // Additional sync settings
  syncNotifications?: boolean;
  onSyncNotificationsToggle?: (enabled: boolean) => void;
  backgroundSync?: boolean;
  onBackgroundSyncToggle?: (enabled: boolean) => void;
  syncFrequency?: 'realtime' | '30s' | '1m' | '5m' | 'manual';
  onSyncFrequencyChange?: (frequency: string) => void;
}

export const IOSSyncControls: React.FC<IOSSyncControlsProps> = ({
  autoRefresh,
  onAutoRefreshToggle,
  onRefresh,
  onManualSync,
  isRefreshing = false,
  isSyncTriggering = false,
  lastUpdated,
  syncNotifications = true,
  onSyncNotificationsToggle,
  backgroundSync = false,
  onBackgroundSyncToggle,
  syncFrequency = '30s',
  onSyncFrequencyChange,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showSyncActionSheet, setShowSyncActionSheet] = useState(false);
  const [showForceConfirmation, setShowForceConfirmation] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const handleManualSyncPress = () => {
    setShowSyncActionSheet(true);
  };

  const handleQuickSync = () => {
    setShowSyncActionSheet(false);
    onManualSync();
  };

  const handleForceSync = () => {
    setShowSyncActionSheet(false);
    setShowForceConfirmation(true);
  };

  const handleConfirmForceSync = () => {
    setShowForceConfirmation(false);
    onManualSync({ forceSync: true });
  };

  const handleSyncSettings = () => {
    setShowSyncActionSheet(false);
    setShowSyncSettings(true);
  };

  const handleSelectiveSync = () => {
    setShowSyncActionSheet(false);
    // This would open a more detailed sync dialog with account selection
    // For now, we'll just trigger a regular sync
    onManualSync();
  };

  const handleFrequencyChange = () => {
    setShowFrequencyPicker(true);
  };

  const syncActions = [
    {
      label: 'Quick Sync',
      onPress: handleQuickSync,
      icon: <PlayArrow />,
      description: 'Sync recent transactions'
    },
    {
      label: 'Selective Sync',
      onPress: handleSelectiveSync,
      icon: <Settings />,
      description: 'Choose specific accounts'
    },
    {
      label: 'Force Full Sync',
      onPress: handleForceSync,
      icon: <Refresh />,
      description: 'Force sync all accounts',
      destructive: false
    },
    {
      label: 'Sync Settings',
      onPress: handleSyncSettings,
      icon: <Settings />,
      description: 'Configure sync options'
    }
  ];

  const frequencyOptions = [
    { label: 'Real-time', value: 'realtime' },
    { label: 'Every 30 seconds', value: '30s' },
    { label: 'Every minute', value: '1m' },
    { label: 'Every 5 minutes', value: '5m' },
    { label: 'Manual only', value: 'manual' }
  ];

  const syncSettingsActions = [
    {
      label: 'Change Frequency',
      onPress: handleFrequencyChange,
      icon: <Schedule />
    },
    {
      label: onSyncNotificationsToggle ? (syncNotifications ? 'Disable Notifications' : 'Enable Notifications') : 'Notifications',
      onPress: () => {
        setShowSyncSettings(false);
        onSyncNotificationsToggle?.(!syncNotifications);
      },
      icon: <Settings />
    },
    {
      label: onBackgroundSyncToggle ? (backgroundSync ? 'Disable Background Sync' : 'Enable Background Sync') : 'Background Sync',
      onPress: () => {
        setShowSyncSettings(false);
        onBackgroundSyncToggle?.(!backgroundSync);
      },
      icon: <Settings />
    }
  ];

  const getLastUpdatedText = () => {
    if (!lastUpdated) return 'Never updated';
    return `Updated ${lastUpdated.toLocaleTimeString()}`;
  };

  const getSyncStatus = () => {
    if (isSyncTriggering) {
      return { status: 'syncing' as const, text: 'Syncing...' };
    }
    if (isRefreshing) {
      return { status: 'syncing' as const, text: 'Refreshing...' };
    }
    if (autoRefresh) {
      return { status: 'active' as const, text: 'Auto-refresh enabled' };
    }
    return { status: 'inactive' as const, text: 'Manual refresh only' };
  };

  const syncStatus = getSyncStatus();

  return (
    <IOSSection title="Sync Controls">
      {/* Status and Quick Actions */}
      <IOSCard>
        <IOSListItem
          leftIcon={
            <Settings sx={{ 
              color: isDark ? '#007AFF' : '#007AFF',
              fontSize: 20
            }} />
          }
          rightContent={
            <IOSStatusBadge
              status={syncStatus.status}
              text={syncStatus.text}
              animated={syncStatus.status === 'syncing'}
            />
          }
          subtitle={getLastUpdatedText()}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Sync Status
          </Typography>
        </IOSListItem>

        <IOSListItem
          leftIcon={
            <Schedule sx={{ 
              color: autoRefresh ? '#34C759' : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
              fontSize: 20
            }} />
          }
          rightContent={
            <IOSToggle
              checked={autoRefresh}
              onChange={onAutoRefreshToggle}
              disabled={isRefreshing || isSyncTriggering}
            />
          }
          subtitle={`Automatically refresh data every ${syncFrequency === 'manual' ? 'manual' : syncFrequency}`}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Auto-refresh
          </Typography>
        </IOSListItem>

        {onSyncNotificationsToggle && (
          <IOSListItem
            leftIcon={
              <Notifications sx={{ 
                color: syncNotifications ? '#007AFF' : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
                fontSize: 20
              }} />
            }
            rightContent={
              <IOSToggle
                checked={syncNotifications}
                onChange={onSyncNotificationsToggle}
                disabled={isRefreshing || isSyncTriggering}
              />
            }
            subtitle="Show notifications for sync events"
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Sync Notifications
            </Typography>
          </IOSListItem>
        )}

        {onBackgroundSyncToggle && (
          <IOSListItem
            leftIcon={
              <CloudSync sx={{ 
                color: backgroundSync ? '#007AFF' : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
                fontSize: 20
              }} />
            }
            rightContent={
              <IOSToggle
                checked={backgroundSync}
                onChange={onBackgroundSyncToggle}
                disabled={isRefreshing || isSyncTriggering}
              />
            }
            subtitle="Continue syncing when app is in background"
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Background Sync
            </Typography>
          </IOSListItem>
        )}
      </IOSCard>

      {/* Action Buttons */}
      <IOSCard>
        <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
          <IOSButton
            variant="filled"
            size="medium"
            onClick={onRefresh}
            disabled={isRefreshing || isSyncTriggering}
            hapticFeedback={true}
            pressAnimation={true}
            fullWidth
            startIcon={<Refresh />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </IOSButton>

          <IOSButton
            variant="filled"
            size="medium"
            onClick={handleManualSyncPress}
            disabled={isRefreshing || isSyncTriggering}
            hapticFeedback={true}
            pressAnimation={true}
            fullWidth
            startIcon={<PlayArrow />}
            sx={{
              backgroundColor: isDark ? '#34C759' : '#34C759',
              '&:hover': {
                backgroundColor: isDark ? '#30B050' : '#30B050',
              }
            }}
          >
            {isSyncTriggering ? 'Syncing...' : 'Manual Sync'}
          </IOSButton>
        </Box>
      </IOSCard>

      {/* Sync Options Action Sheet */}
      <IOSActionSheet
        open={showSyncActionSheet}
        onClose={() => setShowSyncActionSheet(false)}
        title="Sync Options"
        message="Choose the type of synchronization to perform"
        actions={syncActions}
      />

      {/* Force Sync Confirmation */}
      <IOSConfirmationDialog
        open={showForceConfirmation}
        onClose={() => setShowForceConfirmation(false)}
        onConfirm={handleConfirmForceSync}
        title="Force Full Sync"
        message="This will force a complete synchronization of all accounts. This may take several minutes and could impact performance. Are you sure you want to continue?"
        confirmText="Force Sync"
        cancelText="Cancel"
        destructive={false}
      />

      {/* Sync Settings Action Sheet */}
      <IOSActionSheet
        open={showSyncSettings}
        onClose={() => setShowSyncSettings(false)}
        title="Sync Settings"
        message="Configure synchronization preferences"
        actions={syncSettingsActions}
      />

      {/* Frequency Picker Action Sheet */}
      <IOSActionSheet
        open={showFrequencyPicker}
        onClose={() => setShowFrequencyPicker(false)}
        title="Sync Frequency"
        message="Choose how often to automatically sync data"
        actions={frequencyOptions.map(option => ({
          label: option.label,
          onPress: () => {
            setShowFrequencyPicker(false);
            onSyncFrequencyChange?.(option.value);
          }
        }))}
      />
    </IOSSection>
  );
};

export default IOSSyncControls;