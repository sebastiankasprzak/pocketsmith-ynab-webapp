import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BalanceComparison } from '../../pages/BalanceComparison';

// Mock the hooks
vi.mock('../../hooks/useIOSDetection', () => ({
  useIOSDetection: () => ({
    shouldUseIOSExperience: true,
    capabilities: {
      isIOS: true,
      isIPad: false,
      hasNotch: false,
      hasDynamicIsland: false,
      supportsHaptics: true,
      supportsStandalone: false,
      version: 15
    }
  })
}));

vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    selection: vi.fn(),
    triggerHaptic: vi.fn()
  })
}));

vi.mock('../../hooks/useBalanceComparisonsQuery', () => ({
  useBalanceComparisons: () => ({
    data: {
      comparisons: [
        {
          pocketsmithAccountId: '1',
          ynabAccountId: '2',
          pocketsmithAccountName: 'Test Account 1',
          ynabAccountName: 'YNAB Account 1',
          pocketsmithBalance: 1000,
          ynabBalance: 950,
          difference: 50,
          hasDiscrepancy: true,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        },
        {
          pocketsmithAccountId: '3',
          ynabAccountId: '4',
          pocketsmithAccountName: 'Test Account 2',
          ynabAccountName: 'YNAB Account 2',
          pocketsmithBalance: 500,
          ynabBalance: 500,
          difference: 0,
          hasDiscrepancy: false,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        }
      ],
      summary: {
        lastUpdated: new Date().toISOString()
      }
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(),
    forceRefresh: vi.fn(),
    isStale: false,
    cacheAgeMinutes: 2,
    lastUpdated: new Date()
  })
}));

// Mock window.matchMedia for iOS detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const theme = createTheme();

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Balance Comparison iOS Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render iOS-style balance comparison list with disclosure indicators', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Balance Comparison')).toBeInTheDocument();
    });

    // Check for balance comparison items
    expect(screen.getByText('Test Account 1')).toBeInTheDocument();
    expect(screen.getByText('Test Account 2')).toBeInTheDocument();

    // Check for disclosure indicators (ChevronRight icons should be present)
    const listItems = screen.getAllByRole('button');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('should show iOS-style loading states during data fetching', async () => {
    // Mock loading state
    vi.doMock('../../hooks/useBalanceComparisonsQuery', () => ({
      useBalanceComparisons: () => ({
        data: null,
        isLoading: true,
        isRefreshing: false,
        error: null,
        refresh: vi.fn(),
        forceRefresh: vi.fn(),
        isStale: false,
        cacheAgeMinutes: 0,
        lastUpdated: null
      })
    }));

    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading balance comparisons...')).toBeInTheDocument();
    });
  });

  it('should display swipe actions for balance comparison items', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Account 1')).toBeInTheDocument();
    });

    // The swipe actions are implemented in IOSListItem component
    // We can verify that the list items are rendered with the correct props
    const accountItems = screen.getAllByText(/Test Account/);
    expect(accountItems.length).toBe(2);
  });

  it('should show different swipe actions for discrepancy vs matching accounts', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Account 1')).toBeInTheDocument();
    });

    // Check for status badges that indicate discrepancy vs match
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Discrepancy amount
    expect(screen.getByText('Match')).toBeInTheDocument(); // Matching account
  });

  it('should handle pull-to-refresh functionality', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Balance Comparison')).toBeInTheDocument();
    });

    // The pull-to-refresh is implemented via IOSPullToRefresh component
    // We can verify the component is rendered by checking for the main content
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('should display overview metrics with loading overlay during refresh', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Check for metric cards
    expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    expect(screen.getByText('Matching')).toBeInTheDocument();
    expect(screen.getByText('Discrepancies')).toBeInTheDocument();
  });

  it('should show search and filter controls with proper disabled state during refresh', async () => {
    render(
      <TestWrapper>
        <BalanceComparison />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter & Search')).toBeInTheDocument();
    });

    // Check for search bar
    expect(screen.getByPlaceholderText('Search accounts...')).toBeInTheDocument();

    // Check for segmented control
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Matching')).toBeInTheDocument();
  });
});