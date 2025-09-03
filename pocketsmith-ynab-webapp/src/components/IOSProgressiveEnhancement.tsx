import React, { Suspense, lazy, ComponentType } from 'react';
import { useIOSDetection, IOSCapabilities } from '../hooks/useIOSDetection';
import { IOSErrorBoundary } from './IOSErrorBoundary';
import { IOSFallbackRegistry, IOSFallbackComponent } from './IOSFallbackComponents';
import { CircularProgress, Box } from '@mui/material';

/**
 * Progressive enhancement wrapper that conditionally loads iOS components
 * with fallbacks for when iOS features are unavailable
 */

interface ProgressiveEnhancementProps<T = any> {
  children: React.ReactNode;
  iosComponent?: ComponentType<T>;
  fallbackComponent?: ComponentType<T>;
  capability?: keyof IOSCapabilities;
  minIOSVersion?: number;
  enableFallback?: boolean;
  loadingComponent?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const IOSProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  children,
  iosComponent: IOSComponent,
  fallbackComponent: FallbackComponent,
  capability,
  minIOSVersion = 12,
  enableFallback = true,
  loadingComponent,
  errorFallback,
}) => {
  const { capabilities, shouldUseIOSExperience } = useIOSDetection();

  // Check if the required capability is available
  const hasRequiredCapability = capability ? capabilities[capability] : true;
  
  // Check iOS version requirement
  const meetsVersionRequirement = capabilities.version >= minIOSVersion;
  
  // Determine if we should use iOS enhancement
  const shouldUseIOSComponent = 
    shouldUseIOSExperience && 
    hasRequiredCapability && 
    meetsVersionRequirement &&
    IOSComponent;

  // Default loading component
  const defaultLoading = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
      }}
    >
      <CircularProgress size={24} />
    </Box>
  );

  if (shouldUseIOSComponent && IOSComponent) {
    return (
      <IOSErrorBoundary
        capabilities={capabilities}
        enableFallback={enableFallback}
        fallback={errorFallback}
      >
        <Suspense fallback={loadingComponent || defaultLoading}>
          <IOSComponent>
            {children}
          </IOSComponent>
        </Suspense>
      </IOSErrorBoundary>
    );
  }

  // Use fallback component if available
  if (FallbackComponent) {
    return <FallbackComponent>{children}</FallbackComponent>;
  }

  // Return children as-is if no components specified
  return <>{children}</>;
};

/**
 * Higher-order component for progressive enhancement
 */
export const withProgressiveEnhancement = <P extends object>(
  iosComponent: ComponentType<P>,
  fallbackComponent?: ComponentType<P>,
  options?: {
    capability?: keyof IOSCapabilities;
    minIOSVersion?: number;
    enableFallback?: boolean;
  }
) => {
  const EnhancedComponent = (props: P) => (
    <IOSProgressiveEnhancement
      iosComponent={iosComponent}
      fallbackComponent={fallbackComponent}
      capability={options?.capability}
      minIOSVersion={options?.minIOSVersion}
      enableFallback={options?.enableFallback}
    >
      {/* Pass props to the component */}
      <div {...props} />
    </IOSProgressiveEnhancement>
  );

  EnhancedComponent.displayName = `withProgressiveEnhancement(${iosComponent.displayName || iosComponent.name})`;
  return EnhancedComponent;
};

/**
 * Hook for conditional iOS feature usage
 */
export const useIOSFeature = (
  capability?: keyof IOSCapabilities,
  minIOSVersion: number = 12
) => {
  const { capabilities, shouldUseIOSExperience } = useIOSDetection();

  const hasRequiredCapability = capability ? capabilities[capability] : true;
  const meetsVersionRequirement = capabilities.version >= minIOSVersion;
  
  const canUseFeature = 
    shouldUseIOSExperience && 
    hasRequiredCapability && 
    meetsVersionRequirement;

  return {
    canUseFeature,
    capabilities,
    shouldUseIOSExperience,
    hasRequiredCapability,
    meetsVersionRequirement,
  };
};

/**
 * Component for conditionally rendering iOS-specific content
 */
