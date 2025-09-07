import React, { useState } from 'react';
import { Box, Typography, useTheme, Collapse, IconButton } from '@mui/material';
import { 
  Timeline as TimelineIcon,
  AccessTime,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  AccountBalance,
  Receipt
} from '@mui/icons-material';
import { IOSSection } from './IOSSection';
import { IOSCard } from './IOSCard';
import { IOSListItem } from './IOSListItem';
import { IOSStatusBadge } from './IOSStatusBadge';
import { IOSSegmentedControl } from './IOSSegmentedControl';
import type { RecentTransactionActivity } from '../services/syncApi';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface IOSSyncTimelineProps {
  recentActivity: RecentTransactionActivity[];
  hours: number;
  onHoursChange: (hours: number) => void;
  loading?: boolean;
}

export const IOSSyncTimeline: React.FC<IOSSyncTimelineProps> = ({
  recentActivity,
  hours,
  onHoursChange,
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const timeRangeOptions = [
    { label: '1H', value: '1' },
    { label: '6H', value: '6' },
    { label: '24H', value: '24' },
    { label: '3D', value: '72' },
    { label: '1W', value: '168' },
  ];

  const handleTimeRangeChange = (value: string) => {
    onHoursChange(parseInt(value, 10));
  };

  const toggleAccountExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const totalRecentTransactions = recentActivity.reduce((sum, account) => sum + account.count, 0);
  const sortedActivity = recentActivity
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Show top 10 most active accounts

  const getTimeRangeLabel = () => {
    if (hours === 1) return 'Last Hour';
    if (hours < 24) return `Last ${hours} Hours`;
    if (hours === 24) return 'Last 24 Hours';
    if (hours === 72) return 'Last 3 Days';
    if (hours === 168) return 'Last Week';
    return `Last ${Math.round(hours / 24)} Days`;
  };

  return (
    <IOSSection 
      title="Recent Activity"
      headerAction={
        <IOSSegmentedControl
          options={timeRangeOptions}
          value={hours.toString()}
          onChange={handleTimeRangeChange}
          size="small"
        />
      }
    >
      {/* Activity Summary */}
      <IOSCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TimelineIcon sx={{ 
            color: isDark ? '#007AFF' : '#007AFF',
            fontSize: 24
          }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getTimeRangeLabel()}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 2,
          mb: 2
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              color: isDark ? '#007AFF' : '#007AFF',
              fontWeight: 700,
              mb: 0.5
            }}>
              {totalRecentTransactions}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              fontSize: '11px'
            }}>
              Total Transactions
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              color: isDark ? '#34C759' : '#34C759',
              fontWeight: 700,
              mb: 0.5
            }}>
              {recentActivity.length}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              fontSize: '11px'
            }}>
              Active Accounts
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              color: isDark ? '#FF9500' : '#FF9500',
              fontWeight: 700,
              mb: 0.5
            }}>
              {totalRecentTransactions > 0 ? Math.round(totalRecentTransactions / Math.max(recentActivity.length, 1)) : 0}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              fontSize: '11px'
            }}>
              Avg per Account
            </Typography>
          </Box>
        </Box>
      </IOSCard>

      {/* Activity Timeline */}
      {sortedActivity.length > 0 ? (
        <IOSCard>
          {sortedActivity.map((account, index) => {
            const isExpanded = expandedAccounts.has(account.account_id);
            const mostRecentTransaction = account.recent_transactions[0];
            const accountName = account.account_name || `Account ${account.account_id}`;

            return (
              <React.Fragment key={account.account_id}>
                <IOSListItem
                  primary={accountName}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Most recent: {mostRecentTransaction ? 
                          formatDistanceToNow(parseISO(mostRecentTransaction.processed_at)) + ' ago' : 
                          'No recent activity'
                        }
                      </Typography>
                    </Box>
                  }
                  icon={
                    <Box sx={{ 
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AccountBalance sx={{ 
                        color: '#007AFF',
                        fontSize: 20
                      }} />
                      {/* Timeline connector */}
                      {index < sortedActivity.length - 1 && (
                        <Box sx={{
                          position: 'absolute',
                          top: 24,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 2,
                          height: 40,
                          backgroundColor: isDark ? 'rgba(84, 84, 88, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                        }} />
                      )}
                    </Box>
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IOSStatusBadge
                        status="info"
                        text={`${account.count}`}
                        variant="filled"
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => toggleAccountExpansion(account.account_id)}
                        sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <ExpandMore />
                      </IconButton>
                    </Box>
                  }
                  disclosure={false}
                />

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    mx: 2, 
                    mb: 2, 
                    p: 2, 
                    backgroundColor: isDark ? 'rgba(28, 28, 30, 0.5)' : 'rgba(242, 242, 247, 0.8)',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}>
                      Recent Transactions
                    </Typography>
                    
                    {account.recent_transactions.slice(0, 5).map((transaction, txIndex) => (
                      <Box 
                        key={transaction.transaction_id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: txIndex < Math.min(account.recent_transactions.length, 5) - 1 
                            ? `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
                            : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Receipt sx={{ 
                            fontSize: 14, 
                            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                          }} />
                          <Typography variant="caption" sx={{ 
                            fontFamily: 'monospace',
                            color: isDark ? 'rgba(235, 235, 245, 0.8)' : 'rgba(60, 60, 67, 0.8)'
                          }}>
                            {transaction.transaction_id.slice(-8)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                        }}>
                          {formatDistanceToNow(parseISO(transaction.processed_at))} ago
                        </Typography>
                      </Box>
                    ))}
                    
                    {account.recent_transactions.length > 5 && (
                      <Typography variant="caption" sx={{ 
                        color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                        mt: 1,
                        display: 'block'
                      }}>
                        ... and {account.recent_transactions.length - 5} more transactions
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </React.Fragment>
            );
          })}
        </IOSCard>
      ) : (
        <IOSCard>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ 
              fontSize: 48, 
              color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
              mb: 2
            }} />
            <Typography variant="body2" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
            }}>
              No transaction activity in the {getTimeRangeLabel().toLowerCase()}
            </Typography>
          </Box>
        </IOSCard>
      )}

      {recentActivity.length > 10 && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ 
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
          }}>
            Showing top 10 most active accounts. {recentActivity.length - 10} more accounts had activity.
          </Typography>
        </Box>
      )}
    </IOSSection>
  );
};

export default IOSSyncTimeline;