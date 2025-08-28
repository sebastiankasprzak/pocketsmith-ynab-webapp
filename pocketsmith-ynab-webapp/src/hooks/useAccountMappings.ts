import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../services/accountsApi';
import type {
  AccountsResponse,
  MappingsResponse,
  AccountMappingCreate
} from '../types/accounts';

// Query keys
export const QUERY_KEYS = {
  accounts: ['accounts'] as const,
  mappings: ['mappings'] as const,
};

// Hook for fetching accounts from both APIs
export const useAccounts = () => {
  return useQuery<AccountsResponse>({
    queryKey: QUERY_KEYS.accounts,
    queryFn: accountsApi.fetchAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Hook for fetching current mappings
export const useMappings = () => {
  return useQuery<MappingsResponse>({
    queryKey: QUERY_KEYS.mappings,
    queryFn: accountsApi.fetchMappings,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Hook for saving mappings
export const useSaveMappings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappings: AccountMappingCreate[]) => accountsApi.saveMappings(mappings),
    onSuccess: () => {
      // Invalidate and refetch mappings after successful save
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mappings });
    },
  });
};

// Hook for deleting a mapping
export const useDeleteMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pocketsmithAccountId: string) => accountsApi.deleteMapping(pocketsmithAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mappings });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mappings });
    },
  });
};