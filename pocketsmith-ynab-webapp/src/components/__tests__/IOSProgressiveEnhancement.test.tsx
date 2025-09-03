import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  IOSProgressiveEnhancement,
  withProgressiveEnhancement,
  useIOSFeature,
  IOSConditional,
  IOSLazyComponent,
  IOSEnhancementProvider,
  useIOSEnhancement,
  IOSFeatureDetector,
  IOSDetectionDebug,
} from '../IOSProgressiveEnhancement';
import { useIOSDetection } from '../../hooks/useIOSDetection';

// Mock the iOS detection hook
vi.mock('../../hooks/useIOSDetection');

const mockUseIOSDetection = vi.mocked(useIOSDetection);

const mockIOSCapabilities = {
  isIOS: true,
  isIPad: false,
  hasNotch: true,
  hasDynamicIsland: false,
  supportsHaptics: true,
  supportsStandalone: false,
  version: 15,
};

const mockDetection = {
  capabilities: mockIOSCapabilities,
  shouldUseIOSExperience: true,
  deviceClass: 'phone' as const,
};

beforeEach(() => {
  mockUseIOSDetection.mockReturnValue(mockDetection);
});

// Test components
const IOSComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div data-testid="ios-component">iOS Component {children}</div>
);

const FallbackComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div data-testid="fallback-component">Fallback Component {children}</div>
);

const TestContent = () => <span>Test Content</span>;

describe('IOSProgressiveEnhancement', () => {
  it('renders iOS component when iOS experience should be used', () => {
    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        fallbackComponent={FallbackComponent}
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByTestId('ios-component')).toBeInTheDocument();
  });

  it('renders fallback component when iOS experience should not be used', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      shouldUseIOSExperience: false,
    });

    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        fallbackComponent={FallbackComponent}
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
  });

  it('renders fallback when required capability is not available', () => {
    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        fallbackComponent={FallbackComponent}
        capability="supportsHaptics"
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    // Should render iOS component since haptics is supported
    expect(screen.getByTestId('ios-component')).toBeInTheDocument();

    // Test with unsupported capability
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        supportsHaptics: false,
      },
    });

    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        fallbackComponent={FallbackComponent}
        capability="supportsHaptics"
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
  });

  it('renders fallback when iOS version requirement is not met', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        version: 11, // Below minimum requirement
      },
    });

    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        fallbackComponent={FallbackComponent}
        minIOSVersion={12}
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
  });

  it('renders children directly when no components are specified', () => {
    render(
      <IOSProgressiveEnhancement>
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows loading component while iOS component is loading', async () => {
    const LoadingComponent = () => <div data-testid="loading">Loading...</div>;

    render(
      <IOSProgressiveEnhancement
        iosComponent={IOSComponent}
        loadingComponent={<LoadingComponent />}
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    // Should eventually show the iOS component
    await waitFor(() => {
      expect(screen.getByTestId('ios-component')).toBeInTheDocument();
    });
  });

  it('shows error fallback when iOS component fails', () => {
    const ErrorFallback = () => <div data-testid="error-fallback">Error occurred</div>;
    
    const FailingIOSComponent: React.FC = () => {
      throw new Error('iOS component failed');
    };

    render(
      <IOSProgressiveEnhancement
        iosComponent={FailingIOSComponent}
        fallbackComponent={FallbackComponent}
        errorFallback={<ErrorFallback />}
      >
        <TestContent />
      </IOSProgressiveEnhancement>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});

describe('withProgressiveEnhancement', () => {
  it('creates enhanced component with progressive enhancement', () => {
    const EnhancedComponent = withProgressiveEnhancement(
      IOSComponent,
      FallbackComponent,
      {
        capability: 'supportsHaptics',
        minIOSVersion: 12,
        enableFallback: true,
      }
    );

    render(<EnhancedComponent />);

    expect(screen.getByTestId('ios-component')).toBeInTheDocument();
  });

  it('sets correct display name', () => {
    IOSComponent.displayName = 'IOSComponent';
    
    const EnhancedComponent = withProgressiveEnhancement(IOSComponent, FallbackComponent);
    
    expect(EnhancedComponent.displayName).toBe('withProgressiveEnhancement(IOSComponent)');
  });
});

describe('useIOSFeature', () => {
  const TestComponent: React.FC<{ capability?: keyof typeof mockIOSCapabilities; minVersion?: number }> = ({ 
    capability, 
    minVersion 
  }) => {
    const feature = useIOSFeature(capability, minVersion);
    
    return (
      <div>
        <div data-testid="can-use-feature">{feature.canUseFeature.toString()}</div>
        <div data-testid="has-capability">{feature.hasRequiredCapability.toString()}</div>
        <div data-testid="meets-version">{feature.meetsVersionRequirement.toString()}</div>
      </div>
    );
  };

  it('returns correct feature availability', () => {
    render(<TestComponent capability="supportsHaptics" minVersion={12} />);

    expect(screen.getByTestId('can-use-feature')).toHaveTextContent('true');
    expect(screen.getByTestId('has-capability')).toHaveTextContent('true');
    expect(screen.getByTestId('meets-version')).toHaveTextContent('true');
  });

  it('returns false when capability is not available', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        supportsHaptics: false,
      },
    });

    render(<TestComponent capability="supportsHaptics" minVersion={12} />);

    expect(screen.getByTestId('can-use-feature')).toHaveTextContent('false');
    expect(screen.getByTestId('has-capability')).toHaveTextContent('false');
  });

  it('returns false when version requirement is not met', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        version: 11,
      },
    });

    render(<TestComponent minVersion={12} />);

    expect(screen.getByTestId('can-use-feature')).toHaveTextContent('false');
    expect(screen.getByTestId('meets-version')).toHaveTextContent('false');
  });
});

