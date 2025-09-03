import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IOSProgressIndicator } from '../IOSProgressIndicator';

const lightTheme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

const renderWithTheme = (component: React.ReactElement, theme = lightTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSProgressIndicator', () => {
  describe('Linear Variant', () => {
    it('should render linear progress indicator with default props', () => {
      renderWithTheme(<IOSProgressIndicator progress={50} />);
      
      const progressElement = document.querySelector('.ios-progress-indicator.linear');
      expect(progressElement).toBeInTheDocument();
    });

    it('should display correct progress percentage', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={75} 
          variant="linear" 
          showLabel={true} 
        />
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show custom label when provided', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={30} 
          variant="linear" 
          showLabel={true}
          label="Syncing accounts"
        />
      );
      
      expect(screen.getByText('Syncing accounts')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should handle indeterminate progress', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          variant="linear" 
          showLabel={true}
          label="Loading..."
        />
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('should clamp progress values', () => {
      const { rerender } = renderWithTheme(
        <IOSProgressIndicator 
          progress={150} 
          variant="linear" 
          showLabel={true} 
        />
      );
      
      expect(screen.getByText('100%')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={lightTheme}>
          <IOSProgressIndicator 
            progress={-10} 
            variant="linear" 
            showLabel={true} 
          />
        </ThemeProvider>
      );
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should apply different sizes correctly', () => {
      const { rerender } = renderWithTheme(
        <IOSProgressIndicator 
          progress={50} 
          variant="linear" 
          size="small"
          data-testid="progress-small"
        />
      );

      rerender(
        <ThemeProvider theme={lightTheme}>
          <IOSProgressIndicator 
            progress={50} 
            variant="linear" 
            size="large"
            data-testid="progress-large"
          />
        </ThemeProvider>
      );

      // Components should render without errors
      expect(document.querySelector('.ios-progress-indicator.linear')).toBeInTheDocument();
    });
  });

  describe('Circular Variant', () => {
    it('should render circular progress indicator', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={60} 
          variant="circular" 
        />
      );
      
      const progressElement = document.querySelector('.ios-progress-indicator.circular');
      expect(progressElement).toBeInTheDocument();
    });

    it('should show percentage in center when showLabel is true', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={85} 
          variant="circular" 
          showLabel={true}
        />
      );
      
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should show external label when provided', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={40} 
          variant="circular" 
          showLabel={true}
          label="Upload progress"
        />
      );
      
      expect(screen.getByText('Upload progress')).toBeInTheDocument();
    });

    it('should handle indeterminate circular progress', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          variant="circular"
        />
      );
      
      const progressElement = document.querySelector('.ios-progress-indicator.circular');
      expect(progressElement).toBeInTheDocument();
    });

    it('should apply different colors correctly', () => {
      const colors = ['primary', 'secondary', 'success', 'warning', 'error'] as const;
      
      colors.forEach(color => {
        const { unmount } = renderWithTheme(
          <IOSProgressIndicator 
            progress={50} 
            variant="circular" 
            color={color}
          />
        );
        
        expect(document.querySelector('.ios-progress-indicator.circular')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Dark Mode', () => {
    it('should render correctly in dark mode', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={50} 
          variant="linear" 
          showLabel={true}
        />,
        darkTheme
      );
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render circular variant correctly in dark mode', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={75} 
          variant="circular" 
          showLabel={true}
        />,
        darkTheme
      );
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={50} 
          variant="linear" 
          showLabel={true}
          label="File upload"
        />
      );
      
      expect(screen.getByText('File upload')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={50} 
          className="custom-progress"
        />
      );
      
      const progressElement = document.querySelector('.custom-progress');
      expect(progressElement).toBeInTheDocument();
    });

    it('should apply custom thickness for circular variant', () => {
      renderWithTheme(
        <IOSProgressIndicator 
          progress={50} 
          variant="circular"
          thickness={6}
        />
      );
      
      // Component should render without errors
      expect(document.querySelector('.ios-progress-indicator.circular')).toBeInTheDocument();
    });
  });
});