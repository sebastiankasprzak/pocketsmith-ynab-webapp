import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import IOSSyncStatusCard from '../IOSSyncStatusCard';
import type { SyncStateOverview } from '../../services/syncApi';

// Mock the hooks
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn(),
  }),
}));

const mockSyncStateOverview: SyncStateOverview = {
  total_accounts: 5,
  total_processed_transactions: 1250,
  last_activity: '2024-01-15T10:30:00Z',
  accounts: [
    {
      account_id: 'acc1',
      account_name: 'Checking Account',
      processed_transactions_count: 500,
      last_sync: '2024-01-15T10:00:00Z',
      last_updated: '2024-01-15T10:30:00Z',
    },
    {
      account_id: 'acc2',
      account_name: 'Savings Account',
      processed_transactions_count: 750,
      last_sync: '2024-01-15T09:00:00Z',
      last_updated: '2024-01-15T10:30:00Z',
    },
  ],
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSSyncStatusCard', () => {
  it('renders sync status overview correctly', () => {
    renderWithTheme(
      <IOSSyncStatusCard
        syncStateOverview={mockSyncStateOverview}
        loading={false}
      />
    );

    expect(screen.getByText('Sync Status')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Total accounts
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total transactions
  });

  it('shows loading state when loading prop is true', () => {
    renderWithTheme(
      <IOSSyncStatusCard
        syncStateOverview={mockSyncStateOverview}
        loading={true}
      />
    );

    // Should still render the content but with loading indicator
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
  });

  it('displays activity status correctly', () => {
    renderWithTheme(
      <IOSSyncStatusCard
        syncStateOverview={mockSyncStateOverview}
        loading={false}
      />
    );

    // Should show some activity status
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    renderWithTheme(
      <IOSSyncStatusCard
        syncStateOverview={mockSyncStateOverview}
        loading={false}
      />
    );

    // Should render the main sync status section
    expect(screen.getByText('Sync Overview')).toBeInTheDocument();
  });
});