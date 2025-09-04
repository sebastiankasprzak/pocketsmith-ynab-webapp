import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { IOSBulkActionsToolbar } from '../IOSBulkActionsToolbar';
import { Delete as DeleteIcon } from '@mui/icons-material';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSBulkActionsToolbar', () => {
  const mockActions = [
    {
      label: 'Delete',
      icon: <DeleteIcon />,
      destructive: true,
      onAction: vi.fn(),
    },
  ];

  const defaultProps = {
    selectedCount: 2,
    actions: mockActions,
    onCancel: vi.fn(),
    visible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when visible', () => {
    renderWithTheme(<IOSBulkActionsToolbar {...defaultProps} />);
    
    expect(screen.getByText('2 items selected')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    renderWithTheme(<IOSBulkActionsToolbar {...defaultProps} visible={false} />);
    
    expect(screen.queryByText('2 items selected')).not.toBeInTheDocument();
  });

  it('should handle singular item count', () => {
    renderWithTheme(<IOSBulkActionsToolbar {...defaultProps} selectedCount={1} />);
    
    expect(screen.getByText('1 item selected')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    renderWithTheme(<IOSBulkActionsToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call action handler when action button is clicked', () => {
    renderWithTheme(<IOSBulkActionsToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockActions[0].onAction).toHaveBeenCalledTimes(1);
  });

  it('should handle disabled actions', () => {
    const disabledActions = [
      {
        ...mockActions[0],
        disabled: true,
      },
    ];
    
    renderWithTheme(
      <IOSBulkActionsToolbar {...defaultProps} actions={disabledActions} />
    );
    
    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton).toBeDisabled();
  });
});