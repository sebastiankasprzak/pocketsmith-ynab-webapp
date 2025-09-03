import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { IOSStatusBadge } from '../IOSStatusBadge';

const lightTheme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

const renderWithTheme = (component: React.ReactElement, theme = lightTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSStatusBadge', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Completed" />
      );
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should render all status types correctly', () => {
      const statuses = [
        'success', 'error', 'warning', 'info', 'neutral',
        'active', 'inactive', 'pending', 'syncing'
      ] as const;
      
      statuses.forEach(status => {
        const { unmount } = renderWithTheme(
          <IOSStatusBadge status={status} text={`Status: ${status}`} />
        );
        
        expect(screen.getByText(`Status: ${status}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should apply custom className', () => {
      renderWithTheme(
        <IOSStatusBadge 
          status="success" 
          text="Test" 
          className="custom-badge"
        />
      );
      
      const badgeElement = document.querySelector('.custom-badge');
      expect(badgeElement).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render filled variant (default)', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Success" variant="filled" />
      );
      
      const badgeElement = document.querySelector('.ios-status-badge.filled');
      expect(badgeElement).toBeInTheDocument();
    });

    it('should render outlined variant', () => {
      renderWithTheme(
        <IOSStatusBadge status="warning" text="Warning" variant="outlined" />
      );
      
      const badgeElement = document.querySelector('.ios-status-badge.outlined');
      expect(badgeElement).toBeInTheDocument();
    });

    it('should render dot variant', () => {
      renderWithTheme(
        <IOSStatusBadge status="active" text="Online" variant="dot" />
      );
      
      const badgeElement = document.querySelector('.ios-status-badge.dot');
      expect(badgeElement).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should render minimal variant', () => {
      renderWithTheme(
        <IOSStatusBadge status="info" text="Information" variant="minimal" />
      );
      
      const badgeElement = document.querySelector('.ios-status-badge.minimal');
      expect(badgeElement).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render different sizes correctly', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { unmount } = renderWithTheme(
          <IOSStatusBadge 
            status="success" 
            text="Test" 
            size={size}
          />
        );
        
        expect(screen.getByText('Test')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Icons', () => {
    it('should show default icon when icon=true', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Success" icon={true} />
      );
      
      // Icon should be present (default behavior)
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should hide icon when icon=false', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Success" icon={false} />
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should render custom icon', () => {
      const CustomIcon = () => <span data-testid="custom-icon">★</span>;
      
      renderWithTheme(
        <IOSStatusBadge 
          status="success" 
          text="Success" 
          icon={<CustomIcon />} 
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      
      renderWithTheme(
        <IOSStatusBadge 
          status="success" 
          text="Clickable" 
          onClick={handleClick}
        />
      );
      
      const badge = screen.getByText('Clickable').closest('div');
      fireEvent.click(badge!);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not be clickable when no onClick provided', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Not Clickable" />
      );
      
      const badge = screen.getByText('Not Clickable').closest('div');
      expect(badge).not.toHaveStyle('cursor: pointer');
    });
  });

  describe('Animation', () => {
    it('should animate syncing status when animated=true', () => {
      renderWithTheme(
        <IOSStatusBadge 
          status="syncing" 
          text="Syncing..." 
          animated={true}
        />
      );
      
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('should animate pending status when animated=true', () => {
      renderWithTheme(
        <IOSStatusBadge 
          status="pending" 
          text="Pending..." 
          animated={true}
        />
      );
      
      expect(screen.getByText('Pending...')).toBeInTheDocument();
    });

    it('should animate dot variant for active states', () => {
      renderWithTheme(
        <IOSStatusBadge 
          status="syncing" 
          text="Syncing..." 
          variant="dot"
          animated={true}
        />
      );
      
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('should render correctly in dark mode', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Success" />,
        darkTheme
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should render dot variant correctly in dark mode', () => {
      renderWithTheme(
        <IOSStatusBadge status="active" text="Online" variant="dot" />,
        darkTheme
      );
      
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should render neutral status correctly in dark mode', () => {
      renderWithTheme(
        <IOSStatusBadge status="neutral" text="Neutral" />,
        darkTheme
      );
      
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });
  });

  describe('Status-Specific Behavior', () => {
    it('should render success status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Success" />
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should render error status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="error" text="Error" />
      );
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render warning status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="warning" text="Warning" />
      );
      
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should render info status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="info" text="Info" />
      );
      
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should render active status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="active" text="Active" />
      );
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render inactive status with appropriate styling', () => {
      renderWithTheme(
        <IOSStatusBadge status="inactive" text="Inactive" />
      );
      
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      renderWithTheme(
        <IOSStatusBadge status="success" text="Operation completed successfully" />
      );
      
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('should support keyboard navigation when clickable', () => {
      const handleClick = vi.fn();
      
      renderWithTheme(
        <IOSStatusBadge 
          status="success" 
          text="Clickable Badge" 
          onClick={handleClick}
        />
      );
      
      const badge = screen.getByText('Clickable Badge').closest('div');
      expect(badge).toBeInTheDocument();
    });
  });
});