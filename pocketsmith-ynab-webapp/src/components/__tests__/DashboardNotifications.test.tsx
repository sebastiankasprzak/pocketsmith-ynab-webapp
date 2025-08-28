import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DashboardNotifications } from '../DashboardNotifications';

const mockNotifications = [
  {
    id: 'balance-discrepancies',
    type: 'warning' as const,
    title: 'Found 2 balance discrepancies',
    message: 'Total discrepancy amount: $25.25. Review and resolve these differences.',
    action: {
      label: 'View Details',
      path: '/balance-comparison'
    },
    dismissible: true
  },
  {
    id: 'sync-error',
    type: 'error' as const,
    title: 'Synchronization failed',
    message: 'Connection timeout to YNAB API. Check your network connection.',
    dismissible: false
  },
  {
    id: 'unmapped-accounts',
    type: 'info' as const,
    title: '3 accounts need mapping',
    message: 'Complete account mappings to enable full synchronization.',
    action: {
      label: 'Configure Mappings',
      path: '/account-mappings'
    },
    dismissible: true
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardNotifications', () => {
  it('renders nothing when no notifications', () => {
    const { container } = renderWithRouter(
      <DashboardNotifications notifications={[]} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders all notifications correctly', () => {
    renderWithRouter(
      <DashboardNotifications notifications={mockNotifications} />
    );
    
    expect(screen.getByText('Found 2 balance discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Synchronization failed')).toBeInTheDocument();
    expect(screen.getByText('3 accounts need mapping')).toBeInTheDocument();
  });

  it('displays correct severity for each notification type', () => {
    renderWithRouter(
      <DashboardNotifications notifications={mockNotifications} />
    );
    
    // Check for alert elements with correct severity classes
    const alerts = document.querySelectorAll('.MuiAlert-root');
    expect(alerts).toHaveLength(3);
    
    // Warning alert
    expect(alerts[0]).toHaveClass('MuiAlert-standardWarning');
    // Error alert
    expect(alerts[1]).toHaveClass('MuiAlert-standardError');
    // Info alert
    expect(alerts[2]).toHaveClass('MuiAlert-standardInfo');
  });

  it('shows action buttons for notifications with actions', () => {
    renderWithRouter(
      <DashboardNotifications notifications={mockNotifications} />
    );
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Configure Mappings')).toBeInTheDocument();
  });

  it('shows dismiss button for dismissible notifications', () => {
    const mockOnDismiss = vi.fn();
    renderWithRouter(
      <DashboardNotifications 
        notifications={mockNotifications} 
        onDismiss={mockOnDismiss}
      />
    );
    
    // Should have close buttons for dismissible notifications
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons).toHaveLength(2); // Two dismissible notifications
  });

  it('does not show dismiss button for non-dismissible notifications', () => {
    const mockOnDismiss = vi.fn();
    renderWithRouter(
      <DashboardNotifications 
        notifications={[mockNotifications[1]]} // sync-error is not dismissible
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = vi.fn();
    renderWithRouter(
      <DashboardNotifications 
        notifications={[mockNotifications[0]]} 
        onDismiss={mockOnDismiss}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('balance-discrepancies');
  });

  it('expands and collapses notification details', () => {
    renderWithRouter(
      <DashboardNotifications notifications={[mockNotifications[0]]} />
    );
    
    // Initially, detailed message should not be visible
    expect(screen.queryByText(/Total discrepancy amount/)).not.toBeInTheDocument();
    
    // Click expand button
    const expandButton = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);
    
    // Now detailed message should be visible
    expect(screen.getByText(/Total discrepancy amount/)).toBeInTheDocument();
    
    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /collapse/i });
    fireEvent.click(collapseButton);
    
    // Detailed message should be hidden again
    expect(screen.queryByText(/Total discrepancy amount/)).not.toBeInTheDocument();
  });

  it('does not show expand button for notifications without detailed messages', () => {
    const notificationWithoutMessage = {
      id: 'simple',
      type: 'info' as const,
      title: 'Simple notification',
      message: '',
      dismissible: true
    };

    renderWithRouter(
      <DashboardNotifications notifications={[notificationWithoutMessage]} />
    );
    
    expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument();
  });

  it('handles multiple expanded notifications independently', () => {
    renderWithRouter(
      <DashboardNotifications notifications={mockNotifications} />
    );
    
    // Expand first notification
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    fireEvent.click(expandButtons[0]);
    
    // First notification should be expanded
    expect(screen.getByText(/Total discrepancy amount/)).toBeInTheDocument();
    
    // Expand second notification (sync-error doesn't have expand button, so this would be the third)
    fireEvent.click(expandButtons[1]);
    
    // Both should be expanded
    expect(screen.getByText(/Total discrepancy amount/)).toBeInTheDocument();
    expect(screen.getByText(/Complete account mappings/)).toBeInTheDocument();
  });
});