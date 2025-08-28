import { useState, useEffect, useCallback, useRef } from 'react';
import { accountsApi } from '../services/accountsApi';
import { ErrorHandler } from '../utils/errorHandling';
import { errorLoggingService } from '../services/errorLoggingService';
import type { BalanceComparisonResponse } from '../types/accounts';

interface UseBalanceComparisonsOptions {
  autoRefreshInterval?: number; // in milliseconds
  cacheTimeout?: number; // in milliseconds
  enableAutoRefresh?: boolean;
}

interface UseBalanceComparisonsReturn {
  data: BalanceComparisonResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  isCacheExpired: boolean;
  timeUntilExpiry: number; // in milliseconds
  lastFetchTime: Date | null;
}

const DEFAULT_OPTIONS: Required<UseBalanceComparisonsOptions> = {
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  cacheTimeout: 10 * 60 * 1000, // 10 minutes
  enableAutoRefresh: true
};

export const useBalanceComparisons = (
  options: UseBalanceComparisonsOptions = {}
): UseBalanceComparisonsReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [data, setData] = useState<BalanceComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate cache expiry status
  const isCacheExpired = data ? new Date(data.cacheExpiry) <= new Date() : true;
  const timeUntilExpiry = data 
    ? Math.max(0, new Date(data.cacheExpiry).getTime() - new Date().getTime())
    : 0;

  // Check if local cache is stale based on our timeout
  const isLocalCacheStale = lastFetchTime 
    ? (new Date().getTime() - lastFetchTime.getTime()) > opts.cacheTimeout
    : true;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Fetch balance data with intelligent caching
  const fetchBalanceData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setError(null);
      
      // Determine if we should use cached data or fetch fresh
      const shouldFetchFresh = forceRefresh || 
        !data || 
        isCacheExpired || 
        isLocalCacheStale;

      if (shouldFetchFresh) {
        if (data) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Use refresh endpoint if we're forcing refresh or cache is expired
        const response = forceRefresh || isCacheExpired
          ? await accountsApi.refreshBalances()
          : await accountsApi.fetchBalanceComparisons();

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setData(response);
        setLastFetchTime(new Date());
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Log error with context
      errorLoggingService.logError(
        err instanceof Error ? err : new Error(String(err)),
        undefined,
        {
          component: 'useBalanceComparisons',
          action: forceRefresh ? 'forceRefresh' : 'refresh',
          cacheExpired: isCacheExpired,
          localCacheStale: isLocalCacheStale
        }
      );

      // Parse error for user-friendly message
      const errorDetails = ErrorHandler.parseError(err);
      setError(errorDetails.userMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data, isCacheExpired, isLocalCacheStale]);

  // Setup auto-refresh timer
  const setupAutoRefresh = useCallback(() => {
    if (!opts.enableAutoRefresh) return;

    cleanup();

    // Calculate next refresh time based on cache expiry
    let nextRefreshDelay = opts.autoRefreshInterval;
    
    if (data && !isCacheExpired) {
      // If we have data and it's not expired, wait until it expires plus a small buffer
      const timeUntilCacheExpiry = new Date(data.cacheExpiry).getTime() - new Date().getTime();
      if (timeUntilCacheExpiry > 0) {
        nextRefreshDelay = Math.min(timeUntilCacheExpiry + 30000, opts.autoRefreshInterval); // 30s buffer
      }
    }

    autoRefreshTimerRef.current = setTimeout(() => {
      fetchBalanceData(false);
    }, nextRefreshDelay);
  }, [data, isCacheExpired, opts.enableAutoRefresh, opts.autoRefreshInterval, fetchBalanceData, cleanup]);

  // Public refresh function (uses cache if available)
  const refresh = useCallback(async () => {
    await fetchBalanceData(false);
  }, [fetchBalanceData]);

  // Public force refresh function (always fetches fresh data)
  const forceRefresh = useCallback(async () => {
    await fetchBalanceData(true);
  }, [fetchBalanceData]);

  // Initial load
  useEffect(() => {
    fetchBalanceData(false);
  }, []);

  // Setup auto-refresh when data changes
  useEffect(() => {
    setupAutoRefresh();
    return cleanup;
  }, [setupAutoRefresh, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    forceRefresh,
    isCacheExpired,
    timeUntilExpiry,
    lastFetchTime
  };
};