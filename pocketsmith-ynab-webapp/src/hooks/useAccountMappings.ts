import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../services/accountsApi';
import { queryKeys, cacheInvalidation } from './queryKeys';
import type {
  AccountsResponse,
  MappingsResponse,
  AccountMappingCreate
} from '../types/accounts';

// Hook for fetching accounts from both APIs
export const useAccounts = () => {
  return useQuery<AccountsResponse>({
    queryKey: queryKeys.accountsData(),
    queryFn: accountsApi.fetchAccounts,
    staleTime: 15 * 60 * 1000, // 15 minutes - backend has caching now
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

// Hook for fetching current mappings
export const useMappings = () => {
  return useQuery<MappingsResponse>({
    queryKey: queryKeys.mappingsData(),
    queryFn: accountsApi.fetchMappings,
    staleTime: 10 * 60 * 1000, // 10 minutes - backend has caching now
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 2,
  });
};

// Hook for saving mappings
export const useSaveMappings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappings: AccountMappingCreate[]) => accountsApi.saveMappings(mappings),
    onSuccess: () => {
      // Smart invalidation after mapping changes
      cacheInvalidation.afterMappingChange(queryClient);
    },
  });
};

// Hook for deleting a mapping
export const useDeleteMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pocketsmithAccountId: string) => accountsApi.deleteMapping(pocketsmithAccountId),
    onSuccess: () => {
      // Smart invalidation after mapping changes
      cacheInvalidation.afterMappingChange(queryClient);
    },
  });
};

// Hook for validating mappings
export const useValidateMappings = () => {
  return useMutation({
    mutationFn: (mappings: AccountMappingCreate[]) => accountsApi.validateMappings(mappings),
  });
};

// Hook for updating mapping configuration
export const useUpdateMappingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: { default_account_id?: string; strict_mode: boolean }) => 
      accountsApi.updateMappingConfig(config),
    onSuccess: () => {
      // Smart invalidation after mapping config changes
      cacheInvalidation.afterMappingChange(queryClient);
    },
  });
};

// Hook for fetching YNAB budgets
export const useYNABBudgets = () => {
  return useQuery({
    queryKey: queryKeys.ynabBudgets(),
    queryFn: accountsApi.fetchYNABBudgets,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - budgets don't change often
    retry: 2,
  });
};

// Hook for updating YNAB budget ID
export const useUpdateYNABBudgetId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) => accountsApi.updateYNABBudgetId(budgetId),
    onSuccess: () => {
      // Smart invalidation after budget change
      cacheInvalidation.afterBudgetChange(queryClient);
    },
  });
};