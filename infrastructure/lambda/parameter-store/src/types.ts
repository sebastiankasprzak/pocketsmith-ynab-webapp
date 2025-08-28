// Types for Parameter Store integration

export interface ExistingAccountMappingConfig {
  mappings: Record<string, string>; // PocketSmith ID -> YNAB ID
  default_account_id?: string;
  strict_mode: boolean;
  created_at?: string;
  auto_generated?: boolean;
}

export interface ParameterStoreCredentials {
  pocketsmithApiKey: string;
  ynabApiKey: string;
  ynabBudgetId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ParameterStoreService {
  getAccountMapping(): Promise<ExistingAccountMappingConfig>;
  updateAccountMapping(config: ExistingAccountMappingConfig): Promise<void>;
  getCredentials(): Promise<ParameterStoreCredentials>;
  validateCredentials(): Promise<ValidationResult>;
}