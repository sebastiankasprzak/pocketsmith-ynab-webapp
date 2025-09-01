/**
 * Centralized query key factory for consistent cache management
 * This ensures we have a single source of truth for all query keys
 * and enables hierarchical invalidation patterns
 */

export const queryKeys = {
  // Top-level keys
  accounts: ['accounts'] as const,
  mappings: ['mappings'] as const,
  balances: ['balances'] as const,
  sync: ['sync'] as const,
  budgets: ['budgets'] as const,

  // Account-related queries
  accountsData: () => [...queryKeys.accounts, 'data'] as const,
  pocketsmithAccounts: () => [...queryKeys.accounts, 'pocketsmith'] as const,
  ynabAccounts: () => [...queryKeys.accounts, 'ynab'] as const,

  // Mapping-related queries
  mappingsData: () => [...queryKeys.mappings, 'data'] as const,
  mappingsConfig: () => [...queryKeys.mappings, 'config'] as const,

  // Balance-related queries
  balanceComparisons: () => [...queryKeys.balances, 'comparisons'] as const,
  balanceRefresh: () => [...queryKeys.balances, 'refresh'] as const,

  // Sync-related queries
  syncState: () => [...queryKeys.sync, 'state'] as const,
  syncOverview: () => [...queryKeys.sync, 'overview'] as const,
  recentActivity: (hours?: number) => [...queryKeys.sync, 'activity', hours || 24] as const,

  // Budget-related queries
  ynabBudgets: () => [...queryKeys.budgets, 'ynab'] as const,
  currentBudget: () => [...queryKeys.budgets, 'current'] as const,

  // Dashboard aggregated data
  dashboard: ['dashboard'] as const,
  dashboardMetrics: () => [...queryKeys.dashboard, 'metrics'] as const,
} as const;

/**
 * Cache invalidation helpers for common scenarios
 */
export const cacheInvalidation = {
  // Invalidate all account-related data
  accounts: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
  },

  // Invalidate all mapping-related data
  mappings: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.mappings });
  },

  // Invalidate all balance-related data
  balances: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.balances });
  },

  // Invalidate all sync-related data
  sync: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sync });
  },

  // Invalidate everything (use sparingly)
  all: (queryClient: any) => {
    queryClient.invalidateQueries();
  },

  // Smart invalidation after account mapping changes
  afterMappingChange: (queryClient: any) => {
    // Mappings directly affected
    queryClient.invalidateQueries({ queryKey: queryKeys.mappings });
    
    // Accounts might need refresh to show mapping status
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    
    // Balance comparisons depend on mappings
    queryClient.invalidateQueries({ queryKey: queryKeys.balances });
    
    // Dashboard aggregates all of the above
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  },

  // Smart invalidation after sync operation
  afterSync: (queryClient: any) => {
    // Sync state and activity
    queryClient.invalidateQueries({ queryKey: queryKeys.sync });
    
    // Balances might have changed
    queryClient.invalidateQueries({ queryKey: queryKeys.balances });
    
    // Dashboard metrics
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  },

  // Smart invalidation after budget change
  afterBudgetChange: (queryClient: any) => {
    // Budget data
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
    
    // Accounts (YNAB accounts depend on budget)
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    
    // Mappings (might be affected by budget change)
    queryClient.invalidateQueries({ queryKey: queryKeys.mappings });
    
    // Balances (YNAB balances depend on budget)
    queryClient.invalidateQueries({ queryKey: queryKeys.balances });
  },
};