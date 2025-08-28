import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBalanceComparisons } from '../useBalanceComparisons'
import type { BalanceComparisonResponse } from '../../types/accounts'

// Mock the accounts API
const mockAccountsApi = vi.hoisted(() => ({
  fetchBalanceComparisons: vi.fn(),
  refreshBalances: vi.fn()
}))

vi.mock('../../services/accountsApi', () => ({
  accountsApi: mockAccountsApi
}))

// Mock error logging service
vi.mock('../../services/errorLoggingService', () => ({
  errorLoggingService: {
    logError: vi.fn()
  }
}))

// Mock error handler
vi.mock('../../utils/errorHandling', () => ({
  ErrorHandler: {
    parseError: vi.fn((error) => ({
      userMessage: error.message || 'Unknown error',
      technicalMessage: error.message || 'Unknown error'
    }))
  }
}))

describe('useBalanceComparisons', () => {
  const mockBalanceData: BalanceComparisonResponse = {
    comparisons: [
      {
        pocketsmithAccountId: '1',
        pocketsmithAccountName: 'Test Account 1',
        pocketsmithBalance: 1000,
        ynabAccountId: 'ynab-1',
        ynabAccountName: 'YNAB Account 1',
        ynabBalance: 1000,
        difference: 0,
        currency: 'USD',
        lastUpdated: '2024-01-01T00:00:00Z',
        hasDiscrepancy: false,
        discrepancyThreshold: 0.01
      }
    ],
    cacheExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    lastFetched: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial load', () => {
    it('should fetch balance data on mount', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockBalanceData)
      expect(result.current.error).toBe(null)
      expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
    })

    it('should handle initial fetch error', async () => {
      const error = new Error('Failed to fetch balance data')
      mockAccountsApi.fetchBalanceComparisons.mockRejectedValue(error)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('Failed to fetch balance data')
    })
  })

  describe('cache management', () => {
    it('should detect expired cache', async () => {
      const expiredData = {
        ...mockBalanceData,
        cacheExpiry: new Date(Date.now() - 1000).toISOString() // 1 second ago
      }
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(expiredData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isCacheExpired).toBe(true)
      expect(result.current.timeUntilExpiry).toBe(0)
    })

    it('should calculate time until expiry correctly', async () => {
      const futureExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      const dataWithFutureExpiry = {
        ...mockBalanceData,
        cacheExpiry: futureExpiry
      }
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(dataWithFutureExpiry)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isCacheExpired).toBe(false)
      expect(result.current.timeUntilExpiry).toBeGreaterThan(0)
      expect(result.current.timeUntilExpiry).toBeLessThanOrEqual(5 * 60 * 1000)
    })
  })

  describe('refresh functionality', () => {
    it('should refresh data using cached endpoint when cache is valid', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear the mock to track new calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
      expect(mockAccountsApi.refreshBalances).not.toHaveBeenCalled()
    })

    it('should force refresh using refresh endpoint', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)
      mockAccountsApi.refreshBalances.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.forceRefresh()
      })

      expect(mockAccountsApi.refreshBalances).toHaveBeenCalledTimes(1)
    })

    it('should use refresh endpoint when cache is expired', async () => {
      const expiredData = {
        ...mockBalanceData,
        cacheExpiry: new Date(Date.now() - 1000).toISOString()
      }
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(expiredData)
      mockAccountsApi.refreshBalances.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear mocks to track refresh call
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      await act(async () => {
        await result.current.refresh()
      })

      expect(mockAccountsApi.refreshBalances).toHaveBeenCalledTimes(1)
      expect(mockAccountsApi.fetchBalanceComparisons).not.toHaveBeenCalled()
    })

    it('should show refreshing state during refresh', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.refreshing).toBe(false)

      // Mock a slow refresh
      let resolveRefresh: (value: any) => void
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve
      })
      mockAccountsApi.fetchBalanceComparisons.mockReturnValue(refreshPromise)

      act(() => {
        result.current.refresh()
      })

      expect(result.current.refreshing).toBe(true)

      act(() => {
        resolveRefresh!(mockBalanceData)
      })

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false)
      })
    })
  })

  describe('auto-refresh', () => {
    it('should setup auto-refresh timer', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons({
        autoRefreshInterval: 1000, // 1 second for testing
        enableAutoRefresh: true
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear initial fetch calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      // Fast-forward time to trigger auto-refresh
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
      })
    })

    it('should not auto-refresh when disabled', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons({
        autoRefreshInterval: 1000,
        enableAutoRefresh: false
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear initial fetch calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should not have made additional calls
      expect(mockAccountsApi.fetchBalanceComparisons).not.toHaveBeenCalled()
    })

    it('should adjust auto-refresh timing based on cache expiry', async () => {
      const nearExpiryData = {
        ...mockBalanceData,
        cacheExpiry: new Date(Date.now() + 2000).toISOString() // 2 seconds from now
      }
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(nearExpiryData)

      const { result } = renderHook(() => useBalanceComparisons({
        autoRefreshInterval: 10000, // 10 seconds
        enableAutoRefresh: true
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear initial fetch calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      // Fast-forward to just after cache expiry + buffer (30s)
      act(() => {
        vi.advanceTimersByTime(2500)
      })

      await waitFor(() => {
        expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('error handling', () => {
    it('should handle refresh errors gracefully', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock error on refresh
      const error = new Error('Refresh failed')
      mockAccountsApi.fetchBalanceComparisons.mockRejectedValue(error)

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.error).toBe('Refresh failed')
      expect(result.current.data).toEqual(mockBalanceData) // Should keep previous data
    })

    it('should log errors with context', async () => {
      const error = new Error('API Error')
      mockAccountsApi.fetchBalanceComparisons.mockRejectedValue(error)

      renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        const { errorLoggingService } = require('../../services/errorLoggingService')
        expect(errorLoggingService.logError).toHaveBeenCalledWith(
          error,
          undefined,
          expect.objectContaining({
            component: 'useBalanceComparisons',
            action: 'refresh'
          })
        )
      })
    })

    it('should handle aborted requests', async () => {
      let rejectFetch: (reason: any) => void
      const fetchPromise = new Promise((_, reject) => {
        rejectFetch = reject
      })
      mockAccountsApi.fetchBalanceComparisons.mockReturnValue(fetchPromise)

      const { result, unmount } = renderHook(() => useBalanceComparisons())

      // Unmount to trigger abort
      unmount()

      // Simulate abort error
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      
      act(() => {
        rejectFetch!(abortError)
      })

      // Should not set error state for aborted requests
      expect(result.current.error).toBe(null)
    })
  })

  describe('cleanup', () => {
    it('should cleanup timers and abort controllers on unmount', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result, unmount } = renderHook(() => useBalanceComparisons({
        enableAutoRefresh: true,
        autoRefreshInterval: 1000
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Unmount should cleanup without errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('custom options', () => {
    it('should respect custom cache timeout', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons({
        cacheTimeout: 1000 // 1 second
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Fast-forward past cache timeout
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // Clear initial calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      // Refresh should now fetch fresh data due to local cache timeout
      await act(async () => {
        await result.current.refresh()
      })

      expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
    })

    it('should use custom auto-refresh interval', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons({
        autoRefreshInterval: 500, // 0.5 seconds
        enableAutoRefresh: true
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear initial calls
      mockAccountsApi.fetchBalanceComparisons.mockClear()

      // Fast-forward by custom interval
      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(mockAccountsApi.fetchBalanceComparisons).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('return values', () => {
    it('should return correct state values', async () => {
      mockAccountsApi.fetchBalanceComparisons.mockResolvedValue(mockBalanceData)

      const { result } = renderHook(() => useBalanceComparisons())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockBalanceData)
      expect(result.current.loading).toBe(false)
      expect(result.current.refreshing).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.isCacheExpired).toBe(false)
      expect(result.current.timeUntilExpiry).toBeGreaterThan(0)
      expect(result.current.lastFetchTime).toBeInstanceOf(Date)
      expect(typeof result.current.refresh).toBe('function')
      expect(typeof result.current.forceRefresh).toBe('function')
    })
  })
})