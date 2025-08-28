import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboardData } from '../useDashboardData';

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboardData', () => {
  it('should fetch all dashboard data successfully', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    // Initially should be loading
    expect(result.current.syncStatus.isLoading).toBe(true);
    expect(result.current.mappingStats.isLoading).toBe(true);
    expect(result.current.balanceDiscrepancies.isLoading).toBe(true);
    expect(result.current.recentActivity.isLoading).toBe(true);
    expect(result.current.metrics.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.syncStatus.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.mappingStats.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.balanceDiscrepancies.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.recentActivity.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.metrics.isLoading).toBe(false);
    });

    // Check that data is loaded
    expect(result.current.syncStatus.data).toBeDefined();
    expect(result.current.mappingStats.data).toBeDefined();
    expect(result.current.balanceDiscrepancies.data).toBeDefined();
    expect(result.current.recentActivity.data).toBeDefined();
    expect(result.current.metrics.data).toBeDefined();
  });

  it('should provide sync mutation functionality', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    expect(result.current.syncMutation).toBeDefined();
    expect(typeof result.current.syncMutation.mutate).toBe('function');
    expect(result.current.syncMutation.isPending).toBe(false);
  });

  it('should provide refresh functionality', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    expect(result.current.refreshAllData).toBeDefined();
    expect(typeof result.current.refreshAllData).toBe('function');
  });

  it('should return correct data structure for sync status', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.syncStatus.isLoading).toBe(false);
    });

    const syncStatus = result.current.syncStatus.data;
    expect(syncStatus).toHaveProperty('status');
    expect(syncStatus).toHaveProperty('lastSync');
    expect(syncStatus).toHaveProperty('message');
    expect(['idle', 'syncing', 'success', 'error']).toContain(syncStatus?.status);
  });

  it('should return correct data structure for mapping stats', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.mappingStats.isLoading).toBe(false);
    });

    const mappingStats = result.current.mappingStats.data;
    expect(mappingStats).toHaveProperty('total');
    expect(mappingStats).toHaveProperty('mapped');
    expect(mappingStats).toHaveProperty('unmapped');
    expect(mappingStats).toHaveProperty('percentage');
    expect(typeof mappingStats?.total).toBe('number');
    expect(typeof mappingStats?.mapped).toBe('number');
    expect(typeof mappingStats?.unmapped).toBe('number');
    expect(typeof mappingStats?.percentage).toBe('number');
  });

  it('should return correct data structure for balance discrepancies', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.balanceDiscrepancies.isLoading).toBe(false);
    });

    const discrepancies = result.current.balanceDiscrepancies.data;
    expect(Array.isArray(discrepancies)).toBe(true);
    
    if (discrepancies && discrepancies.length > 0) {
      const discrepancy = discrepancies[0];
      expect(discrepancy).toHaveProperty('accountName');
      expect(discrepancy).toHaveProperty('pocketsmithBalance');
      expect(discrepancy).toHaveProperty('ynabBalance');
      expect(discrepancy).toHaveProperty('difference');
      expect(discrepancy).toHaveProperty('currency');
    }
  });

  it('should return correct data structure for recent activity', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.recentActivity.isLoading).toBe(false);
    });

    const activities = result.current.recentActivity.data;
    expect(Array.isArray(activities)).toBe(true);
    
    if (activities && activities.length > 0) {
      const activity = activities[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('status');
      expect(activity).toHaveProperty('message');
      expect(activity).toHaveProperty('timestamp');
      expect(['sync', 'mapping', 'balance_check']).toContain(activity.type);
      expect(['success', 'error', 'warning']).toContain(activity.status);
    }
  });

  it('should return correct data structure for metrics', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.metrics.isLoading).toBe(false);
    });

    const metrics = result.current.metrics.data;
    expect(metrics).toHaveProperty('totalAccounts');
    expect(metrics).toHaveProperty('successRate');
    expect(metrics).toHaveProperty('avgSyncTime');
    expect(metrics).toHaveProperty('dataFreshness');
    expect(typeof metrics?.totalAccounts).toBe('number');
    expect(typeof metrics?.successRate).toBe('number');
    expect(typeof metrics?.avgSyncTime).toBe('number');
    expect(typeof metrics?.dataFreshness).toBe('number');
  });
});