describe('IOSConditional', () => {
  it('renders children when iOS feature is available', () => {
    render(
      <IOSConditional capability="supportsHaptics">
        <div data-testid="ios-content">iOS Content</div>
      </IOSConditional>
    );

    expect(screen.getByTestId('ios-content')).toBeInTheDocument();
  });

  it('renders fallback when iOS feature is not available', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        supportsHaptics: false,
      },
    });

    render(
      <IOSConditional 
        capability="supportsHaptics"
        fallback={<div data-testid="fallback-content">Fallback Content</div>}
      >
        <div data-testid="ios-content">iOS Content</div>
      </IOSConditional>
    );

    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('ios-content')).not.toBeInTheDocument();
  });

  it('renders children when inverse is true and iOS feature is not available', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      shouldUseIOSExperience: false,
    });

    render(
      <IOSConditional inverse>
        <div data-testid="non-ios-content">Non-iOS Content</div>
      </IOSConditional>
    );

    expect(screen.getByTestId('non-ios-content')).toBeInTheDocument();
  });
});

describe('IOSLazyComponent', () => {
  it('loads and renders iOS component when feature is available', async () => {
    const componentLoader = () => Promise.resolve({ 
      default: () => <div data-testid="lazy-ios-component">Lazy iOS Component</div> 
    });

    render(
      <IOSLazyComponent
        componentLoader={componentLoader}
        capability="supportsHaptics"
        props={{ test: 'prop' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('lazy-ios-component')).toBeInTheDocument();
    });
  });

  it('renders fallback component when iOS feature is not available', () => {
    mockUseIOSDetection.mockReturnValue({
      ...mockDetection,
      capabilities: {
        ...mockIOSCapabilities,
        supportsHaptics: false,
      },
    });

    const componentLoader = () => Promise.resolve({ 
      default: () => <div data-testid="lazy-ios-component">Lazy iOS Component</div> 
    });

    render(
      <IOSLazyComponent
        componentLoader={componentLoader}
        fallbackComponentName="IOSButton"
        capability="supportsHaptics"
      />
    );

    // Should render nothing since fallback component is not a simple component
    expect(screen.queryByTestId('lazy-ios-component')).not.toBeInTheDocument();
  });

  it('shows loading component while lazy loading', () => {
    const LoadingComponent = () => <div data-testid="lazy-loading">Loading...</div>;
    
    const componentLoader = () => new Promise(resolve => {
      setTimeout(() => resolve({ 
        default: () => <div data-testid="lazy-ios-component">Lazy iOS Component</div> 
      }), 100);
    });

    render(
      <IOSLazyComponent
        componentLoader={componentLoader}
        loadingComponent={<LoadingComponent />}
      />
    );

    expect(screen.getByTestId('lazy-loading')).toBeInTheDocument();
  });
});

describe('IOSEnhancementProvider and useIOSEnhancement', () => {
  const TestConsumer: React.FC = () => {
    const enhancement = useIOSEnhancement();
    
    return (
      <div>
        <div data-testid="is-ios">{enhancement.capabilities.isIOS.toString()}</div>
        <div data-testid="should-use-ios">{enhancement.shouldUseIOSExperience.toString()}</div>
        <div data-testid="device-class">{enhancement.deviceClass}</div>
        <div data-testid="can-use-haptics">{enhancement.canUseFeature('supportsHaptics').toString()}</div>
      </div>
    );
  };

  it('provides iOS enhancement context', () => {
    render(
      <IOSEnhancementProvider>
        <TestConsumer />
      </IOSEnhancementProvider>
    );

    expect(screen.getByTestId('is-ios')).toHaveTextContent('true');
    expect(screen.getByTestId('should-use-ios')).toHaveTextContent('true');
    expect(screen.getByTestId('device-class')).toHaveTextContent('phone');
    expect(screen.getByTestId('can-use-haptics')).toHaveTextContent('true');
  });

  it('throws error when used outside provider', () => {
    const TestComponentWithoutProvider: React.FC = () => {
      useIOSEnhancement();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useIOSEnhancement must be used within IOSEnhancementProvider');
  });
});

describe('IOSFeatureDetector', () => {
  it('provides detection data to children function', () => {
    render(
      <IOSEnhancementProvider>
        <IOSFeatureDetector>
          {(detection) => (
            <div>
              <div data-testid="detector-ios">{detection.capabilities.isIOS.toString()}</div>
              <div data-testid="detector-device">{detection.deviceClass}</div>
            </div>
          )}
        </IOSFeatureDetector>
      </IOSEnhancementProvider>
    );

    expect(screen.getByTestId('detector-ios')).toHaveTextContent('true');
    expect(screen.getByTestId('detector-device')).toHaveTextContent('phone');
  });
});

describe('IOSDetectionDebug', () => {
  it('renders debug info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <IOSEnhancementProvider>
        <IOSDetectionDebug />
      </IOSEnhancementProvider>
    );

    expect(screen.getByText('iOS: ✅')).toBeInTheDocument();
    expect(screen.getByText('Device: phone')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('does not render in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <IOSEnhancementProvider>
        <IOSDetectionDebug />
      </IOSEnhancementProvider>
    );

    expect(screen.queryByText(/iOS:/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});