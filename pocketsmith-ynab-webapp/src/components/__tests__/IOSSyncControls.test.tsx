import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IOSSyncControls } from '../IOSSyncControls';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    selection: vi.fn(),
    notification: vi.fn(),
  }),
}));

// Mock the complex iOS components to simplify testing
vi.mock('../IOSListItem', () => ({
  IOSListItem: ({ children, leftIcon, rightContent, subtitle, onClick }: any) => (
    <div data-testid="ios-list-item" onClick={onClick}>
      {leftIcon && <div data-testid="left-icon">{leftIcon}</div>}
      <div data-testid="content">{children}</div>
      {subtitle && <div data-testid="subtitle">{subtitle}</div>}
      {rightContent && <div data-testid="right-content">{rightContent}</div>}
    </div>
  ),
}));

vi.mock('../IOSToggle', () => ({
  IOSToggle: ({ checked, onChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      data-testid="ios-toggle"
    />
  ),
}));

vi.mock('../IOSActionSheet', () => ({
  IOSActionSheet: ({ open, onClose, title, actions }: any) => 
    open ? (
      <div data-testid="action-sheet">
        <div>{title}</div>
        {actions.map((action: any, index: number) => (
          <button key={index} onClick={action.onPress}>
            {action.label}
          </button>
        ))}
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('../IOSConfirmationDialog', () => ({
  IOSConfirmationDialog: ({ open, onClose, onConfirm, title, confirmText, cancelText }: any) => 
    open ? (
      <div data-testid="confirmation-dialog">
        <div>{title}</div>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>{cancelText}</button>
      </div>
    ) : null,
}));

const mockTheme = createTheme();

const defaultProps = {
  autoRefresh: true,
  onAutoRefreshToggle: vi.fn(),
  onRefresh: vi.fn(),
  onManualSync: vi.fn(),
  isRefreshing: false,
  isSyncTriggering: false,
  lastUpdated: new Date('2024-01-01T12:00:00Z'),
  syncNotifications: true,
  onSyncNotificationsToggle: vi.fn(),
  backgroundSync: false,
  onBackgroundSyncToggle: vi.fn(),
  syncFrequency: '30s' as const,
  onSyncFrequencyChange: vi.fn(),
};

const renderWithTheme = (props = {}) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <IOSSyncControls {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('IOSSyncControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders sync controls section', () => {
      renderWithTheme();
      expect(screen.getByText('Sync Controls')).toBeInTheDocument();
    });

    it('displays refresh and manual sync buttons', () => {
      renderWithTheme();
      expect(screen.getByText('Refresh Data')).toBeInTheDocument();
      expect(screen.getByText('Manual Sync')).toBeInTheDocument();
    });

    it('renders sync status information', () => {
      renderWithTheme();
      expect(screen.getByText('Sync Status')).toBeInTheDocument();
      expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    });
  });

  describe('Toggle Controls', () => {
    it('calls onAutoRefreshToggle when auto-refresh toggle is changed', () => {
      const onAutoRefreshToggle = vi.fn();
      renderWithTheme({ onAutoRefreshToggle });
      
      const toggles = screen.getAllByTestId('ios-toggle');
      fireEvent.change(toggles[0], { target: { checked: false } });
      
      expect(onAutoRefreshToggle).toHaveBeenCalledWith(false);
    });

    it('calls onSyncNotificationsToggle when notifications toggle is changed', () => {
      const onSyncNotificationsToggle = vi.fn();
      renderWithTheme({ onSyncNotificationsToggle });
      
      expect(screen.getByText('Sync Notifications')).toBeInTheDocument();
      
      const toggles = screen.getAllByTestId('ios-toggle');
      // Find the notifications toggle (should be the second one)
      fireEvent.change(toggles[1], { target: { checked: false } });
      
      expect(onSyncNotificationsToggle).toHaveBeenCalledWith(false);
    });

    it('calls onBackgroundSyncToggle when background sync toggle is changed', () => {
      const onBackgroundSyncToggle = vi.fn();
      renderWithTheme({ onBackgroundSyncToggle });
      
      expect(screen.getByText('Background Sync')).toBeInTheDocument();
      
      const toggles = screen.getAllByTestId('ios-toggle');
      // Find the background sync toggle (should be the third one)
      fireEvent.change(toggles[2], { target: { checked: true } });
      
      expect(onBackgroundSyncToggle).toHaveBeenCalledWith(true);
    });

    it('disables toggles when syncing', () => {
      renderWithTheme({ isSyncTriggering: true });
      
      const toggles = screen.getAllByTestId('ios-toggle');
      toggles.forEach(toggle => {
        expect(toggle).toBeDisabled();
      });
    });
  });

  describe('Action Buttons', () => {
    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = vi.fn();
      renderWithTheme({ onRefresh });
      
      fireEvent.click(screen.getByText('Refresh Data'));
      expect(onRefresh).toHaveBeenCalled();
    });

    it('opens sync action sheet when manual sync button is clicked', async () => {
      renderWithTheme();
      
      fireEvent.click(screen.getByText('Manual Sync'));
      
      await waitFor(() => {
        expect(screen.getByTestId('action-sheet')).toBeInTheDocument();
        expect(screen.getByText('Sync Options')).toBeInTheDocument();
      });
    });

    it('shows syncing text when sync is triggering', () => {
      renderWithTheme({ isSyncTriggering: true });
      
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows refreshing text when refreshing', () => {
      renderWithTheme({ isRefreshing: true });
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Sync Action Sheet', () => {
    beforeEach(async () => {
      renderWithTheme();
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        expect(screen.getByTestId('action-sheet')).toBeInTheDocument();
      });
    });

    it('shows sync options in action sheet', () => {
      expect(screen.getByText('Quick Sync')).toBeInTheDocument();
      expect(screen.getByText('Selective Sync')).toBeInTheDocument();
      expect(screen.getByText('Force Full Sync')).toBeInTheDocument();
      expect(screen.getByText('Sync Settings')).toBeInTheDocument();
    });

    it('calls onManualSync for quick sync', async () => {
      const onManualSync = vi.fn();
      renderWithTheme({ onManualSync });
      
      // Re-open action sheet
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Quick Sync'));
      });
      
      expect(onManualSync).toHaveBeenCalledWith();
    });

    it('shows force sync confirmation dialog', async () => {
      fireEvent.click(screen.getByText('Force Full Sync'));
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
        expect(screen.getByText('Force Full Sync')).toBeInTheDocument();
      });
    });
  });

  describe('Force Sync Confirmation', () => {
    it('calls onManualSync with forceSync option when confirmed', async () => {
      const onManualSync = vi.fn();
      renderWithTheme({ onManualSync });
      
      // Open action sheet and select force sync
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Force Full Sync'));
      });
      
      // Confirm the force sync
      await waitFor(() => {
        fireEvent.click(screen.getByText('Force Sync'));
      });
      
      expect(onManualSync).toHaveBeenCalledWith({ forceSync: true });
    });

    it('closes dialog when cancelled', async () => {
      renderWithTheme();
      
      // Open action sheet and select force sync
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Force Full Sync'));
      });
      
      // Cancel the dialog
      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel'));
      });
      
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Sync Settings', () => {
    it('shows frequency picker when change frequency is selected', async () => {
      renderWithTheme();
      
      // Open manual sync action sheet
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Sync Settings'));
      });
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Change Frequency'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Sync Frequency')).toBeInTheDocument();
        expect(screen.getByText('Real-time')).toBeInTheDocument();
        expect(screen.getByText('Every 30 seconds')).toBeInTheDocument();
      });
    });

    it('calls onSyncFrequencyChange when frequency is selected', async () => {
      const onSyncFrequencyChange = vi.fn();
      renderWithTheme({ onSyncFrequencyChange });
      
      // Navigate to frequency picker
      fireEvent.click(screen.getByText('Manual Sync'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Sync Settings'));
      });
      await waitFor(() => {
        fireEvent.click(screen.getByText('Change Frequency'));
      });
      await waitFor(() => {
        fireEvent.click(screen.getByText('Real-time'));
      });
      
      expect(onSyncFrequencyChange).toHaveBeenCalledWith('realtime');
    });
  });

  describe('Conditional Rendering', () => {
    it('does not render sync notifications toggle when callback is not provided', () => {
      renderWithTheme({ onSyncNotificationsToggle: undefined });
      expect(screen.queryByText('Sync Notifications')).not.toBeInTheDocument();
    });

    it('does not render background sync toggle when callback is not provided', () => {
      renderWithTheme({ onBackgroundSyncToggle: undefined });
      expect(screen.queryByText('Background Sync')).not.toBeInTheDocument();
    });

    it('renders additional settings when callbacks are provided', () => {
      renderWithTheme();
      expect(screen.getByText('Sync Notifications')).toBeInTheDocument();
      expect(screen.getByText('Background Sync')).toBeInTheDocument();
    });
  });

  describe('Sync Status Display', () => {
    it('shows appropriate status based on sync state', () => {
      renderWithTheme({ isSyncTriggering: true });
      // The status badge should show syncing status
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows auto-refresh enabled status', () => {
      renderWithTheme({ autoRefresh: true });
      // Should show auto-refresh enabled in status
      const toggles = screen.getAllByTestId('ios-toggle');
      expect(toggles[0]).toBeChecked();
    });

    it('shows manual refresh only when auto-refresh is disabled', () => {
      renderWithTheme({ autoRefresh: false });
      const toggles = screen.getAllByTestId('ios-toggle');
      expect(toggles[0]).not.toBeChecked();
    });
  });
});