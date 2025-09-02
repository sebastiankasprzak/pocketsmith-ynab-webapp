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
import { useBalanceComparisons, useRefreshBalances } from '../hooks/useBalanceComparisonsQuery';

export const BalanceComparison: React.FC = () => {
  const navigate = useNavigate();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  const {
    data: balanceData,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    refresh,
    forceRefresh,
    isStale,
    cacheAgeMinutes,
    lastUpdated: lastFetchTime
  } = useBalanceComparisons({
    staleTime: autoRefreshEnabled ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 or 5 minutes
    refetchInterval: autoRefreshEnabled ? 5 * 60 * 1000 : false // 5 minutes or disabled
  });

  // Format cache age
  const formatCacheAge = (ageMinutes: number) => {
    if (ageMinutes === 0) return 'Fresh';
    if (ageMinutes < 60) return `${ageMinutes}m old`;
    const hours = Math.floor(ageMinutes / 60);
    return `${hours}h old`;
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
  const cacheProgress = cacheAgeMinutes > 0 && cacheAgeMinutes <= 5
    ? ((5 - cacheAgeMinutes) / 5) * 100 // 5 minute cache duration
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
          Compare PocketSmith posted balances with YNAB cleared balances to identify discrepancies.
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
              <Tooltip title={`Data is ${formatCacheAge(cacheAgeMinutes)} - ${isStale ? 'Stale' : 'Fresh'}`}>
                <Chip
                  icon={<InfoIcon />}
                  label={`Cache: ${formatCacheAge(cacheAgeMinutes)}`}
                  color={isStale ? 'warning' : 'success'}
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
        {balanceData && cacheProgress > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={cacheProgress} 
              sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isStale ? 'warning.main' : 'primary.main'
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
      {balanceData && isStale && cacheAgeMinutes > 5 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Balance data is stale (last updated {cacheAgeMinutes} minutes ago). Click "Refresh" to get the latest information from both PocketSmith and YNAB.
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