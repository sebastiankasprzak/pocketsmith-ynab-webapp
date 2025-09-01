import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncApiService } from '../services/syncApi';
import { queryKeys, cacheInvalidation } from './queryKeys';
import type { 
  SyncStateOverview, 
  RecentActivityResponse, 
  SyncTriggerResponse 
} from '../services/syncApi';

interface UseSyncStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  activityHours?: number;
}

/**
 * React Query hook for sync state overview with intelligent caching
 */
export const useSyncStateOverview = (options: UseSyncStatusOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60 * 1000, // 1 minute default
  } = options;

  return useQuery({
    queryKey: queryKeys.syncOverview(),
    queryFn: () => syncApiService.getSyncStateOverview(),
    staleTime: 30 * 1000, // 30 seconds - sync state changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * React Query hook for recent activity with configurable time range
 */
export const useRecentActivity = (options: UseSyncStatusOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 2 * 60 * 1000, // 2 minutes default
    activityHours = 24,
  } = options;

  return useQuery({
    queryKey: queryKeys.recentActivity(activityHours),
    queryFn: () => syncApiService.getRecentActivity(activityHours),
    staleTime: 60 * 1000, // 1 minute - activity doesn't change as frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * Mutation hook for triggering manual sync
 */
export const useTriggerSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { 
      forceSync?: boolean; 
      accountIds?: string[]; 
      dateRange?: { startDate: string; endDate: string } 
    } = {}) => {
      // Convert options to SyncTriggerRequest format
      const request: any = {
        forceSync: options.forceSync || false,
      };

      if (options.dateRange) {
        request.dateRange = options.dateRange;
      }

      if (options.accountIds && options.accountIds.length > 0) {
        request.accountFilters = options.accountIds;
      }

      return syncApiService.triggerSync(request);
    },
    onSuccess: () => {
      // Smart invalidation after sync operation
      cacheInvalidation.afterSync(queryClient);
    },
    onError: (error) => {
      console.error('Sync trigger failed:', error);
    },
  });
};

/**
 * Combined hook that provides all sync status data with smart caching
 */
export const useSyncStatus = (options: UseSyncStatusOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60 * 1000, // 1 minute
    activityHours = 24,
  } = options;

  const queryClient = useQueryClient();

  // Fetch sync state and recent activity
  const syncStateQuery = useSyncStateOverview({
    autoRefresh,
    refreshInterval,
  });

  const recentActivityQuery = useRecentActivity({
    autoRefresh,
    refreshInterval: refreshInterval * 2, // Less frequent for activity
    activityHours,
  });

  const triggerSyncMutation = useTriggerSync();

  // Manual refresh function
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.syncOverview() });
    queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity(activityHours) });
  };

  // Calculate overall loading state
  const isLoading = syncStateQuery.isLoading || recentActivityQuery.isLoading;
  const isRefreshing = syncStateQuery.isFetching || recentActivityQuery.isFetching;
  const hasError = syncStateQuery.error || recentActivityQuery.error;

  // Get the most recent update time
  const lastUpdated = Math.max(
    syncStateQuery.dataUpdatedAt || 0,
    recentActivityQuery.dataUpdatedAt || 0
  );

  return {
    // Data
    syncStateOverview: syncStateQuery.data,
    recentActivity: recentActivityQuery.data,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Error states
    syncStateError: syncStateQuery.error?.message,
    recentActivityError: recentActivityQuery.error?.message,
    hasError: !!hasError,
    
    // Cache information
    lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    syncStateStale: syncStateQuery.isStale,
    activityStale: recentActivityQuery.isStale,
    
    // Actions
    refreshAllData,
    triggerSync: triggerSyncMutation.mutate,
    triggerSyncAsync: triggerSyncMutation.mutateAsync,
    
    // Mutation states
    isSyncTriggering: triggerSyncMutation.isPending,
    syncTriggerError: triggerSyncMutation.error?.message,
  };
};

/**
 * Hook for background sync monitoring with more frequent updates
 */
export const useSyncMonitoring = () => {
  return useSyncStatus({
    autoRefresh: true,
    refreshInterval: 30 * 1000, // 30 seconds for active monitoring
    activityHours: 24,
  });
};

/**
 * Hook for manual sync status checking (no auto-refresh)
 */
export const useSyncStatusManual = (activityHours: number = 24) => {
  return useSyncStatus({
    autoRefresh: false,
    activityHours,
  });
};