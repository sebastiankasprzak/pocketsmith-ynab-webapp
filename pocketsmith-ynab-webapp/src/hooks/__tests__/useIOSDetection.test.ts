import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { triggerHapticFeedback } from '../useIOSDetection';

// Mock navigator and window properties
const mockNavigator = (userAgent: string, vibrate?: boolean) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent,
      vibrate: vibrate ? vi.fn() : undefined,
      maxTouchPoints: 1,
      platform: 'iPhone',
    },
    writable: true,
  });
};

const mockWindow = (
  screenHeight: number = 812,
  screenWidth: number = 375,
  devicePixelRatio: number = 3,
  standalone: boolean = false
) => {
  Object.defineProperty(window, 'screen', {
    value: {
      height: screenHeight,
      width: screenWidth,
    },
    writable: true,
  });

  Object.defineProperty(window, 'devicePixelRatio', {
    value: devicePixelRatio,
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('standalone') ? standalone : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });
};

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: vi.fn().mockReturnValue(true),
  },
  writable: true,
});

// Mock document methods
const mockDocument = () => {
  const mockElement = {
    style: {},
    remove: vi.fn(),
  };

  Object.defineProperty(document, 'createElement', {
    value: vi.fn().mockReturnValue(mockElement),
    writable: true,
  });

  Object.defineProperty(document.body, 'appendChild', {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn().mockReturnValue({
      paddingTop: '44px',
    }),
    writable: true,
  });
};

describe('iOS Detection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument();
  });

  afterEach(() => {
    // Clean up event listeners
    vi.restoreAllMocks();
  });

  describe('User Agent Detection', () => {
    it('should detect iPhone user agent', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', true);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPad = /iPad/.test(navigator.userAgent);
      
      expect(isIOS).toBe(true);
      expect(isIPad).toBe(false);
    });

    it('should detect iPad user agent', () => {
      mockNavigator('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', true);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPad = /iPad/.test(navigator.userAgent);
      
      expect(isIOS).toBe(true);
      expect(isIPad).toBe(true);
    });

    it('should detect iPad Pro with MacIntel user agent', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          platform: 'MacIntel',
          maxTouchPoints: 5, // iPad Pro has more touch points
          vibrate: vi.fn(),
        },
        writable: true,
      });
      
      const isIPad = /iPad/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      expect(isIPad).toBe(true);
    });

    it('should not detect iOS on Android', () => {
      mockNavigator('Mozilla/5.0 (Linux; Android 11; SM-G991B)', false);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      expect(isIOS).toBe(false);
    });
  });

  describe('iOS Version Detection', () => {
    it('should extract iOS version correctly', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X)', true);
      
      const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      
      expect(version).toBe(15);
    });

    it('should handle missing version', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone like Mac OS X)', true);
      
      const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      
      expect(version).toBe(0);
    });
  });

  describe('Haptic Support Detection', () => {
    it('should detect haptic support on iOS 10+', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', true);
      
      const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      const supportsHaptics = version >= 10 && 'vibrate' in navigator;
      
      expect(supportsHaptics).toBe(true);
    });

    it('should not support haptics on iOS 9', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 9_0 like Mac OS X)', true);
      
      const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      const supportsHaptics = version >= 10 && 'vibrate' in navigator;
      
      expect(supportsHaptics).toBe(false);
    });

    it('should not support haptics without vibrate API', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          maxTouchPoints: 1,
          platform: 'iPhone',
          // No vibrate property
        },
        writable: true,
      });
      
      const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
      const supportsHaptics = version >= 10 && 'vibrate' in navigator;
      
      expect(supportsHaptics).toBe(false);
    });
  });

  describe('Standalone Mode Detection', () => {
    it('should detect standalone mode via matchMedia', () => {
      mockWindow(812, 375, 3, true);
      
      const supportsStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      expect(supportsStandalone).toBe(true);
    });

    it('should detect standalone mode via navigator.standalone', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          standalone: true,
          vibrate: vi.fn(),
        },
        writable: true,
      });
      
      const supportsStandalone = (window.navigator as any).standalone === true;
      
      expect(supportsStandalone).toBe(true);
    });
  });
});

describe('triggerHapticFeedback', () => {
  it('should trigger vibration with correct patterns', () => {
    const mockVibrate = vi.fn();
    Object.defineProperty(window.navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
    });

    triggerHapticFeedback('light');
    expect(mockVibrate).toHaveBeenCalledWith(10);

    triggerHapticFeedback('medium');
    expect(mockVibrate).toHaveBeenCalledWith(20);

    triggerHapticFeedback('heavy');
    expect(mockVibrate).toHaveBeenCalledWith(30);

    triggerHapticFeedback('notification');
    expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('should handle vibration errors gracefully', () => {
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vi.fn().mockImplementation(() => {
        throw new Error('Vibration not allowed');
      }),
      writable: true,
    });

    // Should not throw
    expect(() => triggerHapticFeedback('light')).not.toThrow();
  });

  it('should do nothing when vibrate is not available', () => {
    Object.defineProperty(window.navigator, 'vibrate', {
      value: undefined,
      writable: true,
    });

    // Should not throw
    expect(() => triggerHapticFeedback('light')).not.toThrow();
  });
});