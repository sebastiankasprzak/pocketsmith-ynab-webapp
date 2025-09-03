import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { IOSButton } from '../IOSButton';
import { IOSCard } from '../IOSCard';
import { IOSSection } from '../IOSSection';
import { IOSListItem, createDeleteAction, createEditAction } from '../IOSListItem';

// Mock the haptic feedback hook
vi.mock('../../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn(),
  }),
}));

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('iOS Components', () => {
  describe('IOSButton', () => {
    it('renders with default props', () => {
      render(
        <TestWrapper>
          <IOSButton>Test Button</IOSButton>
        </TestWrapper>
      );
      
      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <IOSButton onClick={handleClick}>Click Me</IOSButton>
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders different variants', () => {
      const { rerender } = render(
        <TestWrapper>
          <IOSButton variant="primary">Primary</IOSButton>
        </TestWrapper>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <IOSButton variant="destructive">Destructive</IOSButton>
        </TestWrapper>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <IOSButton disabled onClick={handleClick}>Disabled</IOSButton>
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('IOSCard', () => {
    it('renders with children', () => {
      render(
        <TestWrapper>
          <IOSCard>
            <div>Card Content</div>
          </IOSCard>
        </TestWrapper>
      );
      
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <IOSCard onClick={handleClick}>
            <div>Clickable Card</div>
          </IOSCard>
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Clickable Card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with actions', () => {
      render(
        <TestWrapper>
          <IOSCard actions={<button>Action</button>}>
            <div>Card with Actions</div>
          </IOSCard>
        </TestWrapper>
      );
      
      expect(screen.getByText('Card with Actions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('IOSSection', () => {
    it('renders with title and children', () => {
      render(
        <TestWrapper>
          <IOSSection title="Test Section">
            <div>Section Content</div>
          </IOSSection>
        </TestWrapper>
      );
      
      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(
        <TestWrapper>
          <IOSSection>
            <div>Section Content</div>
          </IOSSection>
        </TestWrapper>
      );
      
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <TestWrapper>
          <IOSSection footer="Footer text">
            <div>Section Content</div>
          </IOSSection>
        </TestWrapper>
      );
      
      expect(screen.getByText('Footer text')).toBeInTheDocument();
    });

    it('renders with header action', () => {
      render(
        <TestWrapper>
          <IOSSection 
            title="Section with Action" 
            headerAction={<button>Action</button>}
          >
            <div>Content</div>
          </IOSSection>
        </TestWrapper>
      );
      
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('IOSListItem', () => {
    it('renders with text content', () => {
      render(
        <TestWrapper>
          <IOSListItem>List Item Text</IOSListItem>
        </TestWrapper>
      );
      
      expect(screen.getByText('List Item Text')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <IOSListItem onClick={handleClick}>Clickable Item</IOSListItem>
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Clickable Item'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with subtitle', () => {
      render(
        <TestWrapper>
          <IOSListItem subtitle="Subtitle text">Main Text</IOSListItem>
        </TestWrapper>
      );
      
      expect(screen.getByText('Main Text')).toBeInTheDocument();
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('renders with disclosure indicator', () => {
      render(
        <TestWrapper>
          <IOSListItem showDisclosure>Item with Disclosure</IOSListItem>
        </TestWrapper>
      );
      
      expect(screen.getByText('Item with Disclosure')).toBeInTheDocument();
      // ChevronRight icon should be present
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with left icon', () => {
      render(
        <TestWrapper>
          <IOSListItem leftIcon={<span data-testid="left-icon">📱</span>}>
            Item with Icon
          </IOSListItem>
        </TestWrapper>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const handleClick = vi.fn();
      render(
        <TestWrapper>
          <IOSListItem disabled onClick={handleClick}>Disabled Item</IOSListItem>
        </TestWrapper>
      );
      
      fireEvent.click(screen.getByText('Disabled Item'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Swipe Actions', () => {
    it('creates delete action correctly', () => {
      const onDelete = vi.fn();
      const deleteAction = createDeleteAction(onDelete);
      
      expect(deleteAction.label).toBe('Delete');
      expect(deleteAction.backgroundColor).toBe('#FF3B30');
      expect(deleteAction.color).toBe('#FFFFFF');
      
      deleteAction.onAction();
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('creates edit action correctly', () => {
      const onEdit = vi.fn();
      const editAction = createEditAction(onEdit);
      
      expect(editAction.label).toBe('Edit');
      expect(editAction.backgroundColor).toBe('#007AFF');
      expect(editAction.color).toBe('#FFFFFF');
      
      editAction.onAction();
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });
});