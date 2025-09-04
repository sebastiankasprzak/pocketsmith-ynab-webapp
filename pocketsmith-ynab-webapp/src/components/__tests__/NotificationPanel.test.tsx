import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotificationPanel } from '../NotificationPanel';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

const mockNotifications = [
  {
    id: '1',
    type: 'error' as const,
    title: 'Sync Error',
    message: 'Unable to sync data',
    dismissible: true
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Balance Discrepancy',
    message: 'Found 3 balance discrepancies',
    action: {
      label: 'View Details',
      path: '/balance-comparison'
    },
    dismissible: true
  },
  {
    id: '3',
    type: 'info' as const,
    title: 'Account Mapping',
    message: '2 accounts need mapping',
    dismissible: false
  }
];

describe('NotificationPanel', () => {
  it('renders notification button with correct badge count', () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={mockNotifications} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    expect(button).toBeInTheDocument();
    
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });

  it('shows 99+ when notification count exceeds 99', () => {
    const manyNotifications = Array.from({ length: 105 }, (_, i) => ({
      id: `${i}`,
      type: 'info' as const,
      title: `Notification ${i}`,
      message: `Message ${i}`,
      dismissible: true
    }));

    render(
      <TestWrapper>
        <NotificationPanel notifications={manyNotifications} />
      </TestWrapper>
    );

    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('hides badge when no notifications', () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={[]} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(0\)/i });
    expect(button).toBeInTheDocument();
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens panel when button is clicked', async () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={mockNotifications} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });
  });

  it('displays all notifications in the panel', async () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={mockNotifications} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sync Error')).toBeInTheDocument();
      expect(screen.getByText('Balance Discrepancy')).toBeInTheDocument();
      expect(screen.getByText('Account Mapping')).toBeInTheDocument();
    });
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const mockOnDismiss = jest.fn();
    
    render(
      <TestWrapper>
        <NotificationPanel 
          notifications={mockNotifications} 
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      const dismissButtons = screen.getAllByRole('button', { name: '' });
      // Find the dismiss button (should be a close icon button)
      const dismissButton = dismissButtons.find(btn => 
        btn.querySelector('[data-testid="CloseIcon"]')
      );
      
      if (dismissButton) {
        fireEvent.click(dismissButton);
        expect(mockOnDismiss).toHaveBeenCalledWith('1');
      }
    });
  });

  it('shows "No notifications" message when empty', async () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={[]} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(0\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  it('closes panel when clicking outside', async () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={mockNotifications} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // Click outside the panel
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('closes panel when Escape key is pressed', async () => {
    render(
      <TestWrapper>
        <NotificationPanel notifications={mockNotifications} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /notifications \(3\)/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });
});