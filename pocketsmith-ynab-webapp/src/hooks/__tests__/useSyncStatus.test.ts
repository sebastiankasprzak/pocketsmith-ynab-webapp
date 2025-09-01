import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncStatus, useSyncStateOverview, useRecentActivity } from '../useSyncStatus';
import { syncApiService } from '../../services/syncApi';

// Mock the sync API service
jest.mock('../../services/syncApi');
const mockSyncApiService = syncApiService as jest.Mocked<typeof syncApiService>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSyncStatus hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSyncStateOverview', () => {
    it('should fetch sync state overview successfully', async () => {
      const mockData = {
        accounts: [],
        total_accounts: 0,
        total_processed_transactions: 0,
        last_activity: null,
        lastUpdated: new Date().toISOString(),
      };

      mockSyncApiService.getSyncStateOverview.mockResolvedValue(mockData);

      const { result } = renderHook(() => useSyncStateOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockSyncApiService.getSyncStateOverview).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch sync state';
      mockSyncApiService.getSyncStateOverview.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSyncStateOverview(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorMessage);
    });
  });

  describe('useRecentActivity', () => {
    it('should fetch recent activity with default hours', async () => {
      const mockData = {
        recent_activity: [],
        parameters: { hours: 24 },
        lastUpdated: new Date().toISOString(),
      };

      mockSyncApiService.getRecentActivity.mockResolvedValue(mockData);

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockSyncApiService.getRecentActivity).toHaveBeenCalledWith(24);
    });

    it('should fetch recent activity with custom hours', async () => {
      const mockData = {
        recent_activity: [],
        parameters: { hours: 48 },
        lastUpdated: new Date().toISOString(),
      };

      mockSyncApiService.getRecentActivity.mockResolvedValue(mockData);

      const { result } = renderHook(() => useRecentActivity({ activityHours: 48 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSyncApiService.getRecentActivity).toHaveBeenCalledWith(48);
    });
  });

  describe('useSyncStatus', () => {
    it('should combine sync state and recent activity data', async () => {
      const mockSyncState = {
        accounts: [],
        total_accounts: 0,
        total_processed_transactions: 0,
        last_activity: null,
        lastUpdated: new Date().toISOString(),
      };

      const mockRecentActivity = {
        recent_activity: [],
        parameters: { hours: 24 },
        lastUpdated: new Date().toISOString(),
      };

      mockSyncApiService.getSyncStateOverview.mockResolvedValue(mockSyncState);
      mockSyncApiService.getRecentActivity.mockResolvedValue(mockRecentActivity);

      const { result } = renderHook(() => useSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.syncStateOverview).toEqual(mockSyncState);
        expect(result.current.recentActivity).toEqual(mockRecentActivity);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('should provide refresh functionality', async () => {
      const mockSyncState = {
        accounts: [],
        total_accounts: 0,
        total_processed_transactions: 0,
        last_activity: null,
        lastUpdated: new Date().toISOString(),
      };

      mockSyncApiService.getSyncStateOverview.mockResolvedValue(mockSyncState);
      mockSyncApiService.getRecentActivity.mockResolvedValue({
        recent_activity: [],
        parameters: { hours: 24 },
        lastUpdated: new Date().toISOString(),
      });

      const { result } = renderHook(() => useSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.syncStateOverview).toBeDefined();
      });

      // Test refresh functionality
      expect(typeof result.current.refreshAllData).toBe('function');
      expect(typeof result.current.triggerSyncAsync).toBe('function');
    });
  });
});