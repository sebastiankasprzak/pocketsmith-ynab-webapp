import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  AccountBalance,
  CheckCircle,
  Schedule,
  Error
} from '@mui/icons-material';
import { IOSCard } from './IOSCard';
import { IOSStatusBadge } from './IOSStatusBadge';
import type { SyncStateAccount } from '../services/syncApi';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SimpleAccountSyncProps {
  accounts: SyncStateAccount[];
}

export const SimpleAccountSync: React.FC<SimpleAccountSyncProps> = ({
  accounts,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getSyncStatus = (account: SyncStateAccount) => {
    if (!account.last_sync) {
      return { 
        status: 'error' as const, 
        text: 'Never synced',
        icon: <Error sx={{ color: '#FF3B30', fontSize: 20 }} />
      };
    }

    const lastSync = parseISO(account.last_sync);
    const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      return { 
        status: 'success' as const, 
        text: 'Recently synced',
        icon: <CheckCircle sx={{ color: '#34C759', fontSize: 20 }} />
      };
    } else if (hoursAgo < 24) {
      return { 
        status: 'warning' as const, 
        text: 'Synced today',
        icon: <Schedule sx={{ color: '#FF9500', fontSize: 20 }} />
      };
    } else {
      return { 
        status: 'error' as const, 
        text: 'Sync overdue',
        icon: <Error sx={{ color: '#FF3B30', fontSize: 20 }} />
      };
    }
  };

  // Sort accounts by last sync time (most recent first)
  const sortedAccounts = accounts
    .sort((a, b) => {
      const aSync = a.last_sync ? parseISO(a.last_sync).getTime() : 0;
      const bSync = b.last_sync ? parseISO(b.last_sync).getTime() : 0;
      return bSync - aSync;
    });

  const syncedCount = accounts.filter(acc => acc.last_sync).length;
  const recentlySyncedCount = accounts.filter(acc => {
    if (!acc.last_sync) return false;
    const hoursAgo = (Date.now() - parseISO(acc.last_sync).getTime()) / (1000 * 60 * 60);
    return hoursAgo < 24;
  }).length;

  return (
    <IOSCard>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AccountBalance sx={{ 
          color: isDark ? '#007AFF' : '#007AFF',
          fontSize: 24
        }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Account Sync Details
        </Typography>
      </Box>

      {/* Summary */}
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
          <Typography variant="h6" sx={{ 
            color: isDark ? '#007AFF' : '#007AFF',
            fontWeight: 700,
            mb: 0.5
          }}>
            {accounts.length}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '11px'
          }}>
            Total
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ 
            color: isDark ? '#34C759' : '#34C759',
            fontWeight: 700,
            mb: 0.5
          }}>
            {recentlySyncedCount}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '11px'
          }}>
            Recent
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ 
            color: isDark ? '#FF3B30' : '#FF3B30',
            fontWeight: 700,
            mb: 0.5
          }}>
            {accounts.length - syncedCount}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            fontSize: '11px'
          }}>
            Never Synced
          </Typography>
        </Box>
      </Box>

      {/* Account List */}
      <Box>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          mb: 2,
          color: isDark ? 'rgba(235, 235, 245, 0.8)' : 'rgba(60, 60, 67, 0.8)'
        }}>
          Sync Status by Account
        </Typography>
        
        {sortedAccounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
            }}>
              No account data available
            </Typography>
          </Box>
        ) : (
          sortedAccounts.map((account) => {
            const syncStatus = getSyncStatus(account);
            const accountName = account.account_name || `Account ${account.account_id}`;
            
            return (
              <Box 
                key={account.account_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  mb: 1,
                  backgroundColor: isDark ? 'rgba(28, 28, 30, 0.5)' : 'rgba(242, 242, 247, 0.8)',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
                }}
              >
                {/* Left side - Icon and Account Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  {syncStatus.icon}
                  <Box>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}>
                      {accountName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <IOSStatusBadge
                        status={syncStatus.status}
                        text={syncStatus.text}
                        variant="minimal"
                        size="small"
                      />
                      <Typography variant="caption" sx={{ 
                        color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                      }}>
                        {account.processed_transactions_count.toLocaleString()} transactions
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Right side - Last Sync Info */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500,
                    color: isDark ? '#FFFFFF' : '#000000'
                  }}>
                    {account.last_sync ? 
                      formatDistanceToNow(parseISO(account.last_sync)) + ' ago' : 
                      'Never'
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                  }}>
                    last sync
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </IOSCard>
  );
};