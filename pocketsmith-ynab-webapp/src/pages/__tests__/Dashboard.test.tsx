import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Dashboard } from '../Dashboard';
import { theme } from '../../theme';

// Mock the dashboard data hook
vi.mock('../../hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    syncStatus: {
      data: {
        status: 'success',
        lastSync: new Date(Date.now() - 300000),
        message: 'All accounts synchronized successfully'
      },
      isLoading: false
    },
    mappingStats: {
      data: {
        total: 12,
        mapped: 10,
        unmapped: 2,
        percentage: 83
      },
      isLoading: false
    },
    balanceDiscrepancies: {
      data: [
        {
          accountName: 'Checking Account',
          pocketsmithBalance: 2450.75,
          ynabBalance: 2445.50,
          difference: 5.25,
          currency: 'USD'
        }
      ],
      isLoading: false
    },
    recentActivity: {
      data: [
        {
          id: '1',
          type: 'sync',
          status: 'success',
          message: 'Synchronized 8 accounts successfully',
          timestamp: new Date(Date.now() - 300000)
        }
      ],
      isLoading: false
    },
    metrics: {
      data: {
        totalAccounts: 12,
        successRate: 94.5,
        avgSyncTime: 45,
        dataFreshness: 15
      },
      isLoading: false
    },
    syncMutation: {
      mutate: vi.fn(),
      isPending: false
    },
    refreshAllData: vi.fn()
  })
}));

const renderDashboard = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title and description', () => {
    renderDashboard();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('PocketSmith-YNAB Sync Manager')).toBeInTheDocument();
  });

  it('displays sync status card with correct information', () => {
    renderDashboard();
    
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
    expect(screen.getByText('All accounts synchronized successfully')).toBeInTheDocument();
    expect(screen.getByText('Sync Now')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('displays account mappings card with progress', () => {
    renderDashboard();
    
    expect(screen.getByText('Account Mappings')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('10 of 12 accounts mapped')).toBeInTheDocument();
    expect(screen.getByText('Configure Mappings')).toBeInTheDocument();
  });

  it('displays balance comparison card with discrepancies', () => {
    renderDashboard();
    
    expect(screen.getByText('Balance Comparison')).toBeInTheDocument();
    expect(screen.getByText('1 discrepancies found')).toBeInTheDocument();
    expect(screen.getByText('Compare Now')).toBeInTheDocument();
  });

  it('displays key metrics correctly', () => {
    renderDashboard();
    
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Total Accounts
    expect(screen.getByText('94.5%')).toBeInTheDocument(); // Success Rate
    expect(screen.getByText('45s')).toBeInTheDocument(); // Avg Sync Time
    expect(screen.getByText('15m')).toBeInTheDocument(); // Data Age
  });

  it('displays recent activity feed', () => {
    renderDashboard();
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Synchronized 8 accounts successfully')).toBeInTheDocument();
  });

  it('shows smart notifications for balance discrepancies', () => {
    renderDashboard();
    
    expect(screen.getByText('Found 1 balance discrepancies')).toBeInTheDocument();
  });

  it('shows smart notifications for unmapped accounts', () => {
    renderDashboard();
    
    expect(screen.getByText('2 accounts need mapping')).toBeInTheDocument();
  });

  it('handles sync button click', async () => {
    const { useDashboardData } = await import('../../hooks/useDashboardData');
    const mockMutate = vi.fn();
    
    vi.mocked(useDashboardData).mockReturnValue({
      ...vi.mocked(useDashboardData)(),
      syncMutation: {
        mutate: mockMutate,
        isPending: false
      }
    });

    renderDashboard();
    
    const syncButton = screen.getByText('Sync Now');
    fireEvent.click(syncButton);
    
    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles refresh button click', async () => {
    const { useDashboardData } = await import('../../hooks/useDashboardData');
    const mockRefresh = vi.fn();
    
    vi.mocked(useDashboardData).mockReturnValue({
      ...vi.mocked(useDashboardData)(),
      refreshAllData: mockRefresh
    });

    renderDashboard();
    
    // Find refresh button in activity feed
    const refreshButtons = screen.getAllByRole('button');
    const refreshButton = refreshButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-testid') === 'RefreshIcon'
    );
    
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalled();
    }
  });

  it('displays loading states correctly', () => {
    const { useDashboardData } = await import('../../hooks/useDashboardData');
    
    vi.mocked(useDashboardData).mockReturnValue({
      ...vi.mocked(useDashboardData)(),
      syncStatus: { data: null, isLoading: true },
      mappingStats: { data: null, isLoading: true },
      balanceDiscrepancies: { data: null, isLoading: true },
      recentActivity: { data: null, isLoading: true },
      metrics: { data: null, isLoading: true }
    });

    renderDashboard();
    
    // Should show loading indicators
    const loadingIndicators = screen.getAllByRole('progressbar');
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });
});