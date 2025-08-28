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

export interface YNABAccountsResponse {
  data: {
    accounts: YNABAccount[];
    server_knowledge: number;
  };
}

export interface AccountMapping {
  pocketsmithAccountId: string;
  ynabAccountId: string;
}

export interface ExistingAccountMappingConfig {
  mappings: Record<string, string>; // PocketSmith ID -> YNAB ID
  default_account_id?: string;
  strict_mode: boolean;
  created_at?: string;
  auto_generated?: boolean;
}

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
  discrepancyThreshold: number;
}

export interface BalanceComparisonResult {
  comparisons: BalanceComparison[];
  summary: {
    totalMappings: number;
    discrepancies: number;
    totalDifference: number;
    lastUpdated: string;
  };
  errors: Array<{
    accountId: string;
    accountName: string;
    error: string;
  }>;
}

export interface CachedBalanceData {
  pocketsmithAccounts: PocketSmithAccount[];
  ynabAccounts: YNABAccount[];
  timestamp: string;
  ttl: number; // TTL in seconds
}

export interface APIResponse<T> {
  statusCode: number;
  headers: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Content-Type': string;
  };
  body: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}