import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Autorenew as AutorenewIcon,
  Cached as CachedIcon
} from '@mui/icons-material';
import { BalanceComparisonTable } from '../components/BalanceComparisonTable';
import { useBalanceComparisons } from '../hooks/useBalanceComparisons';

export const BalanceComparison: React.FC = () => {
  const navigate = useNavigate();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  const {
    data: balanceData,
    loading,
    refreshing,
    error,
    refresh,
    forceRefresh,
    isCacheExpired,
    timeUntilExpiry,
    lastFetchTime
  } = useBalanceComparisons({
    enableAutoRefresh: autoRefreshEnabled,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
    cacheTimeout: 2 * 60 * 1000 // 2 minutes local cache
  });

  // Format cache expiry time
  const formatCacheExpiry = (timeMs: number) => {
    if (timeMs <= 0) return 'Expired';
    
    const minutes = Math.floor(timeMs / (1000 * 60));
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Format last updated time
  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format last fetch time
  const formatLastFetch = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  // Calculate cache progress (for visual indicator)
  const cacheProgress = balanceData && timeUntilExpiry > 0
    ? ((timeUntilExpiry / (5 * 60 * 1000)) * 100) // Assuming 5min cache duration
    : 0;

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Balance Comparison
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Compare account balances between PocketSmith and YNAB to identify discrepancies.
        </Typography>

        {/* Status and Actions */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }} 
          sx={{ flexWrap: 'wrap' }}
        >
          {balanceData && (
            <>
              <Chip
                icon={<ScheduleIcon />}
                label={`Updated: ${formatLastUpdated(balanceData.summary?.lastUpdated || balanceData.lastUpdated || '')}`}
                variant="outlined"
                size="small"
              />
              <Tooltip title={`Cache expires in ${formatCacheExpiry(timeUntilExpiry)}`}>
                <Chip
                  icon={<InfoIcon />}
                  label={`Cache: ${formatCacheExpiry(timeUntilExpiry)}`}
                  color={isCacheExpired ? 'warning' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={`Last fetched: ${formatLastFetch(lastFetchTime)}`}>
                <Chip
                  icon={<CachedIcon />}
                  label={`Fetched: ${formatLastFetch(lastFetchTime)}`}
                  variant="outlined"
                  size="small"
                />
              </Tooltip>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => refresh()}
            disabled={refreshing || loading}
            size="small"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={refreshing ? <CircularProgress size={16} /> : <AutorenewIcon />}
            onClick={() => forceRefresh()}
            disabled={refreshing || loading}
            size="small"
          >
            Force Refresh
          </Button>
          
          <Tooltip title={autoRefreshEnabled ? 'Auto-refresh is enabled' : 'Auto-refresh is disabled'}>
            <Button
              variant="text"
              startIcon={<AutorenewIcon />}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              color={autoRefreshEnabled ? 'primary' : 'inherit'}
              size="small"
            >
              Auto: {autoRefreshEnabled ? 'ON' : 'OFF'}
            </Button>
          </Tooltip>
        </Stack>
        
        {/* Cache progress indicator */}
        {balanceData && timeUntilExpiry > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={cacheProgress} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isCacheExpired ? 'warning.main' : 'primary.main'
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Cache freshness: {Math.round(cacheProgress)}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* Cache expiry warning */}
      {balanceData && isCacheExpired && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Balance data has expired. Click "Refresh Balances" to get the latest information from both PocketSmith and YNAB.
          </Typography>
        </Alert>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
          <Button 
            size="small" 
            onClick={() => refresh()} 
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Loading state */}
      {loading && !balanceData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Balance comparison table */}
      {balanceData && balanceData.comparisons && balanceData.comparisons.length > 0 && (
        <BalanceComparisonTable 
          comparisons={balanceData.comparisons}
          loading={refreshing}
        />
      )}

      {/* No comparisons available */}
      {balanceData && (!balanceData.comparisons || balanceData.comparisons.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No balance comparisons found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No account mappings are configured for balance comparison. Please set up account mappings first.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/account-mappings')}>
            Configure Account Mappings
          </Button>
        </Box>
      )}

      {/* No data state */}
      {!loading && !balanceData && !error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No balance data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Unable to load balance comparisons. This might be due to API connectivity issues.
          </Typography>
          <Button variant="outlined" onClick={() => refresh()}>
            Try Again
          </Button>
        </Box>
      )}
    </Box>
  );
};