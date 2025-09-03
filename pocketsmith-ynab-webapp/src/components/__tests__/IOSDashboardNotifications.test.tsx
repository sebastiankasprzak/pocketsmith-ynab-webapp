import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IOSDashboardNotifications } from '../IOSDashboardNotifications';

import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useIOSDetection', () => ({
  useIOSDetection: () => ({ shouldUseIOSExperience: true })
}));

vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ 
    triggerHaptic: vi.fn(),
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn()
  })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('IOSDashboardNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders nothing when no notifications', () => {
    const { container } = render(
      <TestWrapper>
        <IOSDashboardNotifications notifications={[]} />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders iOS-style notifications correctly', () => {
    const notifications = [
      {
        id: '1',
        type: 'warning' as const,
        title: 'Balance Discrepancy',
        message: 'Found 2 balance discrepancies',
        dismissible: true
      },
      {
        id: '2',
        type: 'success' as const,
        title: 'Sync Complete',
        message: 'All accounts synchronized successfully',
        dismissible: false
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications notifications={notifications} />
      </TestWrapper>
    );

    expect(screen.getByText('Balance Discrepancy')).toBeInTheDocument();
    expect(screen.getByText('Found 2 balance discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Sync Complete')).toBeInTheDocument();
    expect(screen.getByText('All accounts synchronized successfully')).toBeInTheDocument();
  });

  it('shows action buttons for notifications with actions', () => {
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Account Mapping Required',
        message: 'Some accounts need mapping',
        action: {
          label: 'Configure Mappings',
          path: '/account-mappings'
        },
        dismissible: true
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications notifications={notifications} />
      </TestWrapper>
    );

    const actionButton = screen.getByText('Configure Mappings');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockNavigate).toHaveBeenCalledWith('/account-mappings');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'warning' as const,
        title: 'Test Notification',
        message: 'This is a test',
        dismissible: true
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    // Find the close button (it should be an icon button)
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('falls back to standard notifications when not iOS', () => {
    // Mock non-iOS detection
    vi.doMock('../../hooks/useIOSDetection', () => ({
      useIOSDetection: () => ({ shouldUseIOSExperience: false })
    }));

    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test',
        dismissible: true
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications notifications={notifications} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  it('auto-dismisses notifications after 10 seconds by default', async () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Auto Dismiss Test',
        message: 'This should auto-dismiss',
        dismissible: true
      }
    ];

    act(() => {
      render(
        <TestWrapper>
          <IOSDashboardNotifications 
            notifications={notifications} 
            onDismiss={mockOnDismiss}
          />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Auto Dismiss Test')).toBeInTheDocument();

    // Fast-forward time by 10 seconds
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('1');
    });
  });

  it('respects custom autoHideDuration', async () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Custom Duration Test',
        message: 'This should auto-dismiss in 5 seconds',
        dismissible: true
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          onDismiss={mockOnDismiss}
          autoHideDuration={5000}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Custom Duration Test')).toBeInTheDocument();

    // Fast-forward time by 4.9 seconds - should not dismiss yet
    act(() => {
      vi.advanceTimersByTime(4900);
    });

    expect(mockOnDismiss).not.toHaveBeenCalled();

    // Fast-forward the remaining time
    act(() => {
      vi.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('1');
    });
  });

  it('does not auto-dismiss notifications with dismissible: false', async () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Persistent Notification',
        message: 'This should not auto-dismiss',
        dismissible: false
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Persistent Notification')).toBeInTheDocument();

    // Fast-forward time by 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Should not have been dismissed
    expect(mockOnDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('Persistent Notification')).toBeInTheDocument();
  });

  it('clears timers when notification is manually dismissed', async () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Manual Dismiss Test',
        message: 'This will be manually dismissed',
        dismissible: true
      }
    ];

    render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Manual Dismiss Test')).toBeInTheDocument();

    // Manually dismiss after 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('1');

    // Fast-forward past the auto-dismiss time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should only have been called once (from manual dismiss)
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows progress indicator for auto-dismissing notifications', async () => {
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Progress Test',
        message: 'This should show progress',
        dismissible: true
      }
    ];

    const { container } = render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          autoHideDuration={1000}
        />
      </TestWrapper>
    );

    // Fast-forward to 50% completion
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      // Look for the progress indicator element
      const progressBar = container.querySelector('[style*="width: 50%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('cleans up timers on unmount', () => {
    const mockOnDismiss = vi.fn();
    const notifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'Cleanup Test',
        message: 'This tests cleanup',
        dismissible: true
      }
    ];

    const { unmount } = render(
      <TestWrapper>
        <IOSDashboardNotifications 
          notifications={notifications} 
          onDismiss={mockOnDismiss}
        />
      </TestWrapper>
    );

    // Unmount before auto-dismiss time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    unmount();

    // Fast-forward past auto-dismiss time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should not have been called since component was unmounted
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });
});