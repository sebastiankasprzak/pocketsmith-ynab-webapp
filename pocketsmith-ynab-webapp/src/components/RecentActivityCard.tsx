import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Timeline,
  ExpandMore,
  ExpandLess,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';
import type { RecentTransactionActivity } from '../services/syncApi';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface RecentActivityCardProps {
  recentActivity: RecentTransactionActivity[];
  hours: number;
  onHoursChange: (hours: number) => void;
  loading?: boolean;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  recentActivity,
  hours,
  onHoursChange,
  loading = false,
}) => {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const handleHoursChange = (event: SelectChangeEvent<number>) => {
    onHoursChange(event.target.value as number);
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

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Timeline color="primary" />
            <Typography variant="h6">
              Recent Transaction Activity
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={hours}
              onChange={handleHoursChange}
              disabled={loading}
            >
              <MenuItem value={1}>Last Hour</MenuItem>
              <MenuItem value={6}>Last 6 Hours</MenuItem>
              <MenuItem value={24}>Last 24 Hours</MenuItem>
              <MenuItem value={72}>Last 3 Days</MenuItem>
              <MenuItem value={168}>Last Week</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Summary Stats */}
        <Box display="flex" gap={3} mb={3}>
          <Box textAlign="center">
            <Typography variant="h5" color="primary">
              {totalRecentTransactions}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Transactions
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" color="success.main">
              {recentActivity.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active Accounts
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" color="info.main">
              {totalRecentTransactions > 0 ? Math.round(totalRecentTransactions / Math.max(recentActivity.length, 1)) : 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg per Account
            </Typography>
          </Box>
        </Box>

        {sortedActivity.length > 0 ? (
          <List dense>
            {sortedActivity.map((account) => {
              const isExpanded = expandedAccounts.has(account.account_id);
              const mostRecentTransaction = account.recent_transactions[0];

              return (
                <React.Fragment key={account.account_id}>
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            {account.account_name || `Account ${account.account_id}`}
                          </Typography>
                          <Badge badgeContent={account.count} color="primary">
                            <TrendingUp fontSize="small" />
                          </Badge>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Most recent: {mostRecentTransaction ? 
                              formatDistanceToNow(parseISO(mostRecentTransaction.processed_at)) + ' ago' : 
                              'No recent activity'
                            }
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${account.count} transactions`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Tooltip title={isExpanded ? 'Hide details' : 'Show details'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleAccountExpansion(account.account_id)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ ml: 2, mr: 2, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recent Transactions (showing last 10)
                      </Typography>
                      <List dense>
                        {account.recent_transactions.slice(0, 10).map((transaction, index) => (
                          <ListItem key={transaction.transaction_id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontFamily="monospace">
                                  {transaction.transaction_id}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  Processed {formatDistanceToNow(parseISO(transaction.processed_at))} ago
                                  {' • '}
                                  {format(parseISO(transaction.processed_at), 'MMM d, HH:mm')}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      {account.recent_transactions.length > 10 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          ... and {account.recent_transactions.length - 10} more transactions
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No transaction activity in the last {hours} hour{hours !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}

        {recentActivity.length > 10 && (
          <Box mt={2} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Showing top 10 most active accounts. {recentActivity.length - 10} more accounts had activity.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;