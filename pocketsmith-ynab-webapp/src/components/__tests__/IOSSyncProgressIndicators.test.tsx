import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { IOSProgressIndicator } from '../IOSProgressIndicator';
import { IOSSyncNotification, useIOSSyncNotifications } from '../IOSSyncNotifications';
import { IOSStatusBadge } from '../IOSStatusBadge';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('IOSProgressIndicator', () => {
  it('renders linear progress indicator with basic props', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="linear"
          progress={50}
          showLabel={true}
          label="Test Progress"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders sync variant with sync state', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="sync"
          syncState="syncing"
          showIcon={true}
          animated={true}
          transitionsCount={150}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Syncing 150 transactions')).toBeInTheDocument();
  });

  it('renders circular progress indicator', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="circular"
          progress={75}
          size="large"
          showLabel={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles indeterminate progress for syncing state', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="sync"
          syncState="syncing"
          showIcon={true}
          animated={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('shows completed state correctly', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="sync"
          syncState="completed"
          showIcon={true}
          transitionsCount={200}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Completed 200 transactions')).toBeInTheDocument();
  });

  it('shows failed state correctly', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="sync"
          syncState="failed"
          showIcon={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Sync failed')).toBeInTheDocument();
  });

  it('shows estimated time when provided', () => {
    render(
      <TestWrapper>
        <IOSProgressIndicator
          variant="sync"
          syncState="pending"
          showIcon={true}
          estimatedTime="2 minutes"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Starting in 2 minutes')).toBeInTheDocument();
    expect(screen.getByText('ETA: 2 minutes')).toBeInTheDocument();
  });
});

describe('IOSStatusBadge', () => {
  it('renders sync-specific status types', () => {
    const { rerender } = render(
      <TestWrapper>
        <IOSStatusBadge status="syncing" text="Syncing" animated={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Syncing')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="completed" text="Completed" />
      </TestWrapper>
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="failed" text="Failed" />
      </TestWrapper>
    );

    expect(screen.getByText('Failed')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="queued" text="Queued" animated={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Queued')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="processing" text="Processing" animated={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <TestWrapper>
        <IOSStatusBadge 
          status="idle" 
          text="Idle" 
          onClick={handleClick}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Idle'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <IOSStatusBadge status="success" text="Success" variant="filled" />
      </TestWrapper>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="warning" text="Warning" variant="outlined" />
      </TestWrapper>
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <IOSStatusBadge status="error" text="Error" variant="dot" />
      </TestWrapper>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

describe('IOSSyncNotification', () => {
  const mockNotification = {
    id: 'test-1',
    type: 'sync_started' as const,
    title: 'Sync Started',
    message: 'Starting synchronization process',
    timestamp: new Date(),
  };

  it('renders sync notification correctly', () => {
    const handleClose = vi.fn();
    render(
      <TestWrapper>
        <IOSSyncNotification
          notification={mockNotification}
          onClose={handleClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Sync Started')).toBeInTheDocument();
    expect(screen.getByText('Starting synchronization process')).toBeInTheDocument();
  });

  it('handles close button click', async () => {
    const handleClose = vi.fn();
    render(
      <TestWrapper>
        <IOSSyncNotification
          notification={mockNotification}
          onClose={handleClose}
        />
      </TestWrapper>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    // Should trigger animation and then call onClose after 300ms
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledWith('test-1');
    }, { timeout: 500 });
  });

  it('renders progress notification with progress bar', () => {
    const progressNotification = {
      ...mockNotification,
      type: 'sync_progress' as const,
      title: 'Sync Progress',
      message: '50% complete',
      progress: 50,
      transactionCount: 100,
    };

    const handleClose = vi.fn();
    render(
      <TestWrapper>
        <IOSSyncNotification
          notification={progressNotification}
          onClose={handleClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Sync Progress')).toBeInTheDocument();
    expect(screen.getByText('50% complete')).toBeInTheDocument();
    expect(screen.getByText('100 transactions')).toBeInTheDocument();
  });

  it('renders completed notification', () => {
    const completedNotification = {
      ...mockNotification,
      type: 'sync_completed' as const,
      title: 'Sync Completed',
      message: 'Successfully synced all accounts',
      transactionCount: 250,
    };

    const handleClose = vi.fn();
    render(
      <TestWrapper>
        <IOSSyncNotification
          notification={completedNotification}
          onClose={handleClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Sync Completed')).toBeInTheDocument();
    expect(screen.getByText('Successfully synced all accounts')).toBeInTheDocument();
    expect(screen.getByText('250 transactions')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', async () => {
    const handleClose = vi.fn();
    const timedNotification = {
      ...mockNotification,
      duration: 100, // 100ms for fast test
    };

    render(
      <TestWrapper>
        <IOSSyncNotification
          notification={timedNotification}
          onClose={handleClose}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledWith('test-1');
    }, { timeout: 500 });
  });
});

// Test component for useIOSSyncNotifications hook
const TestNotificationHook: React.FC = () => {
  const {
    showSyncStarted,
    showSyncProgress,
    showSyncCompleted,
    showSyncFailed,
    showSyncWarning,
    NotificationContainer,
  } = useIOSSyncNotifications();

  return (
    <div>
      <button onClick={() => showSyncStarted('Test Account', 100)}>
        Show Sync Started
      </button>
      <button onClick={() => showSyncProgress(50, 100, '2 minutes')}>
        Show Sync Progress
      </button>
      <button onClick={() => showSyncCompleted(100, 'Test Account')}>
        Show Sync Completed
      </button>
      <button onClick={() => showSyncFailed('Network error', 'Test Account')}>
        Show Sync Failed
      </button>
      <button onClick={() => showSyncWarning('Partial sync', 'Test Account')}>
        Show Sync Warning
      </button>
      <NotificationContainer />
    </div>
  );
};

describe('useIOSSyncNotifications hook', () => {
  it('creates and displays sync notifications', () => {
    render(
      <TestWrapper>
        <TestNotificationHook />
      </TestWrapper>
    );

    // Test sync started notification
    fireEvent.click(screen.getByText('Show Sync Started'));
    expect(screen.getByText('Sync Started')).toBeInTheDocument();
    expect(screen.getByText('Syncing Test Account')).toBeInTheDocument();

    // Test sync progress notification
    fireEvent.click(screen.getByText('Show Sync Progress'));
    expect(screen.getByText('Sync in Progress')).toBeInTheDocument();
    expect(screen.getByText('50% complete')).toBeInTheDocument();

    // Test sync completed notification
    fireEvent.click(screen.getByText('Show Sync Completed'));
    expect(screen.getByText('Sync Completed')).toBeInTheDocument();
    expect(screen.getByText('Successfully synced Test Account')).toBeInTheDocument();

    // Test sync failed notification
    fireEvent.click(screen.getByText('Show Sync Failed'));
    expect(screen.getByText('Sync Failed')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    // Test sync warning notification
    fireEvent.click(screen.getByText('Show Sync Warning'));
    expect(screen.getByText('Sync Warning')).toBeInTheDocument();
    expect(screen.getByText('Test Account: Partial sync')).toBeInTheDocument();
  });
});