import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccounts, useMappings } from './useAccountMappings';
import { useBalanceComparisons } from './useBalanceComparisonsQuery';
import { queryKeys, cacheInvalidation } from './queryKeys';
import { syncApiService } from '../services/syncApi';
import type { 
  AccountsResponse, 
  MappingsResponse, 
  BalanceComparisonResponse,
  BalanceComparison 
} from '../types/accounts';
import type { SyncStateOverview, RecentActivityResponse } from '../services/syncApi';

// Types for dashboard data
export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  progress?: number;
  message?: string;
}

export interface AccountMappingStats {
  total: number;
  mapped: number;
  unmapped: number;
  percentage: number;
}

export interface BalanceDiscrepancy {
  accountName: string;
  pocketsmithBalance: number;
  ynabBalance: number;
  difference: number;
  currency: string;
}

export interface RecentActivity {
  id: string;
  type: 'sync' | 'mapping' | 'balance_check';
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

export interface DashboardMetrics {
  totalAccounts: number;
  successRate: number;
  avgSyncTime: number;
  dataFreshness: number; // minutes since last update
}

// Helper functions to transform real API data
const transformSyncStateToStatus = (syncState: SyncStateOverview | undefined): SyncStatus => {
  if (!syncState) {
    return {
      status: 'idle',
      lastSync: null,
      message: 'No sync data available'
    };
  }

  // For the sync state overview, we don't have individual status per account
  // We'll determine status based on recent activity
  let status: SyncStatus['status'] = 'idle';
  let message = 'Ready to sync';

  if (syncState.total_processed_transactions > 0) {
    status = 'success';
    message = `Processed ${syncState.total_processed_transactions} transactions across ${syncState.total_accounts} accounts`;
  }

  // Get the most recent sync time from last_activity
  const lastSync = syncState.last_activity ? new Date(syncState.last_activity) : null;

  return {
    status,
    lastSync,
    message
  };
};

const transformMappingsToStats = (
  accounts: AccountsResponse | undefined, 
  mappings: MappingsResponse | undefined
): AccountMappingStats => {
  if (!accounts || !mappings) {
    return {
      total: 0,
      mapped: 0,
      unmapped: 0,
      percentage: 0
    };
  }

  const totalPocketSmithAccounts = accounts.pocketsmithAccounts.length;
  const mappedCount = mappings.mappings.length;
  const unmappedCount = totalPocketSmithAccounts - mappedCount;
  const percentage = totalPocketSmithAccounts > 0 
    ? Math.round((mappedCount / totalPocketSmithAccounts) * 100) 
    : 0;

  return {
    total: totalPocketSmithAccounts,
    mapped: mappedCount,
    unmapped: unmappedCount,
    percentage
  };
};

const transformBalanceComparisons = (
  balanceData: BalanceComparisonResponse | undefined
): BalanceDiscrepancy[] => {
  if (!balanceData?.comparisons) {
    return [];
  }

  return balanceData.comparisons
    .filter(comp => comp.hasDiscrepancy)
    .map(comp => ({
      accountName: comp.pocketsmithAccountName,
      pocketsmithBalance: comp.pocketsmithBalance,
      ynabBalance: comp.ynabBalance,
      difference: comp.difference,
      currency: comp.currency
    }));
};

const transformRecentActivity = (
  recentActivity: RecentActivityResponse | undefined
): RecentActivity[] => {
  if (!recentActivity?.recent_activity) {
    return [];
  }

  return recentActivity.recent_activity.map((activity, index) => ({
    id: `activity-${activity.account_id}-${index}`,
    type: 'sync' as const, // All activities from this API are sync-related
    status: activity.count > 0 ? 'success' : 'warning' as const,
    message: activity.count > 0 
      ? `Processed ${activity.count} transactions for ${activity.account_name || activity.account_id}`
      : `No recent transactions for ${activity.account_name || activity.account_id}`,
    timestamp: activity.recent_transactions.length > 0 
      ? new Date(activity.recent_transactions[0].processed_at)
      : new Date(recentActivity.lastUpdated)
  }));
};

const calculateMetrics = (
  accounts: AccountsResponse | undefined,
  syncState: SyncStateOverview | undefined,
  balanceData: BalanceComparisonResponse | undefined
): DashboardMetrics => {
  const totalAccounts = accounts?.pocketsmithAccounts.length || 0;
  
  // Calculate success rate from sync state
  let successRate = 0;
  if (syncState && syncState.accounts.length > 0) {
    const successfulSyncs = syncState.accounts.filter(acc => acc.last_sync_status === 'success').length;
    successRate = Math.round((successfulSyncs / syncState.accounts.length) * 100);
  }

  // Calculate average sync time (mock for now, could be derived from sync state)
  const avgSyncTime = 45; // Default value

  // Calculate data freshness from balance data
  let dataFreshness = 0;
  if (balanceData?.summary?.lastUpdated) {
    const lastUpdated = new Date(balanceData.summary.lastUpdated);
    dataFreshness = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60));
  }

  return {
    totalAccounts,
    successRate,
    avgSyncTime,
    dataFreshness
  };
};

