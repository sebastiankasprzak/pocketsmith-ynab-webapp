// Account models based on design document

export interface PocketSmithAccount {
  id: number;
  name?: string; // Legacy field, may not be present
  title: string; // Actual account name field from PocketSmith API
  type: string;
  currency_code: string;
  current_balance: number;
  current_balance_date: string;
  current_balance_in_base_currency: number;
  safe_balance: number;
  safe_balance_in_base_currency: number;
  starting_balance: number;
  starting_balance_date: string;
  created_at: string;
  updated_at: string;
  institution?: {
    id: number;
    name: string;
  };
}

export interface YNABAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'creditCard' | 'cash' | 'lineOfCredit' | 'otherAsset' | 'otherLiability' | 'mortgage';
  on_budget: boolean;
  closed: boolean;
  note?: string;
  balance: number;
  cleared_balance: number;
  uncleared_balance: number;
  transfer_payee_id: string;
  direct_import_linked: boolean;
  direct_import_in_error: boolean;
  last_reconciled_at?: string;
  debt_original_balance?: number;
  debt_interest_rates?: any;
  debt_minimum_payments?: any;
  debt_escrow_amounts?: any;
}

// Existing Parameter Store format
export interface ExistingAccountMappingConfig {
  mappings: Record<string, string>; // PocketSmith ID -> YNAB ID
  default_account_id?: string;
  strict_mode: boolean;
  created_at?: string;
  auto_generated?: boolean;
}

// WebApp display format
export interface AccountMappingDisplay {
  pocketsmithAccountId: string;
  pocketsmithAccountName: string;
  ynabAccountId: string;
  ynabAccountName: string;
  isActive: boolean;
}

// For creating new mappings
export interface AccountMappingCreate {
  pocketsmithAccountId: string;
  ynabAccountId: string;
}

// For updating mapping configuration
export interface MappingConfigUpdate {
  default_account_id?: string;
  strict_mode: boolean;
}

// YNAB Budget types
export interface YNABBudget {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
  date_format: {
    format: string;
  };
  currency_format: {
    iso_code: string;
    example_format: string;
    decimal_digits: number;
    decimal_separator: string;
    symbol_first: boolean;
    group_separator: string;
    currency_symbol: string;
    display_symbol: boolean;
  };
}

// API response types
export interface AccountsResponse {
  pocketsmithAccounts: PocketSmithAccount[];
  ynabAccounts: YNABAccount[];
}

export interface BudgetsResponse {
  budgets: YNABBudget[];
  count: number;
  timestamp: string;
}

export interface MappingsResponse {
  mappings: AccountMappingDisplay[];
  config: ExistingAccountMappingConfig;
}

// Balance comparison models
export interface BalanceComparison {
  pocketsmithAccountId: string;
  pocketsmithAccountName: string;
  pocketsmithBalance: number;
  pocketsmithBalanceDate: string;
  ynabAccountId: string;
  ynabAccountName: string;
  ynabBalance: number;
  ynabClearedBalance: number;
  difference: number;
  currency: string;
  lastUpdated: string;
  hasDiscrepancy: boolean;
  discrepancyThreshold: number; // e.g., 0.01 for 1 cent
}

export interface BalanceComparisonSummary {
  totalMappings: number;
  discrepancies: number;
  totalDifference: number;
  lastUpdated: string;
}

export interface BalanceComparisonMetadata {
  fromCache: boolean;
  discrepancyThreshold: number;
  includeClosed: boolean;
}

export interface BalanceComparisonResponse {
  comparisons: BalanceComparison[];
  summary: BalanceComparisonSummary;
  errors: string[];
  metadata: BalanceComparisonMetadata;
  // Legacy fields for backward compatibility with mock API
  lastUpdated?: string;
  cacheExpiry?: string;
}