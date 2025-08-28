import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { BudgetSelector } from '../BudgetSelector';

// Mock the hooks
vi.mock('../../hooks/useAccountMappings', () => ({
  useYNABBudgets: () => ({
    data: {
      budgets: [
        {
          id: 'budget-1',
          name: 'Personal Budget 2024',
          last_modified_on: '2024-01-15T10:30:00Z',
          currency_format: {
            iso_code: 'USD'
          }
        },
        {
          id: 'budget-2',
          name: 'Business Budget 2024',
          last_modified_on: '2024-01-10T09:00:00Z',
          currency_format: {
            iso_code: 'USD'
          }
        }
      ]
    },
    isLoading: false,
    error: null
  }),
  useUpdateYNABBudgetId: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('BudgetSelector', () => {
  it('displays current budget when provided', () => {
    renderWithQueryClient(
      <BudgetSelector currentBudgetId="budget-1" />
    );

    expect(screen.getByText('Current Budget:')).toBeInTheDocument();
    expect(screen.getByText('Personal Budget 2024')).toBeInTheDocument();
  });

  it('shows warning when no budget is selected', () => {
    renderWithQueryClient(
      <BudgetSelector />
    );

    expect(screen.getByText('No budget is currently selected. Please select a budget to continue.')).toBeInTheDocument();
  });

  it('displays budget selection dropdown', () => {
    renderWithQueryClient(
      <BudgetSelector currentBudgetId="budget-1" />
    );

    expect(screen.getByText('Change Budget:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});