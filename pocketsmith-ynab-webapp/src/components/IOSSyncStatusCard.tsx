import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  Sync, 
  CheckCircle, 
  Schedule, 
  TrendingUp,
  AccountBalance,
  Timeline,
  Speed as PerformanceIcon
} from '@mui/icons-material';
import { IOSSection } from './IOSSection';
import { IOSCard } from './IOSCard';
import { IOSStatusBadge } from './IOSStatusBadge';
import { IOSProgressIndicator } from './IOSProgressIndicator';
import { IOSListItem } from './IOSListItem';
import type { SyncStateOverview } from '../services/syncApi';
import type { IOSStatusType } from './IOSStatusBadge';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface IOSSyncStatusCardProps {
  syncStateOverview: SyncStateOverview;
  onRefresh?: () => void;
  loading?: boolean;
}

export const IOSSyncStatusCard: React.FC<IOSSyncStatusCardProps> = ({
  syncStateOverview,
  onRefresh,
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getLastActivityText = () => {
    if (!syncStateOverview.last_activity) {
      return 'No recent activity';
    }
    
    try {
      const lastActivity = parseISO(syncStateOverview.last_activity);
      return `${formatDistanceToNow(lastActivity)} ago`;
    } catch {
      return 'Unknown';
    }
  };

  const getActivityStatus = (): { status: IOSStatusType; text: string; animated?: boolean } => {
    if (!syncStateOverview.last_activity) {
      return { status: 'idle', text: 'Idle' };
    }

    const lastActivity = parseISO(syncStateOverview.last_activity);
    const hoursAgo = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 0.5) {
      return { status: 'active', text: 'Active', animated: true };
    } else if (hoursAgo < 1) {
      return { status: 'success', text: 'Recent' };
    } else if (hoursAgo < 6) {
      return { status: 'warning', text: 'Moderate' };
    } else if (hoursAgo < 24) {
      return { status: 'warning', text: 'Aging' };
    } else {
      return { status: 'error', text: 'Stale' };
    }
  };

  const getSyncProgress = () => {
    const totalAccounts = syncStateOverview.total_accounts;
    const syncedAccounts = syncStateOverview.accounts.filter(acc => acc.last_sync).length;
    return totalAccounts > 0 ? (syncedAccounts / totalAccounts) * 100 : 0;
  };

  const activityStatus = getActivityStatus();
  const syncedAccountsCount = syncStateOverview.accounts.filter(acc => acc.last_sync).length;
  const avgTransactionsPerAccount = Math.round(
    syncStateOverview.total_processed_transactions / Math.max(syncStateOverview.total_accounts, 1)
  );

  return (
    <IOSSection title="Sync Overview">
      {/* Status Header */}
      <IOSCard>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sync sx={{ 
              color: isDark ? '#007AFF' : '#007AFF',
              fontSize: 24
            }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sync Status
            </Typography>
          </Box>
          <IOSStatusBadge
            status={activityStatus.status}
            text={activityStatus.text}
            animated={activityStatus.animated}
          />
        </Box>

        {loading && (
          <Box sx={{ mb: 2 }}>
            <IOSProgressIndicator 
              variant="sync" 
              syncState="syncing"
              animated={true}
              showIcon={true}
              label="Refreshing sync status..."
            />
          </Box>
        )}

        {/* Key Metrics */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 2,
          mb: 2
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
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
              Total Accounts
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
              color: isDark ? '#34C759' : '#34C759',
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

        {/* Activity Summary */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pt: 2,
          borderTop: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
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
      </IOSCard>

      {/* Sync Progress */}
      <IOSCard>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Account Sync Progress
          </Typography>
          <IOSProgressIndicator
            variant="linear"
            progress={getSyncProgress()}
            size="medium"
            color="success"
            showLabel={true}
            label={`${syncedAccountsCount} of ${syncStateOverview.total_accounts} accounts synced`}
          />
        </Box>
        
        <IOSListItem
          primary="Synced Accounts"
          secondary={`${syncedAccountsCount} of ${syncStateOverview.total_accounts} accounts have been synced`}
          icon={<CheckCircle sx={{ color: '#34C759' }} />}
          action={
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#34C759' }}>
              {syncedAccountsCount}
            </Typography>
          }
        />
        
        <IOSListItem
          primary="Average Performance"
          secondary="Transactions processed per account"
          icon={<PerformanceIcon sx={{ color: '#007AFF' }} />}
          action={
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#007AFF' }}>
              {avgTransactionsPerAccount}
            </Typography>
          }
        />
      </IOSCard>
    </IOSSection>
  );
};

export default IOSSyncStatusCard;