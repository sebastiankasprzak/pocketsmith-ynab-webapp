import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IOSActionSheet } from '../IOSActionSheet';
import { IOSConfirmationDialog } from '../IOSConfirmationDialog';
import { vi } from 'vitest';

// Mock the haptic feedback hook
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    selection: vi.fn(),
  }),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Account Mappings Action Sheets Integration', () => {
  it('renders IOSActionSheet for bulk operations', () => {
    const mockActions = [
      {
        label: 'Delete 2 Mappings',
        onPress: vi.fn(),
        destructive: true,
      },
    ];

    renderWithTheme(
      <IOSActionSheet
        open={true}
        onClose={vi.fn()}
        title="Bulk Actions"
        message="2 mappings selected"
        actions={mockActions}
      />
    );

    expect(screen.getByText('Bulk Actions')).toBeInTheDocument();
    expect(screen.getByText('2 mappings selected')).toBeInTheDocument();
    expect(screen.getByText('Delete 2 Mappings')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders IOSConfirmationDialog for destructive actions', () => {
    renderWithTheme(
      <IOSConfirmationDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete 2 Mappings?"
        message="This action cannot be undone. The selected account mappings will be permanently removed."
        destructive={true}
      />
    );

    expect(screen.getByText('Delete 2 Mappings?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone. The selected account mappings will be permanently removed.')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders both components when closed', () => {
    renderWithTheme(
      <>
        <IOSActionSheet
          open={false}
          onClose={vi.fn()}
          title="Bulk Actions"
          actions={[]}
        />
        <IOSConfirmationDialog
          open={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Test"
        />
      </>
    );

    // Neither should be visible when closed
    expect(screen.queryByText('Bulk Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});