# Balance Comparison Update: YNAB Cleared Balance

## Summary

Updated the balance comparison functionality to compare PocketSmith posted balances against YNAB cleared balances instead of total balances that include uncleared transactions.

## Problem

Previously, the balance comparison was comparing:
- **PocketSmith**: `current_balance` (posted transactions only)
- **YNAB**: `balance` (includes uncleared transactions)

This created false discrepancies because PocketSmith's posted balance only includes cleared/posted transactions, while YNAB's total balance includes pending/uncleared transactions.

## Solution

Now the balance comparison compares:
- **PocketSmith**: `current_balance` (posted transactions only)
- **YNAB**: `cleared_balance` (cleared transactions only)

This provides an accurate comparison between equivalent balance types.

## Changes Made

### Backend (Lambda Function)
**File**: `infrastructure/lambda/balances/src/index.ts`

1. **Line 58**: Updated difference calculation to use `ynabClearedBalance` instead of `ynabBalance`
   ```typescript
   // Before
   const difference = Math.abs(psAccount.current_balance - ynabBalance);
   
   // After  
   const difference = Math.abs(psAccount.current_balance - ynabClearedBalance);
   ```

2. **Line 75**: Updated return object to use cleared balance for comparison display
   ```typescript
   // Before
   ynabBalance,
   
   // After
   ynabBalance: ynabClearedBalance, // Use cleared balance for comparison
   ```

### Frontend (React Components)
**File**: `pocketsmith-ynab-webapp/src/components/BalanceComparisonTable.tsx`

1. **Column Header**: Updated YNAB balance column header from "YNAB Balance" to "YNAB Cleared Balance"

2. **Tooltips**: Added explanatory tooltips:
   - PocketSmith: "PocketSmith posted balance includes only cleared/posted transactions"
   - YNAB: "YNAB cleared balance excludes uncleared transactions, matching PocketSmith's posted balance approach"

3. **Mobile View**: Updated mobile card display to show "YNAB Cleared:" instead of "YNAB:"

4. **Accessibility**: Updated aria-labels to reflect cleared balance comparison

**File**: `pocketsmith-ynab-webapp/src/pages/BalanceComparison.tsx`

1. **Page Description**: Updated from "Compare account balances between PocketSmith and YNAB" to "Compare PocketSmith posted balances with YNAB cleared balances"

### Mock API
**File**: `pocketsmith-ynab-webapp/src/services/mockApi.ts`

1. **Balance Calculation**: Updated all mock balance comparisons to use `cleared_balance` instead of `balance`
2. **Variable Names**: Updated variable names to reflect cleared balance usage

### Documentation
**Files**: `README.md`, `.kiro/steering/product.md`

1. Updated feature descriptions to clarify the comparison is between posted and cleared balances

## Testing

To test the changes:

1. **Development Environment**: 
   ```bash
   cd pocketsmith-ynab-webapp
   npm run dev
   ```
   Navigate to the Balance Comparison page and verify:
   - Column headers show "YNAB Cleared Balance"
   - Tooltips explain the balance types
   - Mobile view shows "YNAB Cleared:"

2. **Production Deployment**:
   ```bash
   ./deploy_wrapper.sh
   ```
   Test with real account data to ensure cleared balance comparison works correctly.

## Impact

- **More Accurate Comparisons**: Eliminates false discrepancies caused by uncleared transactions
- **Better User Understanding**: Clear labeling helps users understand what's being compared
- **Consistent Logic**: Both systems now compare equivalent balance types (posted/cleared only)

## Backward Compatibility

The API response structure remains the same - the `ynabBalance` field now contains the cleared balance value, and `ynabClearedBalance` is still available for reference. This ensures existing integrations continue to work while providing the corrected comparison logic.