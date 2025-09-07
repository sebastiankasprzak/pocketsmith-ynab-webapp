import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { 
  Timeline,
  Receipt,
  TrendingUp
} from '@mui/icons-material';
import { IOSCard } from './IOSCard';
import { IOSListItem } from './IOSListItem';
import type { RecentTransactionActivity } from '../services/syncApi';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface SimpleRecentActivityProps {
  recentActivity: RecentTransactionActivity[];
}

export const SimpleRecentActivity: React.FC<SimpleRecentActivityProps> = ({
  recentActivity,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const totalTransactions = recentActivity.reduce((sum, account) => sum + account.count, 0);
  const topAccounts = recentActivity
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Show top 5 most active accounts

  return (
    <IOSCard>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Timeline sx={{ 
          color: isDark ? '#007AFF' : '#007AFF',
          fontSize: 24
        }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Recent Activity
        </Typography>
        <Typography variant="caption" sx={{ 
          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
          ml: 'auto'
        }}>
          Last 24 hours
        </Typography>
      </Box>

      {/* Summary */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        p: 2,
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.5)' : 'rgba(242, 242, 247, 0.8)',
        borderRadius: '12px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ 
            color: isDark ? '#34C759' : '#34C759',
            fontSize: 20
          }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Total Transactions
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ 
          color: isDark ? '#34C759' : '#34C759',
          fontWeight: 700
        }}>
          {totalTransactions.toLocaleString()}
        </Typography>
      </Box>

      {/* Recent Activity List */}
      {topAccounts.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600, 
            mb: 2,
            color: isDark ? 'rgba(235, 235, 245, 0.8)' : 'rgba(60, 60, 67, 0.8)'
          }}>
            Most Active Accounts
          </Typography>
          
          {topAccounts.map((account) => {
            const accountName = account.account_name || `Account ${account.account_id}`;
            const mostRecentTransaction = account.recent_transactions[0];
            
            return (
              <IOSListItem
                key={account.account_id}
                primary={accountName}
                secondary={
                  mostRecentTransaction ? 
                    `Last transaction ${formatDistanceToNow(parseISO(mostRecentTransaction.processed_at))} ago` :
                    'No recent transactions'
                }
                icon={
                  <Receipt sx={{ 
                    color: '#007AFF',
                    fontSize: 20
                  }} />
                }
                action={
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}>
                      {account.count}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                    }}>
                      transactions
                    </Typography>
                  </Box>
                }
                disclosure={false}
              />
            );
          })}
          
          {recentActivity.length > 5 && (
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              display: 'block',
              textAlign: 'center',
              mt: 2
            }}>
              ... and {recentActivity.length - 5} more accounts with activity
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Timeline sx={{ 
            fontSize: 48, 
            color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
            mb: 2
          }} />
          <Typography variant="body2" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
          }}>
            No recent transaction activity
          </Typography>
        </Box>
      )}
    </IOSCard>
  );
};