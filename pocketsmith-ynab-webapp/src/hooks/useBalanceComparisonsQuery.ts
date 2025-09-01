import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../services/accountsApi';
import { queryKeys } from './queryKeys';
import type { BalanceComparisonResponse } from '../types/accounts';

interface UseBalanceComparisonsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
}

/**
 * React Query hook for balance comparisons with intelligent caching
 */
export const useBalanceComparisonsQuery = (options: UseBalanceComparisonsOptions = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    refetchInterval = false, // No auto-refresh by default
  } = options;

  return useQuery({
    queryKey: queryKeys.balanceComparisons(),
    queryFn: accountsApi.fetchBalanceComparisons,
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
    // Keep data in cache longer for balance comparisons since they're expensive to compute
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Mutation hook for refreshing balance data
 */
export const useRefreshBalances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.refreshBalances,
    onSuccess: (data) => {
      // Update the cache with fresh data
      queryClient.setQueryData(queryKeys.balanceComparisons(), data);
      
      // Mark the query as fresh by invalidating and immediately setting new data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.balanceComparisons(),
        refetchType: 'none' // Don't refetch since we just set fresh data
      });
    },
    onError: () => {
      // On error, invalidate to trigger a refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.balanceComparisons() 
      });
    },
  });
};

/**
 * Hook that provides both query and refresh functionality with smart caching
 */
export const useBalanceComparisons = (options: UseBalanceComparisonsOptions = {}) => {
  const query = useBalanceComparisonsQuery(options);
  const refreshMutation = useRefreshBalances();

  // Calculate cache status
  const dataUpdatedAt = query.dataUpdatedAt;
  const isStale = query.isStale;
  const cacheAge = dataUpdatedAt ? Date.now() - dataUpdatedAt : 0;
  const cacheAgeMinutes = Math.floor(cacheAge / (1000 * 60));

  return {
    // Data and loading states
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefreshing: refreshMutation.isPending,
    error: query.error?.message || refreshMutation.error?.message || null,
    
    // Cache information
    isStale,
    cacheAge,
    cacheAgeMinutes,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    
    // Actions
    refresh: query.refetch,
    forceRefresh: refreshMutation.mutate,
    
    // Legacy compatibility
    loading: query.isLoading,
    refreshing: refreshMutation.isPending,
  };
};

/**
 * Hook for background balance monitoring with auto-refresh
 */
export const useBalanceMonitoring = (intervalMinutes: number = 5) => {
  return useBalanceComparisonsQuery({
    refetchInterval: intervalMinutes * 60 * 1000,
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes for monitoring
  });
};