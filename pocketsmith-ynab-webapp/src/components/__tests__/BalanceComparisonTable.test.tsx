import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { BalanceComparisonTable } from '../BalanceComparisonTable'
import type { BalanceComparison } from '../../types/accounts'

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('BalanceComparisonTable', () => {
  const mockComparisons: BalanceComparison[] = [
    {
      pocketsmithAccountId: '1',
      pocketsmithAccountName: 'Checking Account',
      pocketsmithBalance: 1000.00,
      ynabAccountId: 'ynab-1',
      ynabAccountName: 'Main Checking',
      ynabBalance: 1000.00,
      difference: 0,
      currency: 'USD',
      lastUpdated: '2024-01-01T12:00:00Z',
      hasDiscrepancy: false,
      discrepancyThreshold: 0.01
    },
    {
      pocketsmithAccountId: '2',
      pocketsmithAccountName: 'Savings Account',
      pocketsmithBalance: 5000.50,
      ynabAccountId: 'ynab-2',
      ynabAccountName: 'Emergency Fund',
      ynabBalance: 5010.50,
      difference: -10.00,
      currency: 'USD',
      lastUpdated: '2024-01-01T11:30:00Z',
      hasDiscrepancy: true,
      discrepancyThreshold: 0.01
    },
    {
      pocketsmithAccountId: '3',
      pocketsmithAccountName: 'Credit Card',
      pocketsmithBalance: -250.75,
      ynabAccountId: 'ynab-3',
      ynabAccountName: 'Visa Card',
      ynabBalance: -240.75,
      difference: -10.00,
      currency: 'USD',
      lastUpdated: '2024-01-01T10:15:00Z',
      hasDiscrepancy: true,
      discrepancyThreshold: 0.01
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render loading state', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={[]} loading={true} />
      )

      expect(screen.getByText('Loading balance comparisons...')).toBeInTheDocument()
    })

    it('should render empty state when no comparisons', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={[]} />
      )

      expect(screen.getByText('No balance comparisons found')).toBeInTheDocument()
      expect(screen.getByText('No account mappings are configured for balance comparison')).toBeInTheDocument()
    })

    it('should render statistics summary', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByText('3 Accounts')).toBeInTheDocument()
      expect(screen.getByText('1 Matching')).toBeInTheDocument()
      expect(screen.getByText('2 Discrepancies')).toBeInTheDocument()
      expect(screen.getByText('Total: $20.00')).toBeInTheDocument()
    })

    it('should render comparison table with all accounts', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Check account names
      expect(screen.getByText('Checking Account')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
      expect(screen.getByText('Credit Card')).toBeInTheDocument()

      // Check YNAB account names
      expect(screen.getByText('→ Main Checking')).toBeInTheDocument()
      expect(screen.getByText('→ Emergency Fund')).toBeInTheDocument()
      expect(screen.getByText('→ Visa Card')).toBeInTheDocument()

      // Check balances
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      expect(screen.getByText('$5,000.50')).toBeInTheDocument()
      expect(screen.getByText('-$250.75')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by account name', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const accountHeader = screen.getByRole('button', { name: /sort by account name/i })
      await user.click(accountHeader)

      // Should be sorted alphabetically
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Checking Account')
      expect(rows[2]).toHaveTextContent('Credit Card')
      expect(rows[3]).toHaveTextContent('Savings Account')
    })

    it('should sort by balance difference', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const differenceHeader = screen.getByRole('button', { name: /sort by balance difference/i })
      await user.click(differenceHeader)

      // Should sort by absolute difference (ascending)
      const rows = screen.getAllByRole('row')
      // First should be the one with no difference (0)
      expect(rows[1]).toHaveTextContent('Checking Account')
    })

    it('should reverse sort direction on second click', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const accountHeader = screen.getByRole('button', { name: /sort by account name/i })
      
      // First click - ascending
      await user.click(accountHeader)
      let rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Checking Account')

      // Second click - descending
      await user.click(accountHeader)
      rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Savings Account')
    })
  })

  describe('filtering', () => {
    it('should filter by search term', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const searchInput = screen.getByLabelText(/search account names/i)
      await user.type(searchInput, 'checking')

      // Should show only accounts with "checking" in the name
      expect(screen.getByText('Checking Account')).toBeInTheDocument()
      expect(screen.getByText('→ Main Checking')).toBeInTheDocument()
      expect(screen.queryByText('Savings Account')).not.toBeInTheDocument()
      expect(screen.queryByText('Credit Card')).not.toBeInTheDocument()
    })

    it('should filter by discrepancies only', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const filterSelect = screen.getByLabelText(/filter balance comparisons by type/i)
      await user.click(filterSelect)
      
      const discrepanciesOption = screen.getByText('Discrepancies Only')
      await user.click(discrepanciesOption)

      // Should show only accounts with discrepancies
      expect(screen.queryByText('Checking Account')).not.toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
      expect(screen.getByText('Credit Card')).toBeInTheDocument()
    })

    it('should filter by matching only', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const filterSelect = screen.getByLabelText(/filter balance comparisons by type/i)
      await user.click(filterSelect)
      
      const matchingOption = screen.getByText('Matching Only')
      await user.click(matchingOption)

      // Should show only accounts without discrepancies
      expect(screen.getByText('Checking Account')).toBeInTheDocument()
      expect(screen.queryByText('Savings Account')).not.toBeInTheDocument()
      expect(screen.queryByText('Credit Card')).not.toBeInTheDocument()
    })

    it('should show empty state when no results match filter', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const searchInput = screen.getByLabelText(/search account names/i)
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No balance comparisons found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument()
    })
  })

  describe('discrepancy indicators', () => {
    it('should show success icon for matching balances', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Find the row with matching balances
      const checkingRow = screen.getByText('Checking Account').closest('tr')
      expect(checkingRow).toBeInTheDocument()
      
      // Should have success icon (CheckCircle)
      const successIcon = checkingRow?.querySelector('[data-testid="CheckCircleIcon"]')
      expect(successIcon).toBeInTheDocument()
    })

    it('should show warning icon for discrepancies', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Find the row with discrepancies
      const savingsRow = screen.getByText('Savings Account').closest('tr')
      expect(savingsRow).toBeInTheDocument()
      
      // Should have warning icon
      const warningIcon = savingsRow?.querySelector('[data-testid="WarningIcon"]')
      expect(warningIcon).toBeInTheDocument()
    })

    it('should show difference amounts for discrepancies', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Should show negative difference
      expect(screen.getByText('-$10.00')).toBeInTheDocument()
      
      // Should show dash for matching accounts
      const checkingRow = screen.getByText('Checking Account').closest('tr')
      expect(checkingRow?.textContent).toContain('—')
    })
  })

  describe('responsive design', () => {
    it('should render mobile card view on small screens', () => {
      // Mock mobile breakpoint
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 899.95px)'), // md breakpoint
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Should render cards instead of table
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      
      // Should still show account information in cards
      expect(screen.getByText('Checking Account')).toBeInTheDocument()
      expect(screen.getByText('→ Main Checking')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByRole('search', { name: /balance comparison filters/i })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /balance comparison table/i })).toBeInTheDocument()
      expect(screen.getByRole('table', { name: /balance comparisons between pocketsmith and ynab accounts/i })).toBeInTheDocument()
    })

    it('should have sortable column headers with proper labels', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByRole('button', { name: /sort by account name ascending/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sort by pocketsmith balance ascending/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sort by ynab balance ascending/i })).toBeInTheDocument()
    })

    it('should have proper form labels', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByLabelText(/search account names/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/filter balance comparisons by type/i)).toBeInTheDocument()
    })
  })

  describe('currency formatting', () => {
    it('should format positive amounts correctly', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      expect(screen.getByText('$5,000.50')).toBeInTheDocument()
    })

    it('should format negative amounts correctly', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      expect(screen.getByText('-$250.75')).toBeInTheDocument()
      expect(screen.getByText('-$240.75')).toBeInTheDocument()
    })

    it('should format difference amounts with proper signs', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Negative differences should show without extra minus
      expect(screen.getByText('-$10.00')).toBeInTheDocument()
    })
  })

  describe('time formatting', () => {
    it('should format relative time correctly', () => {
      // Mock current time to be 1 hour after the last update
      const mockNow = new Date('2024-01-01T13:00:00Z')
      vi.setSystemTime(mockNow)

      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Should show relative time
      expect(screen.getByText('1h ago')).toBeInTheDocument()
      expect(screen.getByText('2h ago')).toBeInTheDocument()
      expect(screen.getByText('3h ago')).toBeInTheDocument()
    })
  })

  describe('table highlighting', () => {
    it('should highlight rows with discrepancies', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const savingsRow = screen.getByText('Savings Account').closest('tr')
      const creditRow = screen.getByText('Credit Card').closest('tr')
      
      // Rows with discrepancies should have warning background
      expect(savingsRow).toHaveStyle({ backgroundColor: expect.stringContaining('warning') })
      expect(creditRow).toHaveStyle({ backgroundColor: expect.stringContaining('warning') })
    })

    it('should not highlight rows without discrepancies', () => {
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      const checkingRow = screen.getByText('Checking Account').closest('tr')
      
      // Row without discrepancy should not have warning background
      expect(checkingRow).not.toHaveStyle({ backgroundColor: expect.stringContaining('warning') })
    })
  })

  describe('tooltips', () => {
    it('should show tooltips for status indicators', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Find success icon and hover
      const successIcon = screen.getAllByTestId('CheckCircleIcon')[0]
      await user.hover(successIcon)

      await waitFor(() => {
        expect(screen.getByText('Balances match')).toBeInTheDocument()
      })
    })

    it('should show discrepancy amount in tooltip', async () => {
      const user = userEvent.setup()
      renderWithTheme(
        <BalanceComparisonTable comparisons={mockComparisons} />
      )

      // Find warning icon and hover
      const warningIcon = screen.getAllByTestId('WarningIcon')[0]
      await user.hover(warningIcon)

      await waitFor(() => {
        expect(screen.getByText('Discrepancy: $10.00')).toBeInTheDocument()
      })
    })
  })
})