import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  Sync, 
  PlayArrow,
  Schedule
} from '@mui/icons-material';
import { IOSCard } from './IOSCard';
import { IOSButton } from './IOSButton';
import { IOSStatusBadge } from './IOSStatusBadge';
import type { SyncStateOverview } from '../services/syncApi';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SimpleSyncOverviewProps {
  syncStateOverview: SyncStateOverview;
  onManualSync: () => void;
  isRefreshing?: boolean;
  isSyncTriggering?: boolean;
  lastUpdated?: Date;
}

export const SimpleSyncOverview: React.FC<SimpleSyncOverviewProps> = ({
  syncStateOverview,
  onManualSync,
  isRefreshing = false,
  isSyncTriggering = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getLastActivityText = () => {
    if (!syncStateOverview.last_activity) {
      return 'No recent activity';
    }
    
    try {
      const lastActivity = parseISO(syncStateOverview.last_activity);
      return formatDistanceToNow(lastActivity) + ' ago';
    } catch {
      return 'Unknown';
    }
  };

  const getSyncStatus = () => {
    if (isSyncTriggering) {
      return { status: 'syncing' as const, text: 'Syncing...', animated: true };
    }
    if (isRefreshing) {
      return { status: 'syncing' as const, text: 'Refreshing...', animated: true };
    }
    
    if (!syncStateOverview.last_activity) {
      return { status: 'idle' as const, text: 'Idle' };
    }

    const lastActivity = parseISO(syncStateOverview.last_activity);
    const hoursAgo = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      return { status: 'success' as const, text: 'Active' };
    } else if (hoursAgo < 6) {
      return { status: 'warning' as const, text: 'Recent' };
    } else {
      return { status: 'error' as const, text: 'Stale' };
    }
  };

  const syncStatus = getSyncStatus();
  const syncedAccounts = syncStateOverview.accounts.filter(acc => acc.last_sync).length;

  return (
    <IOSCard>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Sync sx={{ 
            color: isDark ? '#007AFF' : '#007AFF',
            fontSize: 24
          }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sync Overview
          </Typography>
        </Box>
        <IOSStatusBadge
          status={syncStatus.status}
          text={syncStatus.text}
          animated={syncStatus.animated}
        />
      </Box>

      {/* Key Stats */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 2,
        mb: 3,
        p: 2,
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.5)' : 'rgba(242, 242, 247, 0.8)',
        borderRadius: '12px'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ 
            color: isDark ? '#007AFF' : '#007AFF',
            fontWeight: 700,
            mb: 0.5
          }}>
            {syncStateOverview.total_accounts}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '12px'
          }}>
            Accounts
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ 
            color: isDark ? '#34C759' : '#34C759',
            fontWeight: 700,
            mb: 0.5
          }}>
            {syncedAccounts}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '12px'
          }}>
            Synced
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ 
            color: isDark ? '#FF9500' : '#FF9500',
            fontWeight: 700,
            mb: 0.5
          }}>
            {syncStateOverview.total_processed_transactions.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '12px'
          }}>
            Transactions
          </Typography>
        </Box>
      </Box>

      {/* Last Activity */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: 16
          }} />
          <Typography variant="body2" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
          }}>
            Last Activity
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {getLastActivityText()}
        </Typography>
      </Box>

      {/* Manual Sync Button */}
      <IOSButton
        variant="filled"
        size="large"
        onClick={onManualSync}
        disabled={isRefreshing || isSyncTriggering}
        hapticFeedback={true}
        pressAnimation={true}
        fullWidth
        startIcon={<PlayArrow />}
        sx={{
          backgroundColor: isDark ? '#34C759' : '#34C759',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: isDark ? '#30B050' : '#30B050',
            color: '#FFFFFF',
          },
          '&:disabled': {
            backgroundColor: isDark ? 'rgba(52, 199, 89, 0.3)' : 'rgba(52, 199, 89, 0.3)',
            color: 'rgba(255, 255, 255, 0.6)',
          }
        }}
      >
        {isSyncTriggering ? 'Syncing...' : 'Start Manual Sync'}
      </IOSButton>
    </IOSCard>
  );
};