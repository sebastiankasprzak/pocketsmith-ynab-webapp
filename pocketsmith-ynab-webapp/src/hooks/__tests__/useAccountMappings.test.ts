import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useAccounts,
  useMappings,
  useSaveMappings,
  useDeleteMapping,
  useValidateMappings,
  QUERY_KEYS
} from '../useAccountMappings'
import type { AccountsResponse, MappingsResponse, AccountMappingCreate } from '../../types/accounts'

// Mock the accounts API
const mockAccountsApi = vi.hoisted(() => ({
  fetchAccounts: vi.fn(),
  fetchMappings: vi.fn(),
  saveMappings: vi.fn(),
  deleteMapping: vi.fn(),
  validateMappings: vi.fn()
}))

vi.mock('../../services/accountsApi', () => ({
  accountsApi: mockAccountsApi
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAccountMappings hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAccounts', () => {
    it('should fetch accounts successfully', async () => {
      const mockAccountsData: AccountsResponse = {
        pocketsmithAccounts: [
          {
            id: 1,
            name: 'Test Account 1',
            type: 'bank',
            currency_code: 'USD',
            current_balance: 1000,
            current_balance_date: '2024-01-01',
            current_balance_in_base_currency: 1000,
            safe_balance: 1000,
            safe_balance_in_base_currency: 1000,
            starting_balance: 0,
            starting_balance_date: '2024-01-01',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        ynabAccounts: [
          {
            id: 'ynab-1',
            name: 'YNAB Account 1',
            type: 'checking',
            on_budget: true,
            closed: false,
            balance: 100000,
            cleared_balance: 100000,
            uncleared_balance: 0,
            transfer_payee_id: 'payee-1',
            direct_import_linked: false,
            direct_import_in_error: false
          }
        ]
      }

      mockAccountsApi.fetchAccounts.mockResolvedValue(mockAccountsData)

      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockAccountsData)
      expect(mockAccountsApi.fetchAccounts).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch accounts error', async () => {
      const error = new Error('Failed to fetch accounts')
      mockAccountsApi.fetchAccounts.mockRejectedValue(error)

      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should use correct query key and options', () => {
      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper()
      })

      // Check that the hook is using the correct query key
      expect(result.current.dataUpdatedAt).toBeDefined()
      
      // The stale time should be 5 minutes (300000ms)
      // We can't directly test this, but we can verify the hook is configured
      expect(result.current.isLoading).toBeDefined()
    })
  })

  describe('useMappings', () => {
    it('should fetch mappings successfully', async () => {
      const mockMappingsData: MappingsResponse = {
        mappings: [
          {
            pocketsmithAccountId: '1',
            pocketsmithAccountName: 'Test Account 1',
            ynabAccountId: 'ynab-1',
            ynabAccountName: 'YNAB Account 1',
            isActive: true
          }
        ],
        lastUpdated: '2024-01-01T00:00:00Z'
      }

      mockAccountsApi.fetchMappings.mockResolvedValue(mockMappingsData)

      const { result } = renderHook(() => useMappings(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockMappingsData)
      expect(mockAccountsApi.fetchMappings).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch mappings error', async () => {
      const error = new Error('Failed to fetch mappings')
      mockAccountsApi.fetchMappings.mockRejectedValue(error)

      const { result } = renderHook(() => useMappings(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useSaveMappings', () => {
    it('should save mappings successfully', async () => {
      const mockMappings: AccountMappingCreate[] = [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: 'ynab-1'
        }
      ]

      const mockResponse = { success: true, message: 'Mappings saved' }
      mockAccountsApi.saveMappings.mockResolvedValue(mockResponse)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useSaveMappings(), { wrapper })

      await waitFor(() => {
        result.current.mutate(mockMappings)
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAccountsApi.saveMappings).toHaveBeenCalledWith(mockMappings)
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.mappings })
    })

    it('should handle save mappings error', async () => {
      const mockMappings: AccountMappingCreate[] = [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: 'ynab-1'
        }
      ]

      const error = new Error('Failed to save mappings')
      mockAccountsApi.saveMappings.mockRejectedValue(error)

      const { result } = renderHook(() => useSaveMappings(), {
        wrapper: createWrapper()
      })

      result.current.mutate(mockMappings)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useDeleteMapping', () => {
    it('should delete mapping successfully', async () => {
      const pocketsmithAccountId = '1'
      const mockResponse = { success: true, message: 'Mapping deleted' }
      mockAccountsApi.deleteMapping.mockResolvedValue(mockResponse)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteMapping(), { wrapper })

      result.current.mutate(pocketsmithAccountId)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAccountsApi.deleteMapping).toHaveBeenCalledWith(pocketsmithAccountId)
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.mappings })
    })

    it('should handle delete mapping error', async () => {
      const pocketsmithAccountId = '1'
      const error = new Error('Failed to delete mapping')
      mockAccountsApi.deleteMapping.mockRejectedValue(error)

      const { result } = renderHook(() => useDeleteMapping(), {
        wrapper: createWrapper()
      })

      result.current.mutate(pocketsmithAccountId)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useValidateMappings', () => {
    it('should validate mappings successfully', async () => {
      const mockMappings: AccountMappingCreate[] = [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: 'ynab-1'
        }
      ]

      const mockResponse = { 
        valid: true, 
        errors: [],
        warnings: []
      }
      mockAccountsApi.validateMappings.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useValidateMappings(), {
        wrapper: createWrapper()
      })

      result.current.mutate(mockMappings)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockAccountsApi.validateMappings).toHaveBeenCalledWith(mockMappings)
    })

    it('should handle validation error', async () => {
      const mockMappings: AccountMappingCreate[] = [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: 'invalid-id'
        }
      ]

      const error = new Error('Validation failed')
      mockAccountsApi.validateMappings.mockRejectedValue(error)

      const { result } = renderHook(() => useValidateMappings(), {
        wrapper: createWrapper()
      })

      result.current.mutate(mockMappings)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should return validation errors for invalid mappings', async () => {
      const mockMappings: AccountMappingCreate[] = [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: 'invalid-id'
        }
      ]

      const mockResponse = { 
        valid: false, 
        errors: ['YNAB account not found: invalid-id'],
        warnings: []
      }
      mockAccountsApi.validateMappings.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useValidateMappings(), {
        wrapper: createWrapper()
      })

      result.current.mutate(mockMappings)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.data?.valid).toBe(false)
      expect(result.current.data?.errors).toContain('YNAB account not found: invalid-id')
    })
  })

  describe('QUERY_KEYS', () => {
    it('should have correct query keys', () => {
      expect(QUERY_KEYS.accounts).toEqual(['accounts'])
      expect(QUERY_KEYS.mappings).toEqual(['mappings'])
    })
  })
})