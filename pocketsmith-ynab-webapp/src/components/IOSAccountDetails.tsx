import React, { useState } from 'react';
import { Box, Typography, useTheme, Collapse, IconButton, TextField, InputAdornment } from '@mui/material';
import { 
  AccountBalance,
  ExpandMore,
  Search,
  CheckCircle,
  Schedule,
  Error,
  Receipt,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { IOSSection } from './IOSSection';
import { IOSCard } from './IOSCard';
import { IOSListItem } from './IOSListItem';
import { IOSStatusBadge } from './IOSStatusBadge';
import { IOSSegmentedControl } from './IOSSegmentedControl';
import { IOSSearchBar } from './IOSSearchBar';
import type { SyncStateAccount } from '../services/syncApi';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface IOSAccountDetailsProps {
  accounts: SyncStateAccount[];
  loading?: boolean;
}

type SortField = 'name' | 'lastSync' | 'transactions' | 'lastUpdated';

export const IOSAccountDetails: React.FC<IOSAccountDetailsProps> = ({
  accounts,
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSync');

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Last Sync', value: 'lastSync' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'Updated', value: 'lastUpdated' },
  ];

  const toggleAccountExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getSyncStatus = (account: SyncStateAccount) => {
    if (!account.last_sync) {
      return { 
        status: 'error' as const, 
        text: 'Never synced',
        color: '#FF3B30'
      };
    }

    const lastSync = parseISO(account.last_sync);
    const hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      return { 
        status: 'success' as const, 
        text: 'Recently synced',
        color: '#34C759'
      };
    } else if (hoursAgo < 24) {
      return { 
        status: 'warning' as const, 
        text: 'Synced today',
        color: '#FF9500'
      };
    } else {
      return { 
        status: 'error' as const, 
        text: 'Sync overdue',
        color: '#FF3B30'
      };
    }
  };

  const filteredAndSortedAccounts = accounts
    .filter(account => {
      const searchLower = searchTerm.toLowerCase();
      return (
        account.account_id.toLowerCase().includes(searchLower) ||
        (account.account_name && account.account_name.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      switch (sortField) {
        case 'name':
          const aName = a.account_name || a.account_id;
          const bName = b.account_name || b.account_id;
          return aName.localeCompare(bName);
        case 'lastSync':
          const aSync = a.last_sync ? parseISO(a.last_sync).getTime() : 0;
          const bSync = b.last_sync ? parseISO(b.last_sync).getTime() : 0;
          return bSync - aSync; // Most recent first
        case 'transactions':
          return b.processed_transactions_count - a.processed_transactions_count;
        case 'lastUpdated':
          const aUpdated = parseISO(a.last_updated).getTime();
          const bUpdated = parseISO(b.last_updated).getTime();
          return bUpdated - aUpdated; // Most recent first
        default:
          return 0;
      }
    });

  const syncedCount = accounts.filter(acc => acc.last_sync).length;
  const totalTransactions = accounts.reduce((sum, acc) => sum + acc.processed_transactions_count, 0);

  return (
    <IOSSection 
      title="Account Details"
      headerAction={
        <IOSSegmentedControl
          options={sortOptions}
          value={sortField}
          onChange={(value) => setSortField(value as SortField)}
          size="small"
        />
      }
    >
      {/* Search and Summary */}
      <IOSCard>
        <IOSSearchBar
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={setSearchTerm}
          showCancel={false}
        />
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 2,
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
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
              Total Accounts
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ 
              color: isDark ? '#34C759' : '#34C759',
              fontWeight: 700,
              mb: 0.5
            }}>
              {syncedCount}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              fontSize: '11px'
            }}>
              Synced
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ 
              color: isDark ? '#FF9500' : '#FF9500',
              fontWeight: 700,
              mb: 0.5
            }}>
              {totalTransactions.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              fontSize: '11px'
            }}>
              Transactions
            </Typography>
          </Box>
        </Box>
      </IOSCard>

      {/* Account List */}
      {filteredAndSortedAccounts.length > 0 ? (
        <IOSCard>
          {filteredAndSortedAccounts.map((account, index) => {
            const isExpanded = expandedAccounts.has(account.account_id);
            const syncStatus = getSyncStatus(account);
            const accountName = account.account_name || `Account ${account.account_id}`;

            return (
              <React.Fragment key={account.account_id}>
                <IOSListItem
                  primary={accountName}
                  secondary={
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
                  }
                  icon={
                    <AccountBalance sx={{ 
                      color: syncStatus.color,
                      fontSize: 20
                    }} />
                  }
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                      }}>
                        {account.last_sync ? 
                          formatDistanceToNow(parseISO(account.last_sync)) + ' ago' : 
                          'Never'
                        }
                      </Typography>
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
                    mb: index < filteredAndSortedAccounts.length - 1 ? 2 : 0, 
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
                      Account Details
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 2,
                      mb: 2
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Account ID
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontFamily: 'monospace',
                          mt: 0.5
                        }}>
                          {account.account_id}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Transaction Count
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {account.processed_transactions_count.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Last Sync
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {account.last_sync ? 
                            format(parseISO(account.last_sync), 'MMM d, yyyy HH:mm') : 
                            'Never synced'
                          }
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Last Updated
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {format(parseISO(account.last_updated), 'MMM d, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Sync Status Details */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1.5,
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
                    }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: syncStatus.color 
                      }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {syncStatus.text}
                      </Typography>
                      {account.last_sync && (
                        <>
                          <Typography variant="caption" sx={{ 
                            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                            mx: 1
                          }}>
                            •
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
                          }}>
                            {formatDistanceToNow(parseISO(account.last_sync))} ago
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </React.Fragment>
            );
          })}
        </IOSCard>
      ) : (
        <IOSCard>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Search sx={{ 
              fontSize: 48, 
              color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
              mb: 2
            }} />
            <Typography variant="body2" sx={{ 
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'
            }}>
              {searchTerm ? 'No accounts match your search.' : 'No account data available.'}
            </Typography>
          </Box>
        </IOSCard>
      )}
    </IOSSection>
  );
};

export default IOSAccountDetails;