import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IOSMetricCard } from '../IOSMetricCard';
import { AccountTree } from '@mui/icons-material';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSMetricCard', () => {
  it('renders basic metric card correctly', () => {
    renderWithTheme(
      <IOSMetricCard
        value="42"
        label="Test Metric"
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    renderWithTheme(
      <IOSMetricCard
        value="100"
        label="Accounts"
        icon={<AccountTree data-testid="metric-icon" />}
      />
    );

    expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
  });

  it('renders with subtitle when provided', () => {
    renderWithTheme(
      <IOSMetricCard
        value="95%"
        label="Success Rate"
        subtitle="Last 30 days"
      />
    );

    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = vi.fn();
    
    renderWithTheme(
      <IOSMetricCard
        value="25"
        label="Clickable Metric"
        onClick={handleClick}
      />
    );

    const card = screen.getByText('25').closest('.ios-metric-card');
    expect(card).toBeInTheDocument();
    
    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies different colors correctly', () => {
    const { rerender } = renderWithTheme(
      <IOSMetricCard
        value="100"
        label="Success"
        color="success"
      />
    );

    let valueElement = screen.getByText('100');
    expect(valueElement).toHaveStyle({ color: '#34C759' });

    rerender(
      <ThemeProvider theme={theme}>
        <IOSMetricCard
          value="50"
          label="Warning"
          color="warning"
        />
      </ThemeProvider>
    );

    valueElement = screen.getByText('50');
    expect(valueElement).toHaveStyle({ color: '#FF9500' });
  });

  it('renders without onClick when not provided', () => {
    renderWithTheme(
      <IOSMetricCard
        value="10"
        label="Static Metric"
      />
    );

    const card = screen.getByText('10').closest('.ios-metric-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ cursor: 'default' });
  });
});