// Custom hooks
export const useDashboardData = () => {
  const queryClient = useQueryClient();

  // Use real API hooks
  const accounts = useAccounts();
  const mappings = useMappings();
  const balanceComparisons = useBalanceComparisons({
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false // No auto-refresh, manual only
  });

  // Fetch sync state and recent activity with better caching
  const syncStateQuery = useQuery({
    queryKey: queryKeys.syncOverview(),
    queryFn: () => syncApiService.getSyncStateOverview(),
    staleTime: 30 * 1000, // 30 seconds - sync state changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchInterval: 60 * 1000, // Check every minute instead of 30 seconds
    retry: 1
  });

  const recentActivityQuery = useQuery({
    queryKey: queryKeys.recentActivity(24),
    queryFn: () => syncApiService.getRecentActivity(24), // Last 24 hours
    staleTime: 2 * 60 * 1000, // 2 minutes - activity doesn't change as frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    retry: 1
  });

  // Transform data for dashboard
  const syncStatus = {
    data: transformSyncStateToStatus(syncStateQuery.data),
    isLoading: syncStateQuery.isLoading,
    error: syncStateQuery.error
  };

  const mappingStats = {
    data: transformMappingsToStats(accounts.data, mappings.data),
    isLoading: accounts.isLoading || mappings.isLoading,
    error: accounts.error || mappings.error
  };

  const balanceDiscrepancies = {
    data: transformBalanceComparisons(balanceComparisons.data),
    isLoading: balanceComparisons.isLoading,
    error: balanceComparisons.error ? new Error(balanceComparisons.error) : null
  };

  const recentActivity = {
    data: transformRecentActivity(recentActivityQuery.data),
    isLoading: recentActivityQuery.isLoading,
    error: recentActivityQuery.error
  };

  const metrics = {
    data: calculateMetrics(accounts.data, syncStateQuery.data, balanceComparisons.data),
    isLoading: accounts.isLoading || syncStateQuery.isLoading || balanceComparisons.isLoading,
    error: accounts.error || syncStateQuery.error || (balanceComparisons.error ? new Error(balanceComparisons.error) : null)
  };

  // Manual sync mutation using the real sync API
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Trigger a manual sync for all accounts
      const response = await syncApiService.triggerSync({
        forceSync: false
      });
      return response;
    },
    onSuccess: () => {
      // Smart invalidation after sync operation
      cacheInvalidation.afterSync(queryClient);
    }
  });

  const refreshAllData = () => {
    // Invalidate all major data categories
    cacheInvalidation.accounts(queryClient);
    cacheInvalidation.mappings(queryClient);
    cacheInvalidation.balances(queryClient);
    cacheInvalidation.sync(queryClient);
  };

  return {
    syncStatus,
    mappingStats,
    balanceDiscrepancies,
    recentActivity,
    metrics,
    syncMutation,
    refreshAllData
  };
};