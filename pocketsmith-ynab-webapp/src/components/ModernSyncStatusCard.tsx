import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Sync,
  CheckCircle,
  Schedule,
  TrendingUp,
  Info,
  Refresh,
} from '@mui/icons-material';
import type { SyncStateOverview } from '../services/syncApi';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ModernSyncStatusCardProps {
  syncStateOverview: SyncStateOverview;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ModernSyncStatusCard: React.FC<ModernSyncStatusCardProps> = ({
  syncStateOverview,
  onRefresh,
  loading = false,
}) => {
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

  const getActivityStatus = () => {
    if (!syncStateOverview.last_activity) {
      return { color: 'default' as const, text: 'Idle' };
    }

    const lastActivity = parseISO(syncStateOverview.last_activity);
    const hoursAgo = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      return { color: 'success' as const, text: 'Active' };
    } else if (hoursAgo < 24) {
      return { color: 'warning' as const, text: 'Recent' };
    } else {
      return { color: 'error' as const, text: 'Stale' };
    }
  };

  const activityStatus = getActivityStatus();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Sync State Overview
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<Sync />}
              label={activityStatus.text}
              color={activityStatus.color}
              size="small"
            />
            {onRefresh && (
              <Tooltip title="Refresh sync state">
                <IconButton onClick={onRefresh} disabled={loading} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {/* Total Accounts */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" gutterBottom>
                {syncStateOverview.total_accounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Accounts
              </Typography>
            </Box>
          </Grid>

          {/* Total Processed Transactions */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" gutterBottom>
                {syncStateOverview.total_processed_transactions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processed Transactions
              </Typography>
            </Box>
          </Grid>

          {/* Last Activity */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Schedule color="action" />
                <Typography variant="h6">
                  {getLastActivityText()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Last Activity
              </Typography>
            </Box>
          </Grid>

          {/* Active Accounts */}
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <CheckCircle color="success" />
                <Typography variant="h6">
                  {syncStateOverview.accounts.filter(acc => acc.last_sync).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Synced Accounts
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Account Details Summary */}
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom>
            Account Summary
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {syncStateOverview.accounts.slice(0, 8).map((account) => (
              <Tooltip
                key={account.account_id}
                title={`Account ${account.account_id}: ${account.processed_transactions_count} transactions, last sync: ${
                  account.last_sync ? formatDistanceToNow(parseISO(account.last_sync)) + ' ago' : 'Never'
                }`}
              >
                <Chip
                  size="small"
                  label={`${account.account_id} (${account.processed_transactions_count})`}
                  color={account.last_sync ? 'primary' : 'default'}
                  variant={account.last_sync ? 'filled' : 'outlined'}
                />
              </Tooltip>
            ))}
            {syncStateOverview.accounts.length > 8 && (
              <Chip
                size="small"
                label={`+${syncStateOverview.accounts.length - 8} more`}
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Performance Indicator */}
        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <TrendingUp color="success" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            Average: {Math.round(syncStateOverview.total_processed_transactions / Math.max(syncStateOverview.total_accounts, 1))} transactions per account
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ModernSyncStatusCard;