export const IOSConditional: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  capability?: keyof IOSCapabilities;
  minIOSVersion?: number;
  inverse?: boolean; // Render children when NOT on iOS
}> = ({ 
  children, 
  fallback, 
  capability, 
  minIOSVersion = 12, 
  inverse = false 
}) => {
  const { canUseFeature } = useIOSFeature(capability, minIOSVersion);

  const shouldRender = inverse ? !canUseFeature : canUseFeature;

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Lazy loading wrapper for iOS components
 */
export const IOSLazyComponent: React.FC<{
  componentLoader: () => Promise<{ default: ComponentType<any> }>;
  fallbackComponentName?: IOSFallbackComponent;
  capability?: keyof IOSCapabilities;
  minIOSVersion?: number;
  loadingComponent?: React.ReactNode;
  props?: any;
}> = ({
  componentLoader,
  fallbackComponentName,
  capability,
  minIOSVersion = 12,
  loadingComponent,
  props = {},
}) => {
  const { canUseFeature } = useIOSFeature(capability, minIOSVersion);

  // Default loading component
  const defaultLoading = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
      }}
    >
      <CircularProgress size={24} />
    </Box>
  );

  if (canUseFeature) {
    const LazyIOSComponent = lazy(componentLoader);
    
    return (
      <IOSErrorBoundary capability={capability}>
        <Suspense fallback={loadingComponent || defaultLoading}>
          <LazyIOSComponent {...props} />
        </Suspense>
      </IOSErrorBoundary>
    );
  }

  // Use fallback component
  if (fallbackComponentName) {
    const FallbackComponent = IOSFallbackRegistry[fallbackComponentName];
    return <FallbackComponent {...props} />;
  }

  return null;
};

/**
 * Provider for iOS enhancement context
 */
interface IOSEnhancementContextValue {
  capabilities: IOSCapabilities;
  shouldUseIOSExperience: boolean;
  deviceClass: 'phone' | 'tablet' | 'desktop';
  canUseFeature: (capability?: keyof IOSCapabilities, minVersion?: number) => boolean;
}

const IOSEnhancementContext = React.createContext<IOSEnhancementContextValue | null>(null);

export const IOSEnhancementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const detection = useIOSDetection();

  const canUseFeature = React.useCallback((
    capability?: keyof IOSCapabilities,
    minVersion: number = 12
  ) => {
    const hasCapability = capability ? detection.capabilities[capability] : true;
    const meetsVersion = detection.capabilities.version >= minVersion;
    return detection.shouldUseIOSExperience && hasCapability && meetsVersion;
  }, [detection]);

  const value: IOSEnhancementContextValue = {
    ...detection,
    canUseFeature,
  };

  return (
    <IOSEnhancementContext.Provider value={value}>
      {children}
    </IOSEnhancementContext.Provider>
  );
};

/**
 * Hook to use iOS enhancement context
 */
export const useIOSEnhancement = () => {
  const context = React.useContext(IOSEnhancementContext);
  if (!context) {
    throw new Error('useIOSEnhancement must be used within IOSEnhancementProvider');
  }
  return context;
};

/**
 * Component for feature detection and progressive enhancement
 */
export const IOSFeatureDetector: React.FC<{
  children: (detection: IOSEnhancementContextValue) => React.ReactNode;
}> = ({ children }) => {
  const detection = useIOSEnhancement();
  return <>{children(detection)}</>;
};

/**
 * Utility component for debugging iOS detection
 */
export const IOSDetectionDebug: React.FC = () => {
  const detection = useIOSEnhancement();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        p: 2,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: 300,
      }}
    >
      <div>iOS: {detection.capabilities.isIOS ? '✅' : '❌'}</div>
      <div>iPad: {detection.capabilities.isIPad ? '✅' : '❌'}</div>
      <div>Version: {detection.capabilities.version}</div>
      <div>Notch: {detection.capabilities.hasNotch ? '✅' : '❌'}</div>
      <div>Dynamic Island: {detection.capabilities.hasDynamicIsland ? '✅' : '❌'}</div>
      <div>Haptics: {detection.capabilities.supportsHaptics ? '✅' : '❌'}</div>
      <div>Standalone: {detection.capabilities.supportsStandalone ? '✅' : '❌'}</div>
      <div>Device: {detection.deviceClass}</div>
      <div>Use iOS: {detection.shouldUseIOSExperience ? '✅' : '❌'}</div>
    </Box>
  );
};

export default IOSProgressiveEnhancement;