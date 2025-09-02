import { useState, useEffect, useMemo } from 'react';

export interface IOSCapabilities {
  isIOS: boolean;
  isIPad: boolean;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  supportsHaptics: boolean;
  supportsStandalone: boolean;
  version: number;
}

export interface IOSDetectionHook {
  capabilities: IOSCapabilities;
  shouldUseIOSExperience: boolean;
  deviceClass: 'phone' | 'tablet' | 'desktop';
}

/**
 * Enhanced iOS detection hook with comprehensive capability detection
 * Provides progressive enhancement logic based on detected iOS capabilities
 */
export const useIOSDetection = (): IOSDetectionHook => {
  const [capabilities, setCapabilities] = useState<IOSCapabilities>({
    isIOS: false,
    isIPad: false,
    hasNotch: false,
    hasDynamicIsland: false,
    supportsHaptics: false,
    supportsStandalone: false,
    version: 0,
  });

  useEffect(() => {
    const detectIOSCapabilities = (): IOSCapabilities => {
      try {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isIPad = /iPad/.test(userAgent) || 
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      let version = 0;
      let hasNotch = false;
      let hasDynamicIsland = false;
      let supportsHaptics = false;

      if (isIOS) {
        // Extract iOS version
        const versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (versionMatch) {
          version = parseInt(versionMatch[1], 10);
        }

        // Detect notch and Dynamic Island based on screen dimensions and safe areas
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;
        const pixelRatio = window.devicePixelRatio || 1;

        // Simplified safe area detection to avoid DOM manipulation issues
        try {
          const hasSafeArea = CSS.supports('padding-top: env(safe-area-inset-top)') ||
            CSS.supports('padding-top: constant(safe-area-inset-top)');

          if (hasSafeArea && isIOS) {
            // Basic notch detection based on screen dimensions
            const physicalHeight = screenHeight * pixelRatio;
            const physicalWidth = screenWidth * pixelRatio;

            // iPhone X and later have notch (starting from 2436×1125)
            hasNotch = physicalHeight >= 2436 || physicalWidth >= 2436;

            // Dynamic Island detection (iPhone 14 Pro and later)
            const isDynamicIslandDevice = 
              (physicalHeight === 2556 && physicalWidth === 1179) ||
              (physicalHeight === 2796 && physicalWidth === 1290) ||
              (physicalHeight === 1179 && physicalWidth === 2556) ||
              (physicalHeight === 1290 && physicalWidth === 2796);

            hasDynamicIsland = isDynamicIslandDevice;
          }
        } catch (error) {
          console.debug('Safe area detection failed:', error);
          // Fallback to basic detection
          hasNotch = false;
          hasDynamicIsland = false;
        }

        // Haptic feedback detection
        // Check for Taptic Engine support (iOS 10+)
        supportsHaptics = version >= 10 && 'vibrate' in navigator;
        
        // More sophisticated haptic detection for newer devices
        if (version >= 13) {
          // Check for more advanced haptic capabilities
          // This is a heuristic based on device capabilities
          supportsHaptics = supportsHaptics || (
            'ontouchstart' in window && 
            window.DeviceMotionEvent !== undefined
          );
        }
      }

      // Standalone mode detection (PWA)
      const supportsStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      return {
        isIOS,
        isIPad,
        hasNotch,
        hasDynamicIsland,
        supportsHaptics,
        supportsStandalone,
        version,
      };
      } catch (error) {
        console.error('Error detecting iOS capabilities:', error);
        return {
          isIOS: false,
          isIPad: false,
          hasNotch: false,
          hasDynamicIsland: false,
          supportsHaptics: false,
          supportsStandalone: false,
          version: 0,
        };
      }
    };

    // Initial detection
    setCapabilities(detectIOSCapabilities());

    // Listen for orientation changes that might affect detection
    const handleOrientationChange = () => {
      // Delay to allow for screen dimension updates
      setTimeout(() => {
        setCapabilities(detectIOSCapabilities());
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Progressive enhancement logic
  const progressiveEnhancement = useMemo(() => {
    const { isIOS, isIPad, version } = capabilities;

    // Determine device class
    let deviceClass: 'phone' | 'tablet' | 'desktop' = 'desktop';
    if (isIOS) {
      deviceClass = isIPad ? 'tablet' : 'phone';
    } else {
      // For non-iOS devices, use screen size as fallback
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const isTablet = window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches;
      deviceClass = isMobile ? 'phone' : isTablet ? 'tablet' : 'desktop';
    }

    // Determine if iOS experience should be used
    // Use iOS experience for iOS devices with sufficient capabilities
    const shouldUseIOSExperience = isIOS && (
      version >= 12 || // iOS 12+ for better CSS support
      deviceClass === 'phone' // Always use for iPhone regardless of version
    );

    return {
      shouldUseIOSExperience,
      deviceClass,
    };
  }, [capabilities]);

  return {
    capabilities,
    shouldUseIOSExperience: progressiveEnhancement.shouldUseIOSExperience,
    deviceClass: progressiveEnhancement.deviceClass,
  };
};

/**
 * Utility function to trigger haptic feedback if supported
 * @param type - Type of haptic feedback ('light', 'medium', 'heavy', 'selection', 'impact', 'notification')
 */
export const triggerHapticFeedback = (
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' = 'light'
): void => {
  // Check if haptics are supported
  if (!('vibrate' in navigator)) {
    return;
  }

  try {
    // Map haptic types to vibration patterns
    const vibrationPatterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: [10],
      impact: [15],
      notification: [10, 50, 10],
    };

    const pattern = vibrationPatterns[type] || vibrationPatterns.light;
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Hook for haptic feedback functionality
 */
export const useHapticFeedback = () => {
  const { capabilities } = useIOSDetection();

  const triggerFeedback = (
    type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' = 'light'
  ) => {
    if (capabilities.supportsHaptics) {
      triggerHapticFeedback(type);
    }
  };

  return {
    supportsHaptics: capabilities.supportsHaptics,
    triggerFeedback,
  };
};

export default useIOSDetection;