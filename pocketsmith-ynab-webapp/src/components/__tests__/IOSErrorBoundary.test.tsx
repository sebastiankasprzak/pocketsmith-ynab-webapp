import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IOSErrorBoundary, withIOSErrorBoundary, useIOSErrorHandler } from '../IOSErrorBoundary';
import { IOSCapabilities } from '../../hooks/useIOSDetection';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

// Mock capabilities
const mockCapabilities: IOSCapabilities = {
  isIOS: true,
  isIPad: false,
  hasNotch: true,
  hasDynamicIsland: false,
  supportsHaptics: true,
  supportsStandalone: false,
  version: 15,
};

// Test component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({ 
  shouldThrow = false, 
  errorType = 'generic' 
}) => {
  if (shouldThrow) {
    const error = new Error(`Test ${errorType} error`);
    (error as any).isIOSSpecific = errorType === 'ios';
    (error as any).capability = errorType === 'haptic' ? 'supportsHaptics' : undefined;
    throw error;
  }
  return <div data-testid="working-component">Component works!</div>;
};

// Fallback component for testing
const TestFallbackComponent: React.FC = () => (
  <div data-testid="fallback-component">Fallback component</div>
);

describe('IOSErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent />
      </IOSErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  it('catches and displays iOS-specific errors', () => {
    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent shouldThrow errorType="ios" />
      </IOSErrorBoundary>
    );

    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
    expect(screen.getByText(/ios-specific feature encountered an error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('catches and displays haptic capability errors', () => {
    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent shouldThrow errorType="haptic" />
      </IOSErrorBoundary>
    );

    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
    expect(screen.getByText(/haptic feedback is not available/i)).toBeInTheDocument();
  });

  it('displays custom fallback when provided', () => {
    render(
      <IOSErrorBoundary 
        capabilities={mockCapabilities}
        fallback={<TestFallbackComponent />}
      >
        <ThrowingComponent shouldThrow />
      </IOSErrorBoundary>
    );

    expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <IOSErrorBoundary capabilities={mockCapabilities} onError={onError}>
        <ThrowingComponent shouldThrow errorType="ios" />
      </IOSErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test ios error',
        isIOSSpecific: true,
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('allows retry after error', async () => {
    let shouldThrow = true;
    
    const RetryableComponent: React.FC = () => {
      return <ThrowingComponent shouldThrow={shouldThrow} />;
    };

    const { rerender } = render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <RetryableComponent />
      </IOSErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();

    // Change the condition and click retry button
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Rerender with new state
    rerender(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <RetryableComponent />
      </IOSErrorBoundary>
    );

    // Should show working component after retry
    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  it('shows fallback option when available', () => {
    const errorWithFallback = new Error('Test error');
    (errorWithFallback as any).fallbackComponent = TestFallbackComponent;
    (errorWithFallback as any).isIOSSpecific = true;

    const ComponentWithFallback: React.FC = () => {
      throw errorWithFallback;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities} enableFallback>
        <ComponentWithFallback />
      </IOSErrorBoundary>
    );

    // The error boundary should show the error UI, not immediately use the fallback
    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use standard version/i })).toBeInTheDocument();
  });

  it('uses fallback component when fallback button is clicked', () => {
    const errorWithFallback = new Error('Test error');
    (errorWithFallback as any).fallbackComponent = TestFallbackComponent;
    (errorWithFallback as any).isIOSSpecific = true;

    const ComponentWithFallback: React.FC = () => {
      throw errorWithFallback;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities} enableFallback>
        <ComponentWithFallback />
      </IOSErrorBoundary>
    );

    // First verify the error UI is shown
    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /use standard version/i }));

    expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
  });

  it('applies iOS-specific styling when on iOS', () => {
    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent shouldThrow />
      </IOSErrorBoundary>
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveStyle({
      'border-radius': '8px',
    });
  });

  it('shows error ID in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent shouldThrow />
      </IOSErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error ID in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ThrowingComponent shouldThrow />
      </IOSErrorBoundary>
    );

    expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('withIOSErrorBoundary', () => {
  it('wraps component with error boundary', () => {
    const WrappedComponent = withIOSErrorBoundary(ThrowingComponent, {
      fallbackComponent: TestFallbackComponent,
      capability: 'supportsHaptics',
      enableFallback: true,
    });

    render(<WrappedComponent shouldThrow />);

    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
  });

  it('sets correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    
    const WrappedComponent = withIOSErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withIOSErrorBoundary(TestComponent)');
  });
});

describe('useIOSErrorHandler', () => {
  it('throws enhanced error with iOS-specific properties', () => {
    const TestComponent: React.FC = () => {
      const { handleIOSError } = useIOSErrorHandler();
      
      React.useEffect(() => {
        try {
          throw new Error('Test error');
        } catch (error) {
          handleIOSError(error as Error, 'supportsHaptics', 'Test context');
        }
      }, [handleIOSError]);

      return <div>Test</div>;
    };

    expect(() => {
      render(
        <IOSErrorBoundary capabilities={mockCapabilities}>
          <TestComponent />
        </IOSErrorBoundary>
      );
    }).not.toThrow(); // Error should be caught by boundary

    expect(screen.getByText('iOS Enhancement Error')).toBeInTheDocument();
  });

  it('logs error in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const TestComponent: React.FC = () => {
      const { handleIOSError } = useIOSErrorHandler();
      
      React.useEffect(() => {
        try {
          throw new Error('Test error');
        } catch (error) {
          handleIOSError(error as Error, 'supportsHaptics', 'Test context');
        }
      }, [handleIOSError]);

      return <div>Test</div>;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <TestComponent />
      </IOSErrorBoundary>
    );

    expect(console.group).toHaveBeenCalledWith('🍎 iOS Error Handler');
    expect(console.error).toHaveBeenCalledWith('Error:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Capability:', 'supportsHaptics');
    expect(console.error).toHaveBeenCalledWith('Context:', 'Test context');

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Error message customization', () => {
  it('shows specific message for haptic errors', () => {
    const error = new Error('Haptic test');
    (error as any).capability = 'supportsHaptics';

    const ComponentWithHapticError: React.FC = () => {
      throw error;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ComponentWithHapticError />
      </IOSErrorBoundary>
    );

    expect(screen.getByText(/haptic feedback is not available/i)).toBeInTheDocument();
  });

  it('shows specific message for safe area errors', () => {
    const error = new Error('Safe area test');
    (error as any).capability = 'hasNotch';

    const ComponentWithSafeAreaError: React.FC = () => {
      throw error;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ComponentWithSafeAreaError />
      </IOSErrorBoundary>
    );

    expect(screen.getByText(/safe area detection failed/i)).toBeInTheDocument();
  });

  it('shows specific message for iOS theme errors', () => {
    const error = new Error('iOS theme failed to load');

    const ComponentWithThemeError: React.FC = () => {
      throw error;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ComponentWithThemeError />
      </IOSErrorBoundary>
    );

    expect(screen.getByText(/ios theme could not be applied/i)).toBeInTheDocument();
  });

  it('shows generic message for unknown iOS errors', () => {
    const error = new Error('Unknown iOS error');
    (error as any).isIOSSpecific = true;

    const ComponentWithUnknownError: React.FC = () => {
      throw error;
    };

    render(
      <IOSErrorBoundary capabilities={mockCapabilities}>
        <ComponentWithUnknownError />
      </IOSErrorBoundary>
    );

    expect(screen.getByText(/ios-specific feature encountered an error/i)).toBeInTheDocument();
  });
});