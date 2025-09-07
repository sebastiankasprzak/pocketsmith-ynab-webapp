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
  Cached as CachedIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { BalanceComparisonTable } from '../components/BalanceComparisonTable';
import { IOSNavigationBar } from '../components/IOSNavigationBar';
import { NotificationPanel } from '../components/NotificationPanel';
import { IOSButton } from '../components/IOSButton';
import { IOSSearchBar } from '../components/IOSSearchBar';
import { IOSSegmentedControl } from '../components/IOSSegmentedControl';
import { IOSSection } from '../components/IOSSection';
import { IOSCard } from '../components/IOSCard';
import { IOSMetricCard } from '../components/IOSMetricCard';
import { IOSListItem, createEditAction, createDeleteAction } from '../components/IOSListItem';
import { IOSStatusBadge } from '../components/IOSStatusBadge';
import { IOSPullToRefresh } from '../components/IOSPullToRefresh';
import IOSLoadingStates from '../components/IOSLoadingStates';
import { IOSDiscrepancyAlert } from '../components/IOSDiscrepancyAlert';
import { IOSDiscrepancyBadge } from '../components/IOSDiscrepancyBadge';
import { IOSDetailDisclosure } from '../components/IOSDetailDisclosure';
import { useIOSDetection } from '../hooks/useIOSDetection';
import { useBalanceComparisons, useRefreshBalances } from '../hooks/useBalanceComparisonsQuery';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

type FilterType = 'all' | 'discrepancies' | 'matching';
type SortField = 'accountName' | 'pocketsmithBalance' | 'ynabBalance' | 'difference' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';
type DiscrepancyLevel = 'none' | 'minor' | 'moderate' | 'major' | 'critical';

