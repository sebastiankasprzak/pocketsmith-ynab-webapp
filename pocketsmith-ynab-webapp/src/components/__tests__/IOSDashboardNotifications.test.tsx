import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
});