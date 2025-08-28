export interface PocketSmithAccount {
  id: number;
  name: string;
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