export const BalanceComparison: React.FC = () => {
  const navigate = useNavigate();
  const { shouldUseIOSExperience } = useIOSDetection();
  const { impact } = useHapticFeedback();
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('accountName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  
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

  // Get discrepancy level based on amount
  const getDiscrepancyLevel = (amount: number): DiscrepancyLevel => {
    if (amount === 0) return 'none';
    
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) return 'critical';
    if (absAmount >= 100) return 'major';
    if (absAmount >= 10) return 'moderate';
    return 'minor';
  };

  // Get discrepancy type for alerts
  const getDiscrepancyType = (amount: number): 'minor' | 'moderate' | 'major' | 'critical' => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) return 'critical';
    if (absAmount >= 100) return 'major';
    if (absAmount >= 10) return 'moderate';
    return 'minor';
  };

  // Calculate cache progress (for visual indicator)
  const cacheProgress = cacheAgeMinutes > 0 && cacheAgeMinutes <= 5
    ? ((5 - cacheAgeMinutes) / 5) * 100 // 5 minute cache duration
    : 0;

  // Generate notifications based on balance data
  const notifications = React.useMemo(() => {
    const notifs = [];

    // Error loading balance data
    if (error) {
      notifs.push({
        id: 'balance-load-error',
        type: 'error' as const,
        title: 'Unable to load balance data',
        message: 'There was an error loading balance comparison data. Please check your connection and try again.',
        dismissible: true
      });
    }

    // Stale data warning
    if (isStale && cacheAgeMinutes > 10) {
      notifs.push({
        id: 'stale-data-warning',
        type: 'warning' as const,
        title: 'Data may be outdated',
        message: `Balance data is ${formatCacheAge(cacheAgeMinutes)} old. Consider refreshing for the latest information.`,
        dismissible: true
      });
    }

    // Balance discrepancies found
    if (balanceData?.comparisons && Array.isArray(balanceData.comparisons)) {
      const discrepancies = balanceData.comparisons.filter(c => c.hasDiscrepancy);
      if (discrepancies.length > 0) {
        const totalDiscrepancy = discrepancies.reduce((sum: number, item: any) => sum + Math.abs(item.difference), 0);
        notifs.push({
          id: 'balance-discrepancies',
          type: 'warning' as const,
          title: `Found ${discrepancies.length} balance discrepancies`,
          message: `Total discrepancy amount: $${totalDiscrepancy.toFixed(2)}. Review and resolve these differences to ensure data accuracy.`,
          dismissible: true
        });
      }
    }

    // All balances match
    if (balanceData?.comparisons && balanceData.comparisons.length === 0 && !loading && !error) {
      notifs.push({
        id: 'balances-match',
        type: 'success' as const,
        title: 'All balances match perfectly',
        message: 'No discrepancies found between PocketSmith and YNAB account balances.',
        dismissible: true
      });
    }

    // Filter out dismissed notifications
    return notifs.filter(n => !dismissedNotifications.includes(n.id));
  }, [
    error,
    isStale,
    cacheAgeMinutes,
    balanceData,
    loading,
    dismissedNotifications,
    formatCacheAge
  ]);

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  // Format currency values
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort comparisons
  const filteredAndSortedComparisons = React.useMemo(() => {
    if (!balanceData?.comparisons || !Array.isArray(balanceData.comparisons)) {
      return [];
    }

    const filtered = balanceData.comparisons.filter(comparison => {
      // Search filter
      const psAccountName = comparison.pocketsmithAccountName || '';
      const ynabAccountName = comparison.ynabAccountName || '';
      const searchMatch = searchTerm === '' ||
        psAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ynabAccountName.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const typeMatch = filterType === 'all' ||
        (filterType === 'discrepancies' && comparison.hasDiscrepancy) ||
        (filterType === 'matching' && !comparison.hasDiscrepancy);

      return searchMatch && typeMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'accountName':
          aValue = (a.pocketsmithAccountName || '').toLowerCase();
          bValue = (b.pocketsmithAccountName || '').toLowerCase();
          break;
        case 'pocketsmithBalance':
          aValue = a.pocketsmithBalance;
          bValue = b.pocketsmithBalance;
          break;
        case 'ynabBalance':
          aValue = a.ynabBalance;
          bValue = b.ynabBalance;
          break;
        case 'difference':
          aValue = Math.abs(a.difference);
          bValue = Math.abs(b.difference);
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [balanceData?.comparisons, searchTerm, filterType, sortField, sortDirection]);

  // Get discrepancy statistics
  const stats = React.useMemo(() => {
    if (!balanceData?.comparisons || !Array.isArray(balanceData.comparisons)) {
      return {
        totalAccounts: 0,
        discrepancies: 0,
        matching: 0,
        totalDiscrepancyAmount: 0
      };
    }

    const totalAccounts = balanceData.comparisons.length;
    const discrepancies = balanceData.comparisons.filter(c => c.hasDiscrepancy).length;
    const totalDiscrepancyAmount = balanceData.comparisons
      .filter(c => c.hasDiscrepancy)
      .reduce((sum, c) => sum + Math.abs(c.difference), 0);

    return {
      totalAccounts,
      discrepancies,
      matching: totalAccounts - discrepancies,
      totalDiscrepancyAmount
    };
  }, [balanceData?.comparisons]);

  // Handle pull to refresh
  const handlePullToRefresh = async () => {
    await refresh();
  };

  // Handle balance comparison detail view
  const handleViewDetails = (comparisonId: string) => {
    impact('light');
    setSelectedComparison(comparisonId);
    // Navigate to detailed view or show modal
    // For now, we'll just show an alert with details
    const comparison = filteredAndSortedComparisons.find(
      c => `${c.pocketsmithAccountId}-${c.ynabAccountId}` === comparisonId
    );
    if (comparison) {
      alert(`Balance Details:\n\nPocketSmith: ${formatCurrency(comparison.pocketsmithBalance, comparison.currency)}\nYNAB: ${formatCurrency(comparison.ynabBalance, comparison.currency)}\nDifference: ${formatCurrency(comparison.difference, comparison.currency)}\nLast Updated: ${formatRelativeTime(comparison.lastUpdated)}`);
    }
  };

  // Handle edit balance comparison
  const handleEditComparison = (comparisonId: string) => {
    impact('medium');
    const comparison = filteredAndSortedComparisons.find(
      c => `${c.pocketsmithAccountId}-${c.ynabAccountId}` === comparisonId
    );
    if (comparison) {
      // Navigate to account mappings page with this mapping selected
      navigate('/account-mappings', { 
        state: { 
          highlightMapping: {
            pocketsmithAccountId: comparison.pocketsmithAccountId,
            ynabAccountId: comparison.ynabAccountId
          }
        }
      });
    }
  };

  // Handle refresh specific comparison
  const handleRefreshComparison = (comparisonId: string) => {
    impact('light');
    // In a real implementation, this would refresh just this comparison
    // For now, we'll refresh all data
    refresh();
  };

  // Handle investigate discrepancy
  const handleInvestigateDiscrepancy = (comparisonId: string) => {
    impact('medium');
    const comparison = filteredAndSortedComparisons.find(
      c => `${c.pocketsmithAccountId}-${c.ynabAccountId}` === comparisonId
    );
    if (comparison && comparison.hasDiscrepancy) {
      // Show detailed discrepancy information
      alert(`Discrepancy Investigation:\n\nAccount: ${comparison.pocketsmithAccountName}\nDifference: ${formatCurrency(Math.abs(comparison.difference), comparison.currency)}\n\nPossible causes:\n• Pending transactions in PocketSmith\n• Uncleared transactions in YNAB\n• Different account types or currencies\n• Sync timing differences`);
    }
  };

  // Render iOS-style comparison list
  const renderIOSComparisonList = () => {
    if (loading && !balanceData) {
      return (
        <IOSSection title="Balance Comparisons">
          {/* Loading skeleton for comparison items */}
          {Array.from({ length: 3 }).map((_, index) => (
            <IOSListItem
              key={`skeleton-${index}`}
              leftIcon={<IOSLoadingStates.IOSSkeleton variant="circular" width={24} height={24} />}
              rightContent={
                <IOSLoadingStates.IOSSkeleton variant="rectangular" width={60} height={20} />
              }
              subtitle={<IOSLoadingStates.IOSSkeleton variant="text" width="80%" />}
            >
              <Box>
                <IOSLoadingStates.IOSSkeleton variant="text" width="60%" />
                <IOSLoadingStates.IOSSkeleton variant="text" width="40%" />
              </Box>
            </IOSListItem>
          ))}
        </IOSSection>
      );
    }

    if (filteredAndSortedComparisons.length === 0) {
      return (
        <IOSSection grouped={false}>
          <Box sx={{ mx: 2 }}>
            <IOSCard actions={null} onClick={() => {}}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No balance comparisons found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No account mappings are configured for balance comparison'
                  }
                </Typography>
                {!searchTerm && filterType === 'all' && (
                  <IOSButton
                    variant="filled"
                    onClick={() => navigate('/account-mappings')}
                  >
                    Configure Account Mappings
                  </IOSButton>
                )}
              </Box>
            </IOSCard>
          </Box>
        </IOSSection>
      );
    }

    return (
      <IOSSection title="Balance Comparisons" grouped={false}>
        <Box sx={{ mx: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {filteredAndSortedComparisons.map((comparison) => {
            const comparisonId = `${comparison.pocketsmithAccountId}-${comparison.ynabAccountId}`;
            
            // Create swipe actions based on comparison status
            const swipeActions = [
              createEditAction(() => handleEditComparison(comparisonId)),
              {
                icon: <RefreshIcon sx={{ fontSize: '20px' }} />,
                label: 'Refresh',
                color: '#FFFFFF',
                backgroundColor: '#34C759',
                onAction: () => handleRefreshComparison(comparisonId),
              },
              ...(comparison.hasDiscrepancy ? [{
                icon: <InfoIcon sx={{ fontSize: '20px' }} />,
                label: 'Investigate',
                color: '#FFFFFF',
                backgroundColor: '#FF9500',
                onAction: () => handleInvestigateDiscrepancy(comparisonId),
              }] : [])
            ];

            const discrepancyLevel = getDiscrepancyLevel(comparison.difference);
            
            return (
              <IOSDetailDisclosure
                key={comparisonId}
                comparison={comparison}
                onInvestigate={() => handleInvestigateDiscrepancy(comparisonId)}
                onEdit={() => handleEditComparison(comparisonId)}
              />
            );
          })}
        </Box>
      </IOSSection>
    );
  };

  if (shouldUseIOSExperience) {
    return (
      <IOSPullToRefresh onRefresh={handlePullToRefresh} enabled={!loading}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pb: 4
        }}>
          {/* iOS Navigation Bar */}
          <IOSNavigationBar
            title="Balance Comparison"
            large={true}
            rightAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationPanel
                  notifications={notifications}
                  onDismiss={handleDismissNotification}
                />
                <IOSButton
                  variant="plain"
                  size="small"
                  onClick={refresh}
                  disabled={loading || refreshing}
                  hapticFeedback={true}
                  pressAnimation={true}
                >
                  <RefreshIcon sx={{ fontSize: '20px' }} />
                </IOSButton>
              </Box>
            }
          />

          {/* Error state */}
          {error && (
            <IOSSection grouped={false}>
              <Box sx={{ mx: 2 }}>
                <IOSCard actions={null} onClick={() => {}}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                      {error}
                    </Typography>
                    <IOSButton variant="filled" onClick={() => refresh()}>
                      Try Again
                    </IOSButton>
                  </Box>
                </IOSCard>
              </Box>
            </IOSSection>
          )}

          {/* Loading state */}
          {loading && !balanceData && (
            <IOSSection grouped={false}>
              <Box sx={{ mx: 2 }}>
                <IOSCard actions={null} onClick={() => {}}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <IOSLoadingStates.IOSSpinner size="medium" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Loading balance comparisons...
                    </Typography>
                  </Box>
                </IOSCard>
              </Box>
            </IOSSection>
          )}

          {/* Refreshing overlay */}
          {refreshing && balanceData && (
            <IOSSection grouped={false}>
              <Box sx={{ mx: 2 }}>
                <IOSCard actions={null} onClick={() => {}}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <IOSLoadingStates.IOSSpinner size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      Refreshing data...
                    </Typography>
                  </Box>
                </IOSCard>
              </Box>
            </IOSSection>
          )}

          {/* Critical Discrepancy Alerts */}
          {balanceData?.comparisons && (
            <>
              {balanceData.comparisons
                .filter(c => c.hasDiscrepancy && getDiscrepancyLevel(c.difference) === 'critical')
                .map((comparison) => {
                  const comparisonId = `${comparison.pocketsmithAccountId}-${comparison.ynabAccountId}`;
                  return (
                    <IOSDiscrepancyAlert
                      key={`alert-${comparisonId}`}
                      amount={comparison.difference}
                      currency={comparison.currency}
                      type={getDiscrepancyType(comparison.difference)}
                      direction={comparison.difference > 0 ? 'positive' : 'negative'}
                      accountName={comparison.pocketsmithAccountName || 'Unknown Account'}
                      onInvestigate={() => handleInvestigateDiscrepancy(comparisonId)}
                      onDismiss={() => {
                        // Add to dismissed alerts (you could implement this state)
                      }}
                    />
                  );
                })}
            </>
          )}

          {/* Summary Cards */}
          {balanceData && (
            <IOSSection title="Overview" grouped={false}>
              <IOSLoadingStates.IOSLoadingOverlay loading={refreshing} message="Updating overview...">
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mx: 2 }}>
                  <IOSMetricCard
                    value={stats.totalAccounts}
                    label="Total Accounts"
                    icon={<AccountBalanceIcon />}
                    color="info"
                  />
                  <IOSMetricCard
                    value={stats.matching}
                    label="Matching"
                    icon={<CheckCircleIcon />}
                    color="success"
                  />
                  <IOSMetricCard
                    value={stats.discrepancies}
                    label="Discrepancies"
                    icon={<WarningIcon />}
                    color="warning"
                  />
                  {stats.discrepancies > 0 && (
                    <IOSMetricCard
                      value={formatCurrency(stats.totalDiscrepancyAmount)}
                      label="Total Difference"
                      color="error"
                    />
                  )}
                </Box>
              </IOSLoadingStates.IOSLoadingOverlay>
            </IOSSection>
          )}

          {/* Search and Filter Controls */}
          {balanceData && balanceData.comparisons && balanceData.comparisons.length > 0 && (
            <IOSSection title="Filter & Search" grouped={false}>
              <Box sx={{ mx: 2, opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <IOSSearchBar
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  disabled={refreshing}
                />
                <Box sx={{ mt: 2 }}>
                  <IOSSegmentedControl
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'Discrepancies', value: 'discrepancies' },
                      { label: 'Matching', value: 'matching' }
                    ]}
                    value={filterType}
                    onChange={(value) => setFilterType(value as FilterType)}
                    fullWidth
                    disabled={refreshing}
                  />
                </Box>
              </Box>
            </IOSSection>
          )}

          {/* Balance Comparison List */}
          {balanceData && renderIOSComparisonList()}

          {/* No data state */}
          {!loading && !balanceData && !error && (
            <IOSSection grouped={false}>
              <Box sx={{ mx: 2 }}>
                <IOSCard actions={null} onClick={() => {}}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No balance data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Unable to load balance comparisons. This might be due to API connectivity issues.
                    </Typography>
                    <IOSButton variant="filled" onClick={() => refresh()}>
                      Try Again
                    </IOSButton>
                  </Box>
                </IOSCard>
              </Box>
            </IOSSection>
          )}
        </Box>
      </IOSPullToRefresh>
    );
  }

  // Standard non-iOS layout
  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Standard Header for non-iOS */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Balance Comparison
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Compare PocketSmith posted balances with YNAB cleared balances to identify discrepancies.
        </Typography>
      </Box>

      {/* Status and Actions for non-iOS */}
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
      </Stack>

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