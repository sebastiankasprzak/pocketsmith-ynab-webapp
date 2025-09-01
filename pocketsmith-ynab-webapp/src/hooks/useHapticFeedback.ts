import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

interface HapticFeedbackAPI {
  impact: (style: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
  selection: () => void;
}

// Extend the Navigator interface to include haptic feedback
declare global {
  interface Navigator {
    vibrate?: (pattern: number | number[]) => boolean;
  }
  interface Window {
    DeviceMotionEvent?: {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    // iOS Haptic Feedback API (when available)
    webkit?: {
      messageHandlers?: {
        hapticFeedback?: {
          postMessage: (message: any) => void;
        };
      };
    };
  }
}

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticType) => {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOS) {
      // Fallback to vibration API for Android/other devices
      if (navigator.vibrate) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: 30,
          selection: 5,
          success: [10, 50, 10],
          warning: [20, 100, 20],
          error: [50, 100, 50]
        };
        navigator.vibrate(patterns[type]);
      }
      return;
    }

    // iOS Haptic Feedback simulation through CSS animations and audio
    try {
      // Method 1: Try native iOS haptic feedback if available (PWA context)
      if (window.webkit?.messageHandlers?.hapticFeedback) {
        window.webkit.messageHandlers.hapticFeedback.postMessage({ type });
        return;
      }

      // Method 2: Simulate haptic feedback with vibration API
      if (navigator.vibrate) {
        const vibrationPatterns = {
          light: 10,
          medium: 20,
          heavy: 40,
          selection: 5,
          success: [10, 50, 10],
          warning: [20, 100, 20],
          error: [50, 100, 50]
        };
        navigator.vibrate(vibrationPatterns[type]);
        return;
      }

      // Method 3: Visual feedback as fallback
      const element = document.activeElement as HTMLElement;
      if (element) {
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
          element.style.transform = '';
        }, 100);
      }

    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  const impact = useCallback((style: 'light' | 'medium' | 'heavy') => {
    triggerHaptic(style);
  }, [triggerHaptic]);

  const notification = useCallback((type: 'success' | 'warning' | 'error') => {
    triggerHaptic(type);
  }, [triggerHaptic]);

  const selection = useCallback(() => {
    triggerHaptic('selection');
  }, [triggerHaptic]);

  return {
    impact,
    notification,
    selection,
    triggerHaptic
  };
};

export default useHapticFeedback;