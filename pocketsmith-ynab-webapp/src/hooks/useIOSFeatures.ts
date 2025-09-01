import { useState, useEffect, useCallback } from 'react';
import { useHapticFeedback } from './useHapticFeedback';
import { useSwipeGestures } from './useSwipeGestures';
import { usePullToRefresh } from './usePullToRefresh';

interface IOSFeatures {
  // Device detection
  isIOS: boolean;
  isStandalone: boolean;
  isSafari: boolean;
  
  // Device capabilities
  hasHapticFeedback: boolean;
  hasTouchSupport: boolean;
  hasNotificationSupport: boolean;
  
  // Screen info
  screenInfo: {
    width: number;
    height: number;
    pixelRatio: number;
    orientation: 'portrait' | 'landscape';
    safeAreaInsets: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  
  // Feature utilities
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  addToHomeScreen: () => void;
  
  // Gesture handlers
  enableSwipeGestures: (element: HTMLElement, handlers: any) => void;
  enablePullToRefresh: (onRefresh: () => Promise<void>) => void;
  
  // iOS-specific behaviors
  preventZoom: () => void;
  enableSmoothScrolling: () => void;
  hideAddressBar: () => void;
}

export const useIOSFeatures = (): IOSFeatures => {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isStandalone: false,
    isSafari: false,
    hasHapticFeedback: false,
    hasTouchSupport: false,
    hasNotificationSupport: false
  });

  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' as const : 'portrait' as const,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  const { triggerHaptic } = useHapticFeedback();

  // Detect iOS and device capabilities
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for haptic feedback support
    const hasHapticFeedback = 'vibrate' in navigator || 'hapticFeedback' in navigator;
    
    // Check for touch support
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check for notification support
    const hasNotificationSupport = 'Notification' in window;

    setDeviceInfo({
      isIOS,
      isStandalone,
      isSafari,
      hasHapticFeedback,
      hasTouchSupport,
      hasNotificationSupport
    });

    // Get safe area insets
    if (isIOS) {
      const computedStyle = getComputedStyle(document.documentElement);
      setScreenInfo(prev => ({
        ...prev,
        safeAreaInsets: {
          top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
          bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
          left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
          right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0')
        }
      }));
    }
  }, []);

  // Handle screen changes
  useEffect(() => {
    const handleResize = () => {
      setScreenInfo(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      }));
    };

    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!deviceInfo.hasNotificationSupport) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, [deviceInfo.hasNotificationSupport]);

  // Add to home screen
  const addToHomeScreen = useCallback(() => {
    if (deviceInfo.isIOS && deviceInfo.isSafari && !deviceInfo.isStandalone) {
      // Show iOS add to home screen instructions
      alert('To add this app to your home screen:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"');
    }
  }, [deviceInfo]);

  // Prevent zoom on iOS
  const preventZoom = useCallback(() => {
    if (deviceInfo.isIOS) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }
  }, [deviceInfo.isIOS]);

  // Enable smooth scrolling
  const enableSmoothScrolling = useCallback(() => {
    if (deviceInfo.isIOS) {
      document.documentElement.style.webkitOverflowScrolling = 'touch';
      document.body.style.webkitOverflowScrolling = 'touch';
    }
  }, [deviceInfo.isIOS]);

  // Hide address bar on iOS Safari
  const hideAddressBar = useCallback(() => {
    if (deviceInfo.isIOS && deviceInfo.isSafari && !deviceInfo.isStandalone) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    }
  }, [deviceInfo]);

  // Enable swipe gestures
  const enableSwipeGestures = useCallback((element: HTMLElement, handlers: any) => {
    if (!deviceInfo.hasTouchSupport) return;
    
    // This would integrate with the useSwipeGestures hook
    // Implementation depends on specific gesture requirements
  }, [deviceInfo.hasTouchSupport]);

  // Enable pull to refresh
  const enablePullToRefresh = useCallback((onRefresh: () => Promise<void>) => {
    if (!deviceInfo.hasTouchSupport) return;
    
    // This would integrate with the usePullToRefresh hook
    // Implementation depends on specific refresh requirements
  }, [deviceInfo.hasTouchSupport]);

  return {
    // Device detection
    isIOS: deviceInfo.isIOS,
    isStandalone: deviceInfo.isStandalone,
    isSafari: deviceInfo.isSafari,
    
    // Device capabilities
    hasHapticFeedback: deviceInfo.hasHapticFeedback,
    hasTouchSupport: deviceInfo.hasTouchSupport,
    hasNotificationSupport: deviceInfo.hasNotificationSupport,
    
    // Screen info
    screenInfo,
    
    // Feature utilities
    triggerHaptic,
    requestNotificationPermission,
    addToHomeScreen,
    
    // Gesture handlers
    enableSwipeGestures,
    enablePullToRefresh,
    
    // iOS-specific behaviors
    preventZoom,
    enableSmoothScrolling,
    hideAddressBar
  };
};

export default useIOSFeatures;