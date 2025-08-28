import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MappingConfigurationCard } from '../MappingConfigurationCard';
import type { YNABAccount, ExistingAccountMappingConfig } from '../../types/accounts';

// Mock data
const mockYnabAccounts: YNABAccount[] = [
  {
    id: 'ynab-1',
    name: 'Checking Account',
    type: 'checking',
    on_budget: true,
    closed: false,
    balance: 100000,
    cleared_balance: 100000,
    uncleared_balance: 0,
    transfer_payee_id: 'transfer-1',
    direct_import_linked: false,
    direct_import_in_error: false,
  },
  {
    id: 'ynab-2',
    name: 'Savings Account',
    type: 'savings',
    on_budget: true,
    closed: false,
    balance: 500000,
    cleared_balance: 500000,
    uncleared_balance: 0,
    transfer_payee_id: 'transfer-2',
    direct_import_linked: false,
    direct_import_in_error: false,
  },
];

const mockConfig: ExistingAccountMappingConfig = {
  mappings: { '1': 'ynab-1' },
  default_account_id: 'ynab-2',
  strict_mode: true,
  created_at: '2024-01-01T00:00:00Z',
  auto_generated: false,
};

describe('MappingConfigurationCard', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it('renders configuration settings correctly', () => {
    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Mapping Configuration')).toBeInTheDocument();
    expect(screen.getAllByText('Default YNAB Account')).toHaveLength(2); // Label and legend
    expect(screen.getByText('Strict Mode')).toBeInTheDocument();
  });

  it('shows current configuration values', () => {
    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    // Check that the default account is selected
    expect(screen.getByDisplayValue('ynab-2')).toBeInTheDocument();
    
    // Check that strict mode is enabled
    const strictModeSwitch = screen.getByRole('switch');
    expect(strictModeSwitch).toBeChecked();
  });

  it('allows changing configuration settings', async () => {
    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    // Change strict mode
    const strictModeSwitch = screen.getByRole('switch');
    fireEvent.click(strictModeSwitch);

    // Should show save button when changes are made
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('calls onSave with correct configuration when save is clicked', async () => {
    mockOnSave.mockResolvedValue(undefined);

    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    // Change strict mode
    const strictModeSwitch = screen.getByRole('switch');
    fireEvent.click(strictModeSwitch);

    // Click save
    const saveButton = await screen.findByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        default_account_id: 'ynab-2',
        strict_mode: false,
      });
    });
  });

  it('shows success message after successful save', async () => {
    mockOnSave.mockResolvedValue(undefined);

    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    // Make a change and save
    const strictModeSwitch = screen.getByRole('switch');
    fireEvent.click(strictModeSwitch);

    const saveButton = await screen.findByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'));

    render(
      <MappingConfigurationCard
        config={mockConfig}
        ynabAccounts={mockYnabAccounts}
        onSave={mockOnSave}
      />
    );

    // Make a change and save
    const strictModeSwitch = screen.getByRole('switch');
    fireEvent.click(strictModeSwitch);

    const saveButton = await screen.findByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});