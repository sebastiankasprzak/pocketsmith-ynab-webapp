import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { IOSDiscrepancyAlert } from '../IOSDiscrepancyAlert';
import { IOSDiscrepancyBadge } from '../IOSDiscrepancyBadge';
import { IOSDetailDisclosure } from '../IOSDetailDisclosure';
import type { BalanceComparison } from '../../types/accounts';

const theme = createTheme();

const mockComparison: BalanceComparison = {
  pocketsmithAccountId: '123',
  pocketsmithAccountName: 'Test Account',
  pocketsmithBalance: 1000,
  pocketsmithBalanceDate: '2024-01-01',
  ynabAccountId: 'abc',
  ynabAccountName: 'YNAB Test Account',
  ynabBalance: 950,
  ynabClearedBalance: 950,
  difference: 50,
  currency: 'USD',
  lastUpdated: '2024-01-01T12:00:00Z',
  hasDiscrepancy: true,
  discrepancyThreshold: 0.01
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('iOS Discrepancy Components', () => {
  describe('IOSDiscrepancyAlert', () => {
    it('renders critical discrepancy alert', () => {
      renderWithTheme(
        <IOSDiscrepancyAlert
          amount={1500}
          currency="USD"
          type="critical"
          direction="positive"
          accountName="Test Account"
        />
      );

      expect(screen.getByText('Critical Discrepancy')).toBeInTheDocument();
      expect(screen.getByText(/Large balance difference requires immediate attention/)).toBeInTheDocument();
    });

    it('renders minor discrepancy alert', () => {
      renderWithTheme(
        <IOSDiscrepancyAlert
          amount={5}
          currency="USD"
          type="minor"
          direction="negative"
          accountName="Test Account"
        />
      );

      expect(screen.getByText('Minor Discrepancy')).toBeInTheDocument();
      expect(screen.getByText(/Small balance difference detected/)).toBeInTheDocument();
    });
  });

  describe('IOSDiscrepancyBadge', () => {
    it('renders matching balance badge', () => {
      renderWithTheme(
        <IOSDiscrepancyBadge
          amount={0}
          currency="USD"
          level="none"
        />
      );

      expect(screen.getByText('Match')).toBeInTheDocument();
    });

    it('renders discrepancy badge with amount', () => {
      renderWithTheme(
        <IOSDiscrepancyBadge
          amount={50}
          currency="USD"
          level="moderate"
        />
      );

      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
  });

  describe('IOSDetailDisclosure', () => {
    it('renders comparison details', () => {
      renderWithTheme(
        <IOSDetailDisclosure
          comparison={mockComparison}
        />
      );

      expect(screen.getByText('Test Account')).toBeInTheDocument();
      expect(screen.getByText('→ YNAB Test Account')).toBeInTheDocument();
    });

    it('shows discrepancy badge for accounts with differences', () => {
      renderWithTheme(
        <IOSDetailDisclosure
          comparison={mockComparison}
        />
      );

      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
  });
});