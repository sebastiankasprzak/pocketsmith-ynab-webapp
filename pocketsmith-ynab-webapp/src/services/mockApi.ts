import type {
  PocketSmithAccount,
  YNABAccount,
  AccountsResponse,
  MappingsResponse,
  AccountMappingCreate,
  BalanceComparisonResponse,
  BalanceComparison,
  BudgetsResponse,
  YNABBudget
} from '../types/accounts';

// Mock data for development
const mockPocketSmithAccounts: PocketSmithAccount[] = [
  {
    id: 1,
    title: "ANZ Checking Account",
    type: "bank",
    currency_code: "USD",
    current_balance: 2500.50,
    current_balance_date: "2024-01-15",
    current_balance_in_base_currency: 2500.50,
    safe_balance: 2400.00,
    safe_balance_in_base_currency: 2400.00,
    starting_balance: 1000.00,
    starting_balance_date: "2023-01-01",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    institution: {
      id: 1,
      name: "ANZ Bank"
    }
  },
  {
    id: 2,
    title: "Chase Credit Card",
    type: "credit_card",
    currency_code: "USD",
    current_balance: -1200.75,
    current_balance_date: "2024-01-15",
    current_balance_in_base_currency: -1200.75,
    safe_balance: -1200.75,
    safe_balance_in_base_currency: -1200.75,
    starting_balance: 0.00,
    starting_balance_date: "2023-01-01",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    institution: {
      id: 2,
      name: "Chase Bank"
    }
  },
  {
    id: 3,
    title: "Savings Account",
    type: "bank",
    currency_code: "USD",
    current_balance: 15000.00,
    current_balance_date: "2024-01-15",
    current_balance_in_base_currency: 15000.00,
    safe_balance: 15000.00,
    safe_balance_in_base_currency: 15000.00,
    starting_balance: 10000.00,
    starting_balance_date: "2023-01-01",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    institution: {
      id: 1,
      name: "ANZ Bank"
    }
  }
];

const mockYnabAccounts: YNABAccount[] = [
  {
    id: "ynab-1",
    name: "Checking",
    type: "checking",
    on_budget: true,
    closed: false,
    balance: 250050,
    cleared_balance: 250050,
    uncleared_balance: 0,
    transfer_payee_id: "transfer-1",
    direct_import_linked: false,
    direct_import_in_error: false
  },
  {
    id: "ynab-2",
    name: "Credit Card",
    type: "creditCard",
    on_budget: true,
    closed: false,
    balance: -120075,
    cleared_balance: -120075,
    uncleared_balance: 0,
    transfer_payee_id: "transfer-2",
    direct_import_linked: false,
    direct_import_in_error: false
  },
  {
    id: "ynab-3",
    name: "Savings",
    type: "savings",
    on_budget: true,
    closed: false,
    balance: 1500000,
    cleared_balance: 1500000,
    uncleared_balance: 0,
    transfer_payee_id: "transfer-3",
    direct_import_linked: false,
    direct_import_in_error: false
  },
  {
    id: "ynab-4",
    name: "Emergency Fund",
    type: "savings",
    on_budget: false,
    closed: false,
    balance: 500000,
    cleared_balance: 500000,
    uncleared_balance: 0,
    transfer_payee_id: "transfer-4",
    direct_import_linked: false,
    direct_import_in_error: false
  }
];

const mockYnabBudgets: YNABBudget[] = [
  {
    id: "budget-1",
    name: "Personal Budget 2024",
    last_modified_on: "2024-01-15T10:30:00Z",
    first_month: "2024-01-01",
    last_month: "2024-12-01",
    date_format: {
      format: "MM/DD/YYYY"
    },
    currency_format: {
      iso_code: "USD",
      example_format: "$123,456.78",
      decimal_digits: 2,
      decimal_separator: ".",
      symbol_first: true,
      group_separator: ",",
      currency_symbol: "$",
      display_symbol: true
    }
  },
  {
    id: "budget-2",
    name: "Family Budget",
    last_modified_on: "2024-01-10T08:15:00Z",
    first_month: "2023-01-01",
    last_month: "2024-12-01",
    date_format: {
      format: "MM/DD/YYYY"
    },
    currency_format: {
      iso_code: "USD",
      example_format: "$123,456.78",
      decimal_digits: 2,
      decimal_separator: ".",
      symbol_first: true,
      group_separator: ",",
      currency_symbol: "$",
      display_symbol: true
    }
  },
  {
    id: "budget-3",
    name: "Business Expenses",
    last_modified_on: "2024-01-12T14:20:00Z",
    first_month: "2024-01-01",
    last_month: "2024-12-01",
    date_format: {
      format: "MM/DD/YYYY"
    },
    currency_format: {
      iso_code: "USD",
      example_format: "$123,456.78",
      decimal_digits: 2,
      decimal_separator: ".",
      symbol_first: true,
      group_separator: ",",
      currency_symbol: "$",
      display_symbol: true
    }
  }
];

