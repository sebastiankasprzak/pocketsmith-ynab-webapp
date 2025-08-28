import { apiClient } from './apiClient';
import { mockApi } from './mockApi';
import type { ApiError } from './apiClient';
import type {
  PocketSmithAccount,
  YNABAccount,
  AccountMappingCreate,
  AccountsResponse,
  MappingsResponse,
  BalanceComparisonResponse,
  BudgetsResponse
} from '../types/accounts';

// Use mock API if explicitly set to true, OR if in development mode AND not explicitly set to false
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || 
  (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API !== 'false');



// Real API implementation
const realApi = {
  // Fetch accounts from both PocketSmith and YNAB
  async fetchAccounts(): Promise<AccountsResponse> {
    try {
      const [pocketsmithResponse, ynabResponse] = await Promise.all([
        apiClient.get<{
          accounts: PocketSmithAccount[];
          count: number;
          timestamp: string;
        }>('/accounts/pocketsmith'),
        apiClient.get<{
          accounts: YNABAccount[];
          count: number;
          budgetId: string;
          timestamp: string;
        }>('/accounts/ynab')
      ]);

      return {
        pocketsmithAccounts: pocketsmithResponse.data.accounts,
        ynabAccounts: ynabResponse.data.accounts
      };
    } catch (error: any) {
      this.handleApiError(error, 'Failed to fetch accounts');
    }
  },

  // Get current account mappings
  async fetchMappings(): Promise<MappingsResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          mappings: Record<string, string>;
          default_account_id?: string;
          strict_mode: boolean;
          created_at?: string;
          auto_generated?: boolean;
        };
      }>('/mappings');

    if (!response.data.success) {
      throw new Error('Failed to fetch mappings from API');
    }

    const config = response.data.data;
    
    // If no mappings exist, return empty array
    if (!config.mappings || Object.keys(config.mappings).length === 0) {
      return {
        mappings: [],
        config
      };
    }

    // Fetch account data to get proper names for the mappings
    let accountsData: AccountsResponse;
    try {
      accountsData = await realApi.fetchAccounts();
    } catch (error) {
      // Re-throw the error instead of falling back to IDs
      // This will cause the UI to show an error state instead of confusing ID-based names
      throw new Error('Unable to load account mappings: Failed to fetch account details');
    }



    // Create lookup maps for account names - handle both string and number IDs
    const psAccountMap = new Map();
    accountsData.pocketsmithAccounts.forEach(acc => {
      // Store with both string and number keys to handle any ID format
      const stringId = acc.id.toString();
      const numberId = typeof acc.id === 'number' ? acc.id : parseInt(acc.id);
      
      // Use title field (primary) or fallback to name, then create fallback if neither exists
      const accountName = acc.title || acc.name || `PocketSmith ${acc.type || 'Account'} (${acc.id})`;
      
      psAccountMap.set(stringId, accountName);
      if (!isNaN(numberId)) {
        psAccountMap.set(numberId, accountName);
      }
      

    });

    const ynabAccountMap = new Map(
      accountsData.ynabAccounts.map(acc => [acc.id, acc.name])
    );

    // Transform Record<string, string> to AccountMappingDisplay[]
    const mappings = Object.entries(config.mappings).map(([psId, ynabId]) => {
      // Try to find PocketSmith account with flexible ID matching
      let psName = psAccountMap.get(psId);
      
      if (!psName) {
        // Try as number if string lookup failed
        const numericId = parseInt(psId);
        if (!isNaN(numericId)) {
          psName = psAccountMap.get(numericId);
        }
      }
      
      const ynabName = ynabAccountMap.get(ynabId);
      


      // Determine if this is likely a deleted account vs a data issue
      const isLikelyDeleted = !psName && accountsData.pocketsmithAccounts.length > 0;
      const displayName = psName || (isLikelyDeleted ? 
        `[Deleted] PocketSmith Account (${psId})` : 
        `[Error] PocketSmith Account (${psId})`);

      return {
        pocketsmithAccountId: psId,
        pocketsmithAccountName: displayName,
        ynabAccountId: ynabId,
        ynabAccountName: ynabName || `[Deleted] YNAB Account (${ynabId})`,
        isActive: !!(psName && ynabName) // Only active if both accounts still exist
      };
    });

    return {
      mappings,
      config
    };
    } catch (error: any) {
      this.handleApiError(error, 'Failed to fetch mappings');
    }
  },

  // Create or update account mappings
  // IMPORTANT: This function transforms the UI's array format to the Parameter Store's object format
  // to prevent data loss when saving new mappings alongside existing ones
  async saveMappings(mappings: AccountMappingCreate[]): Promise<void> {
    try {
      // First, get the current mapping configuration to preserve existing settings
      let currentConfig;
      try {
        const currentMappingsResponse = await this.fetchMappings();
        currentConfig = currentMappingsResponse.config;
      } catch (error) {
        // If we can't fetch existing mappings, start with a default configuration
        currentConfig = {
          mappings: {},
          strict_mode: true,
          auto_generated: false
        };
      }

      // Transform array format to object format expected by backend
      const mappingsObject: Record<string, string> = {};
      
      // Start with existing mappings to preserve them
      if (currentConfig.mappings && typeof currentConfig.mappings === 'object') {
        Object.assign(mappingsObject, currentConfig.mappings);
      }
      
      // Add new mappings (this will overwrite if PocketSmith ID already exists)
      mappings.forEach(mapping => {
        mappingsObject[mapping.pocketsmithAccountId] = mapping.ynabAccountId;
      });

      // Prepare the complete configuration object in the format expected by Parameter Store
      const configToSave = {
        mappings: mappingsObject,
        default_account_id: currentConfig.default_account_id,
        strict_mode: currentConfig.strict_mode ?? true, // Default to true if not set
        created_at: currentConfig.created_at || new Date().toISOString(),
        auto_generated: false // Mark as manually updated
      };



      await apiClient.post('/mappings', configToSave);
    } catch (error: any) {
      this.handleApiError(error, 'Failed to save mappings');
    }
  },

  // Delete a specific mapping
  async deleteMapping(pocketsmithAccountId: string): Promise<void> {
    try {
      await apiClient.delete(`/mappings/${pocketsmithAccountId}`);
    } catch (error: any) {
      this.handleApiError(error, 'Failed to delete mapping');
    }
  },

  // Validate mappings before saving
  async validateMappings(mappings: AccountMappingCreate[]): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { valid: boolean; errors: string[] };
      }>('/mappings/validate', { mappings });
      
      if (!response.data.success) {
        throw new Error('Validation request failed');
      }
      
      return response.data.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to validate mappings');
    }
  },

  // Update mapping configuration (default account ID and strict mode)
  async updateMappingConfig(config: { default_account_id?: string; strict_mode: boolean }): Promise<void> {
    try {
      // First, get the current mapping configuration to preserve existing mappings
      let currentConfig;
      try {
        const currentMappingsResponse = await this.fetchMappings();
        currentConfig = currentMappingsResponse.config;
      } catch (error) {
        currentConfig = {
          mappings: {},
          strict_mode: true,
          auto_generated: false
        };
      }

      // Prepare the complete configuration object with updated settings
      const configToSave = {
        mappings: currentConfig.mappings || {},
        default_account_id: config.default_account_id,
        strict_mode: config.strict_mode,
        created_at: currentConfig.created_at || new Date().toISOString(),
        auto_generated: false // Mark as manually updated
      };



      await apiClient.post('/mappings', configToSave);
    } catch (error: any) {
      this.handleApiError(error, 'Failed to update mapping configuration');
    }
  },



  // Fetch balance comparisons
  async fetchBalanceComparisons(): Promise<BalanceComparisonResponse> {
    try {
      const response = await apiClient.get<BalanceComparisonResponse>('/balances/compare');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to fetch balance comparisons');
    }
  },

  // Refresh balance data
  async refreshBalances(): Promise<BalanceComparisonResponse> {
    try {
      const response = await apiClient.post<BalanceComparisonResponse>('/balances/refresh');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to refresh balances');
    }
  },

  // Fetch YNAB budgets
  async fetchYNABBudgets(): Promise<BudgetsResponse> {
    try {
      const response = await apiClient.get<BudgetsResponse>('/budgets/ynab');
      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Failed to fetch YNAB budgets');
    }
  },

  // Update YNAB budget ID
  async updateYNABBudgetId(budgetId: string): Promise<void> {
    try {
      await apiClient.post('/budgets/ynab/update', { budgetId });
    } catch (error: any) {
      this.handleApiError(error, 'Failed to update YNAB budget ID');
    }
  },

  /**
   * Handle API errors with standardized error messages
   */
  handleApiError(error: ApiError, defaultMessage: string): never {
    // If it's already an ApiError from our interceptor, use its message
    if (error.code && error.message) {
      throw new Error(error.message);
    }
    
    // Fallback to default message
    throw new Error(defaultMessage);
  }
};

// Export the appropriate API based on environment
export const accountsApi = USE_MOCK_API ? mockApi : realApi;