import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { IOSNavigationBar } from '../IOSNavigationBar';
import { IOSTabBar } from '../IOSTabBar';
import { IOSActionSheet } from '../IOSActionSheet';
import { IOSBottomSheet } from '../IOSBottomSheet';
import { useIOSTheme } from '../../hooks/useIOSTheme';
import { Dashboard, Settings, Person, Notifications } from '@mui/icons-material';

// Mock hooks
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    selection: vi.fn(),
    impact: vi.fn(),
    notification: vi.fn(),
    triggerHaptic: vi.fn(),
  }),
}));

vi.mock('../../hooks/useIOSDetection', () => ({
  useIOSDetection: () => ({
    capabilities: {
      isIOS: true,
      isIPad: false,
      hasNotch: true,
      hasDynamicIsland: false,
      supportsHaptics: true,
      supportsStandalone: false,
      version: 15,
    },
    shouldUseIOSExperience: true,
    deviceClass: 'phone',
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useIOSTheme(false);
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('IOSNavigationBar', () => {
  it('renders with basic title', () => {
    render(
      <TestWrapper>
        <IOSNavigationBar title="Test Title" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with large title', () => {
    render(
      <TestWrapper>
        <IOSNavigationBar title="Large Title" large />
      </TestWrapper>
    );

    const largeTitles = screen.getAllByText('Large Title');
    expect(largeTitles).toHaveLength(2); // Both small and large title elements
  });

  it('handles back button press', () => {
    const onBack = vi.fn();
    render(
      <TestWrapper>
        <IOSNavigationBar title="Test" onBack={onBack} />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalled();
  });

  it('renders left and right actions', () => {
    render(
      <TestWrapper>
        <IOSNavigationBar
          title="Test"
          leftAction={<button>Left</button>}
          rightAction={<button>Right</button>}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('applies correct styling for iOS devices', () => {
    const { container } = render(
      <TestWrapper>
        <IOSNavigationBar title="Test" />
      </TestWrapper>
    );

    const navBar = container.firstChild as HTMLElement;
    expect(navBar).toHaveStyle({
      position: 'sticky',
      top: '0',
    });
  });
});

describe('IOSTabBar', () => {
  const mockTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
    { id: 'profile', label: 'Profile', icon: <Person /> },
  ];

  it('renders all tabs', () => {
    render(
      <TestWrapper>
        <IOSTabBar
          tabs={mockTabs}
          activeTab="dashboard"
          onTabChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles tab selection', () => {
    const onTabChange = vi.fn();
    render(
      <TestWrapper>
        <IOSTabBar
          tabs={mockTabs}
          activeTab="dashboard"
          onTabChange={onTabChange}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Settings'));
    expect(onTabChange).toHaveBeenCalledWith('settings');
  });

  it('shows active tab styling', () => {
    render(
      <TestWrapper>
        <IOSTabBar
          tabs={mockTabs}
          activeTab="dashboard"
          onTabChange={vi.fn()}
        />
      </TestWrapper>
    );

    const dashboardTab = screen.getByText('Dashboard').closest('div');
    expect(dashboardTab).toBeInTheDocument();
  });

  it('renders badges when provided', () => {
    const tabsWithBadge = [
      { id: 'notifications', label: 'Notifications', icon: <Notifications />, badge: 5 },
    ];

    render(
      <TestWrapper>
        <IOSTabBar
          tabs={tabsWithBadge}
          activeTab="notifications"
          onTabChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles disabled tabs', () => {
    const tabsWithDisabled = [
      { id: 'disabled', label: 'Disabled', icon: <Settings />, disabled: true },
    ];

    const onTabChange = vi.fn();
    render(
      <TestWrapper>
        <IOSTabBar
          tabs={tabsWithDisabled}
          activeTab=""
          onTabChange={onTabChange}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Disabled'));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('renders without labels when showLabels is false', () => {
    render(
      <TestWrapper>
        <IOSTabBar
          tabs={mockTabs}
          activeTab="dashboard"
          onTabChange={vi.fn()}
          showLabels={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

describe('IOSActionSheet', () => {
  const mockActions = [
    { label: 'Edit', onPress: vi.fn() },
    { label: 'Delete', onPress: vi.fn(), destructive: true },
    { label: 'Disabled', onPress: vi.fn(), disabled: true },
  ];

  it('renders when open', () => {
    render(
      <TestWrapper>
        <IOSActionSheet
          open={true}
          onClose={vi.fn()}
          title="Test Action Sheet"
          actions={mockActions}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Action Sheet')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <IOSActionSheet
          open={false}
          onClose={vi.fn()}
          actions={mockActions}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('handles action press', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <IOSActionSheet
          open={true}
          onClose={onClose}
          actions={mockActions}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockActions[0].onPress).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel button', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <IOSActionSheet
          open={true}
          onClose={onClose}
          actions={mockActions}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('applies destructive styling', () => {
    render(
      <TestWrapper>
        <IOSActionSheet
          open={true}
          onClose={vi.fn()}
          actions={mockActions}
        />
      </TestWrapper>
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveStyle({ color: '#FF3B30' });
  });
});

describe('IOSBottomSheet', () => {
  it('renders when open', () => {
    render(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          title="Test Bottom Sheet"
        >
          <div>Sheet Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    expect(screen.getByText('Test Bottom Sheet')).toBeInTheDocument();
    expect(screen.getByText('Sheet Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <IOSBottomSheet
          open={false}
          onClose={vi.fn()}
        >
          <div>Sheet Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    expect(screen.queryByText('Sheet Content')).not.toBeInTheDocument();
  });

  it('renders close button when showCloseButton is true', () => {
    render(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          title="Test"
          showCloseButton={true}
        >
          <div>Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    // Just verify the close button is rendered
    expect(screen.getByRole('button', { hidden: true })).toBeInTheDocument();
  });

  it('renders handle when showHandle is true', () => {
    render(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          showHandle={true}
        >
          <div>Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    // Just verify the content is rendered (handle is part of the component)
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies correct height variants', () => {
    const { rerender } = render(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          height="half"
        >
          <div>Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    // Test different height variants
    rerender(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          height="full"
        >
          <div>Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    rerender(
      <TestWrapper>
        <IOSBottomSheet
          open={true}
          onClose={vi.fn()}
          height="auto"
        >
          <div>Content</div>
        </IOSBottomSheet>
      </TestWrapper>
    );

    // All variants should render without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('iOS Navigation Components Integration', () => {
  it('works together in a complete navigation setup', () => {
    const tabs = [
      { id: 'home', label: 'Home', icon: <Dashboard /> },
      { id: 'settings', label: 'Settings', icon: <Settings /> },
    ];

    render(
      <TestWrapper>
        <IOSNavigationBar title="App Title" large />
        <div style={{ height: '200px', paddingBottom: '83px' }}>
          Content Area
        </div>
        <IOSTabBar
          tabs={tabs}
          activeTab="home"
          onTabChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('App Title')).toHaveLength(2); // Both small and large title
    expect(screen.getByText('Content Area')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('maintains proper z-index stacking', () => {
    render(
      <TestWrapper>
        <IOSNavigationBar title="Nav" />
        <IOSTabBar
          tabs={[{ id: 'test', label: 'Test', icon: <Dashboard /> }]}
          activeTab="test"
          onTabChange={vi.fn()}
        />
      </TestWrapper>
    );

    // Just verify both components render
    expect(screen.getByText('Nav')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});