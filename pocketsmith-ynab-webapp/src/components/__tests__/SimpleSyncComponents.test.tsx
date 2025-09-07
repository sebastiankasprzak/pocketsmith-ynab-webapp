import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { SimpleSyncOverview } from '../SimpleSyncOverview';
import { SimpleRecentActivity } from '../SimpleRecentActivity';
import { SimpleAccountSync } from '../SimpleAccountSync';
import { createTheme } from '@mui/material/styles';
import { vi } from 'vitest';

const mockSyncStateOverview = {
  total_accounts: 5,
  total_processed_transactions: 1250,
  last_activity: '2025-01-07T10:30:00Z',
  accounts: [
    {
      account_id: 'acc1',
      account_name: 'Test Account 1',
      last_sync: '2025-01-07T10:00:00Z',
      processed_transactions_count: 500,
      last_updated: '2025-01-07T10:30:00Z'
    },
    {
      account_id: 'acc2',
      account_name: 'Test Account 2',
      last_sync: null,
      processed_transactions_count: 750,
      last_updated: '2025-01-07T09:00:00Z'
    }
  ]
};

const mockRecentActivity = [
  {
    account_id: 'acc1',
    account_name: 'Test Account 1',
    count: 25,
    recent_transactions: [
      {
        transaction_id: 'tx1',
        processed_at: '2025-01-07T10:00:00Z'
      }
    ]
  }
];

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SimpleSyncOverview', () => {
  it('renders sync overview without errors', () => {
    const mockOnManualSync = vi.fn();
    
    renderWithTheme(
      <SimpleSyncOverview
        syncStateOverview={mockSyncStateOverview}
        onManualSync={mockOnManualSync}
        isRefreshing={false}
        isSyncTriggering={false}
      />
    );

    expect(screen.getByText('Sync Overview')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // total accounts
    expect(screen.getByText('Start Manual Sync')).toBeInTheDocument();
  });
});

describe('SimpleRecentActivity', () => {
  it('renders recent activity without errors', () => {
    renderWithTheme(
      <SimpleRecentActivity recentActivity={mockRecentActivity} />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // total transactions
  });

  it('shows empty state when no activity', () => {
    renderWithTheme(
      <SimpleRecentActivity recentActivity={[]} />
    );

    expect(screen.getByText('No recent transaction activity')).toBeInTheDocument();
  });
});

describe('SimpleAccountSync', () => {
  it('renders account sync details without errors', () => {
    renderWithTheme(
      <SimpleAccountSync accounts={mockSyncStateOverview.accounts} />
    );

    expect(screen.getByText('Account Sync Details')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total accounts
    expect(screen.getByText('Test Account 1')).toBeInTheDocument();
    expect(screen.getByText('Test Account 2')).toBeInTheDocument();
  });

  it('shows empty state when no accounts', () => {
    renderWithTheme(
      <SimpleAccountSync accounts={[]} />
    );

    expect(screen.getByText('No account data available')).toBeInTheDocument();
  });
});