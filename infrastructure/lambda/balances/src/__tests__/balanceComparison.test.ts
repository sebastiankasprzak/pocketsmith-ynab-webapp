import { PocketSmithAccount, YNABAccount } from '../types';

// Mock the handler function for testing balance comparison logic
function convertYNABBalanceToDecimal(milliunits: number): number {
  return milliunits / 1000;
}

function createBalanceComparison(
  psAccount: PocketSmithAccount,
  ynabAccount: YNABAccount,
  discrepancyThreshold: number = 0.01
) {
  const ynabBalance = convertYNABBalanceToDecimal(ynabAccount.balance);
  const ynabClearedBalance = convertYNABBalanceToDecimal(ynabAccount.cleared_balance);
  const difference = Math.abs(psAccount.current_balance - ynabBalance);
  
  return {
    pocketsmithAccountId: psAccount.id.toString(),
    pocketsmithAccountName: psAccount.title || psAccount.name || `Account ${psAccount.id}`,
    pocketsmithBalance: psAccount.current_balance,
    pocketsmithBalanceDate: psAccount.current_balance_date,
    ynabAccountId: ynabAccount.id,
    ynabAccountName: ynabAccount.name,
    ynabBalance,
    ynabClearedBalance,
    difference,
    currency: psAccount.currency_code,
    lastUpdated: new Date().toISOString(),
    hasDiscrepancy: difference > discrepancyThreshold,
    discrepancyThreshold
  };
}

describe('Balance Comparison Logic', () => {
  const mockPSAccount: PocketSmithAccount = {
    id: 12345,
    name: 'Test Checking Account',
    type: 'bank',
    currency_code: 'USD',
    current_balance: 1000.50,
    current_balance_date: '2024-01-15',
    current_balance_in_base_currency: 1000.50,
    safe_balance: 950.00,
    safe_balance_in_base_currency: 950.00,
    starting_balance: 0,
    starting_balance_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  };

  const mockYNABAccount: YNABAccount = {
    id: 'ynab-account-123',
    name: 'Test Checking Account',
    type: 'checking',
    on_budget: true,
    closed: false,
    balance: 1000500, // $1000.50 in milliunits
    cleared_balance: 950000, // $950.00 in milliunits
    uncleared_balance: 50500, // $50.50 in milliunits
    transfer_payee_id: 'payee-123',
    direct_import_linked: false,
    direct_import_in_error: false
  };

  describe('convertYNABBalanceToDecimal', () => {
    it('should convert YNAB milliunits to decimal correctly', () => {
      expect(convertYNABBalanceToDecimal(1000500)).toBe(1000.50);
      expect(convertYNABBalanceToDecimal(0)).toBe(0);
      expect(convertYNABBalanceToDecimal(-50000)).toBe(-50.00);
      expect(convertYNABBalanceToDecimal(1)).toBe(0.001);
    });
  });

  describe('createBalanceComparison', () => {
    it('should create correct balance comparison with no discrepancy', () => {
      const comparison = createBalanceComparison(mockPSAccount, mockYNABAccount);

      expect(comparison.pocketsmithAccountId).toBe('12345');
      expect(comparison.pocketsmithAccountName).toBe('Test Checking Account');
      expect(comparison.pocketsmithBalance).toBe(1000.50);
      expect(comparison.ynabAccountId).toBe('ynab-account-123');
      expect(comparison.ynabAccountName).toBe('Test Checking Account');
      expect(comparison.ynabBalance).toBe(1000.50);
      expect(comparison.ynabClearedBalance).toBe(950.00);
      expect(comparison.difference).toBe(0);
      expect(comparison.hasDiscrepancy).toBe(false);
      expect(comparison.discrepancyThreshold).toBe(0.01);
      expect(comparison.currency).toBe('USD');
    });

    it('should detect discrepancy when balances differ significantly', () => {
      const ynabAccountWithDifference: YNABAccount = {
        ...mockYNABAccount,
        balance: 1005000 // $1005.00 in milliunits
      };

      const comparison = createBalanceComparison(mockPSAccount, ynabAccountWithDifference);

      expect(comparison.difference).toBe(4.50);
      expect(comparison.hasDiscrepancy).toBe(true);
    });

    it('should not detect discrepancy when difference is within threshold', () => {
      const ynabAccountWithSmallDifference: YNABAccount = {
        ...mockYNABAccount,
        balance: 1000490 // $1000.49 in milliunits (1 cent difference)
      };

      const comparison = createBalanceComparison(mockPSAccount, ynabAccountWithSmallDifference, 0.01);

      expect(comparison.difference).toBeCloseTo(0.01, 2);
      expect(comparison.hasDiscrepancy).toBe(false);
    });

    it('should use custom discrepancy threshold', () => {
      const ynabAccountWithSmallDifference: YNABAccount = {
        ...mockYNABAccount,
        balance: 1000490 // $1000.49 in milliunits (1 cent difference)
      };

      const comparison = createBalanceComparison(mockPSAccount, ynabAccountWithSmallDifference, 0.005);

      expect(comparison.difference).toBeCloseTo(0.01, 2);
      expect(comparison.hasDiscrepancy).toBe(true);
      expect(comparison.discrepancyThreshold).toBe(0.005);
    });

    it('should handle negative balances correctly', () => {
      const psAccountNegative: PocketSmithAccount = {
        ...mockPSAccount,
        current_balance: -500.25
      };

      const ynabAccountNegative: YNABAccount = {
        ...mockYNABAccount,
        balance: -500250 // -$500.25 in milliunits
      };

      const comparison = createBalanceComparison(psAccountNegative, ynabAccountNegative);

      expect(comparison.pocketsmithBalance).toBe(-500.25);
      expect(comparison.ynabBalance).toBe(-500.25);
      expect(comparison.difference).toBe(0);
      expect(comparison.hasDiscrepancy).toBe(false);
    });
  });
});