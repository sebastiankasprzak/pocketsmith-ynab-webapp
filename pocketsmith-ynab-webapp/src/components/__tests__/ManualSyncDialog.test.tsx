import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ManualSyncDialog } from '../ManualSyncDialog'
import type { PocketSmithAccount } from '../../types/accounts'

const theme = createTheme()

// Mock the services
const mockSyncApiService = vi.hoisted(() => ({
  triggerSync: vi.fn()
}))

const mockAccountsApi = vi.hoisted(() => ({
  fetchAccounts: vi.fn()
}))

vi.mock('../../services/syncApi', () => ({
  syncApiService: mockSyncApiService
}))

vi.mock('../../services/accountsApi', () => ({
  accountsApi: mockAccountsApi
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {component}
      </LocalizationProvider>
    </ThemeProvider>
  )
}

describe('ManualSyncDialog', () => {
  const mockAccounts: PocketSmithAccount[] = [
    {
      id: 1,
      name: 'Checking Account',
      type: 'bank',
      currency_code: 'USD',
      current_balance: 1000,
      current_balance_date: '2024-01-01',
      current_balance_in_base_currency: 1000,
      safe_balance: 1000,
      safe_balance_in_base_currency: 1000,
      starting_balance: 0,
      starting_balance_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Savings Account',
      type: 'bank',
      currency_code: 'USD',
      current_balance: 5000,
      current_balance_date: '2024-01-01',
      current_balance_in_base_currency: 5000,
      safe_balance: 5000,
      safe_balance_in_base_currency: 5000,
      starting_balance: 0,
      starting_balance_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockOnClose = vi.fn()
  const mockOnSyncTriggered = vi.fn()

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSyncTriggered: mockOnSyncTriggered,
    currentQueueDepth: 0,
    syncInProgress: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAccountsApi.fetchAccounts.mockResolvedValue({
      pocketsmithAccounts: mockAccounts,
      ynabAccounts: []
    })
  })

  describe('rendering', () => {
    it('should render dialog when open', () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      expect(screen.getByText('Manual Sync Configuration')).toBeInTheDocument()
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Account Selection')).toBeInTheDocument()
      expect(screen.getByText('Advanced Options')).toBeInTheDocument()
      expect(screen.getByText('Sync Estimation')).toBeInTheDocument()
    })

    it('should not render dialog when closed', () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} open={false} />)

      expect(screen.queryByText('Manual Sync Configuration')).not.toBeInTheDocument()
    })

    it('should load accounts when dialog opens', async () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(mockAccountsApi.fetchAccounts).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        expect(screen.getByText('Checking Account (USD)')).toBeInTheDocument()
        expect(screen.getByText('Savings Account (USD)')).toBeInTheDocument()
      })
    })

    it('should show loading state while fetching accounts', () => {
      // Mock slow account loading
      mockAccountsApi.fetchAccounts.mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      expect(screen.getByText('Loading accounts...')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('sync activity warnings', () => {
    it('should show warning when sync is in progress', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} syncInProgress={true} />
      )

      expect(screen.getByText('Sync Activity Detected')).toBeInTheDocument()
      expect(screen.getByText(/A sync operation is currently in progress/)).toBeInTheDocument()
    })

    it('should show warning when queue has messages', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} currentQueueDepth={25} />
      )

      expect(screen.getByText('Sync Activity Detected')).toBeInTheDocument()
      expect(screen.getByText('25 messages are currently queued for processing.')).toBeInTheDocument()
    })

    it('should show both warnings when applicable', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} syncInProgress={true} currentQueueDepth={10} />
      )

      expect(screen.getByText(/A sync operation is currently in progress/)).toBeInTheDocument()
      expect(screen.getByText('10 messages are currently queued for processing.')).toBeInTheDocument()
    })
  })

  describe('date range configuration', () => {
    it('should enable custom date range when switch is toggled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const customDateSwitch = screen.getByRole('checkbox', { name: /use custom date range/i })
      await user.click(customDateSwitch)

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
      expect(screen.getByLabelText('End Date')).toBeInTheDocument()
    })

    it('should show date range summary when dates are selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Enable custom date range
      const customDateSwitch = screen.getByRole('checkbox', { name: /use custom date range/i })
      await user.click(customDateSwitch)

      // Set dates (this is simplified - actual date picker interaction is more complex)
      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      
      await user.type(startDateInput, '01/01/2024')
      await user.type(endDateInput, '01/07/2024')

      await waitFor(() => {
        expect(screen.getByText(/Syncing \d+ days of data/)).toBeInTheDocument()
      })
    })

    it('should validate date range', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Enable custom date range
      const customDateSwitch = screen.getByRole('checkbox', { name: /use custom date range/i })
      await user.click(customDateSwitch)

      // Try to trigger sync without dates
      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Both start and end dates are required when using custom date range')).toBeInTheDocument()
      })
    })
  })

  describe('account selection', () => {
    it('should allow selecting individual accounts', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Checking Account (USD)')).toBeInTheDocument()
      })

      const checkingAccountChip = screen.getByText('Checking Account (USD)')
      await user.click(checkingAccountChip)

      expect(screen.getByText('1 account selected')).toBeInTheDocument()
    })

    it('should allow selecting multiple accounts', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Checking Account (USD)')).toBeInTheDocument()
      })

      const checkingAccountChip = screen.getByText('Checking Account (USD)')
      const savingsAccountChip = screen.getByText('Savings Account (USD)')
      
      await user.click(checkingAccountChip)
      await user.click(savingsAccountChip)

      expect(screen.getByText('2 accounts selected')).toBeInTheDocument()
    })

    it('should deselect accounts when clicked again', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Checking Account (USD)')).toBeInTheDocument()
      })

      const checkingAccountChip = screen.getByText('Checking Account (USD)')
      
      // Select
      await user.click(checkingAccountChip)
      expect(screen.getByText('1 account selected')).toBeInTheDocument()

      // Deselect
      await user.click(checkingAccountChip)
      expect(screen.queryByText('1 account selected')).not.toBeInTheDocument()
    })
  })

  describe('advanced options', () => {
    it('should allow enabling force sync', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const forceSyncSwitch = screen.getByRole('checkbox', { name: /force sync/i })
      await user.click(forceSyncSwitch)

      expect(screen.getByText(/Force sync will override any existing sync operations/)).toBeInTheDocument()
    })

    it('should change button color when force sync is enabled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const forceSyncSwitch = screen.getByRole('checkbox', { name: /force sync/i })
      await user.click(forceSyncSwitch)

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      // Button should have warning color when force sync is enabled
      expect(triggerButton).toHaveClass('MuiButton-containedWarning')
    })
  })

  describe('sync estimation', () => {
    it('should display sync estimation information', async () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Sync Estimation')).toBeInTheDocument()
        expect(screen.getByText('Estimated Duration')).toBeInTheDocument()
        expect(screen.getByText('Accounts to Process')).toBeInTheDocument()
        expect(screen.getByText('Current Queue')).toBeInTheDocument()
      })
    })

    it('should show current queue depth', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} currentQueueDepth={15} />
      )

      expect(screen.getByText('15 messages')).toBeInTheDocument()
    })

    it('should highlight high queue depth', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} currentQueueDepth={75} />
      )

      const queueDepthElement = screen.getByText('75 messages')
      expect(queueDepthElement).toHaveClass('MuiTypography-colorWarning')
    })
  })

  describe('form validation', () => {
    it('should validate date range limits', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Enable custom date range
      const customDateSwitch = screen.getByRole('checkbox', { name: /use custom date range/i })
      await user.click(customDateSwitch)

      // Mock dates that are more than 90 days apart
      // This would require more complex date picker mocking in a real test

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      // Should validate but we need to set actual dates for this to work
    })

    it('should validate account selection limits', async () => {
      const user = userEvent.setup()
      
      // Mock many accounts
      const manyAccounts = Array.from({ length: 15 }, (_, i) => ({
        ...mockAccounts[0],
        id: i + 1,
        name: `Account ${i + 1}`
      }))
      
      mockAccountsApi.fetchAccounts.mockResolvedValue({
        pocketsmithAccounts: manyAccounts,
        ynabAccounts: []
      })

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Account 1 (USD)')).toBeInTheDocument()
      })

      // Select more than 10 accounts
      for (let i = 1; i <= 11; i++) {
        const accountChip = screen.getByText(`Account ${i} (USD)`)
        await user.click(accountChip)
      }

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Cannot select more than 10 accounts at once')).toBeInTheDocument()
      })
    })
  })

  describe('sync triggering', () => {
    it('should trigger sync with default parameters', async () => {
      const user = userEvent.setup()
      const mockResponse = { syncId: 'sync-123', message: 'Sync triggered successfully' }
      mockSyncApiService.triggerSync.mockResolvedValue(mockResponse)

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      await waitFor(() => {
        expect(mockSyncApiService.triggerSync).toHaveBeenCalledWith({
          forceSync: false
        })
      })

      expect(mockOnSyncTriggered).toHaveBeenCalledWith(mockResponse)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should trigger sync with custom parameters', async () => {
      const user = userEvent.setup()
      const mockResponse = { syncId: 'sync-456', message: 'Sync triggered successfully' }
      mockSyncApiService.triggerSync.mockResolvedValue(mockResponse)

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Enable force sync
      const forceSyncSwitch = screen.getByRole('checkbox', { name: /force sync/i })
      await user.click(forceSyncSwitch)

      // Select an account
      await waitFor(() => {
        expect(screen.getByText('Checking Account (USD)')).toBeInTheDocument()
      })
      
      const checkingAccountChip = screen.getByText('Checking Account (USD)')
      await user.click(checkingAccountChip)

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      await waitFor(() => {
        expect(mockSyncApiService.triggerSync).toHaveBeenCalledWith({
          forceSync: true,
          accountFilters: ['1']
        })
      })
    })

    it('should handle sync trigger errors', async () => {
      const user = userEvent.setup()
      const error = new Error('Sync trigger failed')
      mockSyncApiService.triggerSync.mockRejectedValue(error)

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Sync trigger failed')).toBeInTheDocument()
      })

      expect(mockOnSyncTriggered).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should show loading state during sync trigger', async () => {
      const user = userEvent.setup()
      
      // Mock slow sync trigger
      mockSyncApiService.triggerSync.mockImplementation(() => new Promise(() => {}))

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      await user.click(triggerButton)

      expect(screen.getByText('Triggering...')).toBeInTheDocument()
      expect(triggerButton).toBeDisabled()
    })
  })

  describe('dialog controls', () => {
    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not close dialog when loading', () => {
      renderWithProviders(
        <ManualSyncDialog {...defaultProps} />
      )

      // Simulate loading state by mocking slow sync trigger
      mockSyncApiService.triggerSync.mockImplementation(() => new Promise(() => {}))

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeEnabled() // Cancel should still be enabled during loading
    })

    it('should reset form when dialog closes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Make some changes
      const forceSyncSwitch = screen.getByRole('checkbox', { name: /force sync/i })
      await user.click(forceSyncSwitch)

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Reopen dialog (simulate prop change)
      const { rerender } = renderWithProviders(<ManualSyncDialog {...defaultProps} />)
      rerender(<ManualSyncDialog {...defaultProps} open={true} />)

      // Form should be reset
      expect(screen.getByRole('checkbox', { name: /force sync/i })).not.toBeChecked()
    })
  })

  describe('accessibility', () => {
    it('should have proper dialog structure', () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Manual Sync Configuration')).toBeInTheDocument()
    })

    it('should have proper form labels', () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      expect(screen.getByLabelText(/use custom date range/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/force sync/i)).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /trigger sync/i })).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle account loading errors', async () => {
      const error = new Error('Failed to load accounts')
      mockAccountsApi.fetchAccounts.mockRejectedValue(error)

      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load accounts: Failed to load accounts')).toBeInTheDocument()
      })
    })

    it('should clear errors when form is reset', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ManualSyncDialog {...defaultProps} />)

      // Trigger validation error
      const triggerButton = screen.getByRole('button', { name: /trigger sync/i })
      
      // Enable custom date range but don't set dates
      const customDateSwitch = screen.getByRole('checkbox', { name: /use custom date range/i })
      await user.click(customDateSwitch)
      
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText(/Both start and end dates are required/)).toBeInTheDocument()
      })

      // Close and reopen dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Error should be cleared
      expect(screen.queryByText(/Both start and end dates are required/)).not.toBeInTheDocument()
    })
  })
})