// Mock existing mappings
let mockMappings = [
  {
    pocketsmithAccountId: "1",
    pocketsmithAccountName: "ANZ Checking Account",
    ynabAccountId: "ynab-1",
    ynabAccountName: "Checking",
    isActive: true
  }
];

// Mock configuration state
let mockConfig = {
  default_account_id: "ynab-4", // Emergency Fund as default
  strict_mode: true,
  created_at: "2024-01-01T00:00:00Z",
  auto_generated: false
};

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async fetchAccounts(): Promise<AccountsResponse> {
    await delay(800); // Simulate network delay
    return {
      pocketsmithAccounts: mockPocketSmithAccounts,
      ynabAccounts: mockYnabAccounts
    };
  },

  async fetchMappings(): Promise<MappingsResponse> {
    await delay(600);
    return {
      mappings: mockMappings,
      config: {
        mappings: Object.fromEntries(mockMappings.map(m => [m.pocketsmithAccountId, m.ynabAccountId])),
        ...mockConfig
      }
    };
  },

  async saveMappings(mappings: AccountMappingCreate[]): Promise<void> {
    await delay(1000);
    
    // Add new mappings to mock data
    mappings.forEach(mapping => {
      const psAccount = mockPocketSmithAccounts.find(a => a.id.toString() === mapping.pocketsmithAccountId);
      const ynabAccount = mockYnabAccounts.find(a => a.id === mapping.ynabAccountId);
      
      if (psAccount && ynabAccount) {
        mockMappings.push({
          pocketsmithAccountId: mapping.pocketsmithAccountId,
          pocketsmithAccountName: psAccount.title || psAccount.name || `Account ${psAccount.id}`,
          ynabAccountId: mapping.ynabAccountId,
          ynabAccountName: ynabAccount.name,
          isActive: true
        });
      }
    });
  },

  async deleteMapping(pocketsmithAccountId: string): Promise<void> {
    await delay(500);
    mockMappings = mockMappings.filter(m => m.pocketsmithAccountId !== pocketsmithAccountId);
  },

  async validateMappings(mappings: AccountMappingCreate[]): Promise<{ valid: boolean; errors: string[] }> {
    await delay(300);
    
    // Simple validation - check if accounts exist
    const errors: string[] = [];
    
    mappings.forEach((mapping, index) => {
      const psAccount = mockPocketSmithAccounts.find(a => a.id.toString() === mapping.pocketsmithAccountId);
      const ynabAccount = mockYnabAccounts.find(a => a.id === mapping.ynabAccountId);
      
      if (!psAccount) {
        errors.push(`Mapping ${index + 1}: PocketSmith account not found`);
      }
      if (!ynabAccount) {
        errors.push(`Mapping ${index + 1}: YNAB account not found`);
      }
      if (ynabAccount?.closed) {
        errors.push(`Mapping ${index + 1}: Cannot map to closed YNAB account`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  async updateMappingConfig(config: { default_account_id?: string; strict_mode: boolean }): Promise<void> {
    await delay(500);
    
    // Update the mock configuration state
    mockConfig = {
      ...mockConfig,
      default_account_id: config.default_account_id,
      strict_mode: config.strict_mode,
    };
    

  },



  async fetchBalanceComparisons(): Promise<BalanceComparisonResponse> {
    await delay(1200);
    
    const comparisons: BalanceComparison[] = [];
    const now = new Date().toISOString();
    const discrepancyThreshold = 0.01;
    
    // Generate comparisons for mapped accounts
    mockMappings.forEach(mapping => {
      const psAccount = mockPocketSmithAccounts.find(a => a.id.toString() === mapping.pocketsmithAccountId);
      const ynabAccount = mockYnabAccounts.find(a => a.id === mapping.ynabAccountId);
      
      if (psAccount && ynabAccount) {
        const ynabBalanceInDollars = ynabAccount.balance / 1000; // YNAB stores in milliunits
        const difference = psAccount.current_balance - ynabBalanceInDollars;
        
        comparisons.push({
          pocketsmithAccountId: psAccount.id.toString(),
          pocketsmithAccountName: psAccount.title || psAccount.name || `Account ${psAccount.id}`,
          pocketsmithBalance: psAccount.current_balance,
          pocketsmithBalanceDate: psAccount.current_balance_date,
          ynabAccountId: ynabAccount.id,
          ynabAccountName: ynabAccount.name,
          ynabBalance: ynabBalanceInDollars,
          ynabClearedBalance: ynabAccount.cleared_balance / 1000,
          difference: difference,
          currency: psAccount.currency_code,
          lastUpdated: now,
          hasDiscrepancy: Math.abs(difference) > discrepancyThreshold,
          discrepancyThreshold: discrepancyThreshold
        });
      }
    });
    
    // Add some unmapped accounts with mock data to show variety
    if (comparisons.length < 3) {
      // Add Credit Card comparison with discrepancy
      const psCredit = mockPocketSmithAccounts.find(a => a.id === 2);
      const ynabCredit = mockYnabAccounts.find(a => a.id === "ynab-2");
      
      if (psCredit && ynabCredit) {
        const ynabBalanceInDollars = ynabCredit.balance / 1000;
        const difference = psCredit.current_balance - ynabBalanceInDollars;
        
        comparisons.push({
          pocketsmithAccountId: psCredit.id.toString(),
          pocketsmithAccountName: psCredit.title || psCredit.name || `Account ${psCredit.id}`,
          pocketsmithBalance: psCredit.current_balance,
          pocketsmithBalanceDate: psCredit.current_balance_date,
          ynabAccountId: ynabCredit.id,
          ynabAccountName: ynabCredit.name,
          ynabBalance: ynabBalanceInDollars,
          ynabClearedBalance: ynabCredit.cleared_balance / 1000,
          difference: difference,
          currency: psCredit.currency_code,
          lastUpdated: now,
          hasDiscrepancy: Math.abs(difference) > discrepancyThreshold,
          discrepancyThreshold: discrepancyThreshold
        });
      }
      
      // Add Savings comparison without discrepancy
      const psSavings = mockPocketSmithAccounts.find(a => a.id === 3);
      const ynabSavings = mockYnabAccounts.find(a => a.id === "ynab-3");
      
      if (psSavings && ynabSavings) {
        const ynabBalanceInDollars = ynabSavings.balance / 1000;
        const difference = psSavings.current_balance - ynabBalanceInDollars;
        
        comparisons.push({
          pocketsmithAccountId: psSavings.id.toString(),
          pocketsmithAccountName: psSavings.title || psSavings.name || `Account ${psSavings.id}`,
          pocketsmithBalance: psSavings.current_balance,
          pocketsmithBalanceDate: psSavings.current_balance_date,
          ynabAccountId: ynabSavings.id,
          ynabAccountName: ynabSavings.name,
          ynabBalance: ynabBalanceInDollars,
          ynabClearedBalance: ynabSavings.cleared_balance / 1000,
          difference: difference,
          currency: psSavings.currency_code,
          lastUpdated: now,
          hasDiscrepancy: Math.abs(difference) > discrepancyThreshold,
          discrepancyThreshold: discrepancyThreshold
        });
      }
    }
    
    return {
      comparisons,
      summary: {
        totalMappings: comparisons.length,
        discrepancies: comparisons.filter(c => c.hasDiscrepancy).length,
        totalDifference: comparisons.reduce((sum, c) => sum + Math.abs(c.difference), 0),
        lastUpdated: now
      },
      errors: [],
      metadata: {
        fromCache: false,
        discrepancyThreshold: discrepancyThreshold,
        includeClosed: false
      },
      // Legacy fields for backward compatibility
      lastUpdated: now,
      cacheExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    };
  },

  async refreshBalances(): Promise<BalanceComparisonResponse> {
    await delay(2000); // Longer delay to simulate API calls
    
    // Simulate slight balance changes after refresh
    const refreshedComparisons = await this.fetchBalanceComparisons();
    
    // Add small random variations to simulate real-time changes
    refreshedComparisons.comparisons.forEach(comparison => {
      const variation = (Math.random() - 0.5) * 10; // Random variation of ±$5
      comparison.pocketsmithBalance += variation;
      comparison.difference = comparison.pocketsmithBalance - comparison.ynabBalance;
      comparison.hasDiscrepancy = Math.abs(comparison.difference) > comparison.discrepancyThreshold;
      comparison.lastUpdated = new Date().toISOString();
    });
    
    return refreshedComparisons;
  },

  async fetchYNABBudgets(): Promise<BudgetsResponse> {
    await delay(800); // Simulate API delay
    
    return {
      budgets: mockYnabBudgets,
      count: mockYnabBudgets.length,
      timestamp: new Date().toISOString()
    };
  },

  async updateYNABBudgetId(budgetId: string): Promise<void> {
    await delay(1000); // Simulate API delay
    
    // Validate that the budget exists
    const budget = mockYnabBudgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error(`Budget with ID ${budgetId} not found`);
    }
    
    console.log(`Mock: Updated YNAB budget ID to ${budgetId} (${budget.name})`);
    // In a real implementation, this would update the parameter store
  }
};