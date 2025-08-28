import type { AccountMappingCreate, PocketSmithAccount, YNABAccount } from '../types/accounts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationContext {
  pocketsmithAccounts: PocketSmithAccount[];
  ynabAccounts: YNABAccount[];
  existingMappings: AccountMappingCreate[];
}

export const validateMappings = (
  mappings: AccountMappingCreate[],
  context: ValidationContext
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty mappings
  if (mappings.length === 0) {
    errors.push('At least one account mapping is required');
    return { valid: false, errors, warnings };
  }

  // Create lookup maps for efficient validation
  const pocketsmithAccountMap = new Map(
    context.pocketsmithAccounts.map(acc => [acc.id.toString(), acc])
  );
  const ynabAccountMap = new Map(
    context.ynabAccounts.map(acc => [acc.id, acc])
  );

  // Track used accounts to detect duplicates
  const usedPocketsmithIds = new Set<string>();
  const usedYnabIds = new Set<string>();

  // Add existing mappings to used sets
  context.existingMappings.forEach(mapping => {
    usedPocketsmithIds.add(mapping.pocketsmithAccountId);
    usedYnabIds.add(mapping.ynabAccountId);
  });

  mappings.forEach((mapping, index) => {
    const mappingPrefix = `Mapping ${index + 1}`;

    // Validate required fields
    if (!mapping.pocketsmithAccountId) {
      errors.push(`${mappingPrefix}: PocketSmith account ID is required`);
    }
    if (!mapping.ynabAccountId) {
      errors.push(`${mappingPrefix}: YNAB account ID is required`);
    }

    // Skip further validation if required fields are missing
    if (!mapping.pocketsmithAccountId || !mapping.ynabAccountId) {
      return;
    }

    // Validate PocketSmith account exists
    const pocketsmithAccount = pocketsmithAccountMap.get(mapping.pocketsmithAccountId);
    if (!pocketsmithAccount) {
      errors.push(`${mappingPrefix}: PocketSmith account with ID ${mapping.pocketsmithAccountId} not found`);
    }

    // Validate YNAB account exists
    const ynabAccount = ynabAccountMap.get(mapping.ynabAccountId);
    if (!ynabAccount) {
      errors.push(`${mappingPrefix}: YNAB account with ID ${mapping.ynabAccountId} not found`);
    }

    // Check for duplicate PocketSmith account usage
    if (usedPocketsmithIds.has(mapping.pocketsmithAccountId)) {
      errors.push(`${mappingPrefix}: PocketSmith account is already mapped`);
    } else {
      usedPocketsmithIds.add(mapping.pocketsmithAccountId);
    }

    // Check for duplicate YNAB account usage
    if (usedYnabIds.has(mapping.ynabAccountId)) {
      errors.push(`${mappingPrefix}: YNAB account is already mapped`);
    } else {
      usedYnabIds.add(mapping.ynabAccountId);
    }

    // Add warnings for potential issues
    if (ynabAccount?.closed) {
      warnings.push(`${mappingPrefix}: YNAB account "${ynabAccount.name}" is closed`);
    }

    if (pocketsmithAccount && ynabAccount) {
      // Warn about currency mismatches
      if (pocketsmithAccount.currency_code !== getCurrencyFromYnabAccount(ynabAccount)) {
        warnings.push(
          `${mappingPrefix}: Currency mismatch - PocketSmith (${pocketsmithAccount.currency_code}) vs YNAB account`
        );
      }

      // Warn about account type mismatches
      if (!areAccountTypesCompatible(pocketsmithAccount.type, ynabAccount.type)) {
        warnings.push(
          `${mappingPrefix}: Account type mismatch - PocketSmith (${pocketsmithAccount.type}) vs YNAB (${ynabAccount.type})`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Helper function to extract currency from YNAB account (this might need adjustment based on actual YNAB API)
const getCurrencyFromYnabAccount = (_account: YNABAccount): string => {
  // YNAB doesn't directly expose currency in account data, but we can infer it
  // This is a placeholder - in reality, you'd need to get this from the budget data
  return 'USD'; // Default assumption
};

// Helper function to check if account types are compatible
const areAccountTypesCompatible = (pocketsmithType: string, ynabType: string): boolean => {
  // Define compatible account type mappings
  const compatibilityMap: Record<string, string[]> = {
    'bank': ['checking', 'savings'],
    'credit_card': ['creditCard'],
    'loan': ['lineOfCredit', 'mortgage'],
    'investment': ['otherAsset'],
    'cash': ['cash'],
    'other_asset': ['otherAsset'],
    'other_liability': ['otherLiability']
  };

  const compatibleYnabTypes = compatibilityMap[pocketsmithType.toLowerCase()];
  return compatibleYnabTypes ? compatibleYnabTypes.includes(ynabType) : false;
};

// Validation for individual mapping fields
export const validateMappingField = (
  field: 'pocketsmithAccountId' | 'ynabAccountId',
  value: string,
  context: ValidationContext
): { valid: boolean; error?: string } => {
  if (!value) {
    return { valid: false, error: 'Account selection is required' };
  }

  if (field === 'pocketsmithAccountId') {
    const account = context.pocketsmithAccounts.find(acc => acc.id.toString() === value);
    if (!account) {
      return { valid: false, error: 'Selected PocketSmith account not found' };
    }
  } else {
    const account = context.ynabAccounts.find(acc => acc.id === value);
    if (!account) {
      return { valid: false, error: 'Selected YNAB account not found' };
    }
    if (account.closed) {
      return { valid: false, error: 'Cannot map to a closed YNAB account' };
    }
  }

  return { valid: true };
};