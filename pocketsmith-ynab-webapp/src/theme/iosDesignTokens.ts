/**
 * iOS Design Tokens
 * Complete design token system following Apple's Human Interface Guidelines
 * Includes semantic colors, typography, spacing, shadows, and more
 */

// iOS Color System - Semantic Colors
export const iosSemanticColors = {
  // Primary System Colors
  systemBlue: {
    light: '#007AFF',
    dark: '#0A84FF',
  },
  systemGreen: {
    light: '#32D74B',
    dark: '#30DB5B',
  },
  systemIndigo: {
    light: '#5856D6',
    dark: '#5E5CE6',
  },
  systemOrange: {
    light: '#FF9500',
    dark: '#FF9F0A',
  },
  systemPink: {
    light: '#FF2D92',
    dark: '#FF2D92',
  },
  systemPurple: {
    light: '#AF52DE',
    dark: '#BF5AF2',
  },
  systemRed: {
    light: '#FF3B30',
    dark: '#FF453A',
  },
  systemTeal: {
    light: '#5AC8FA',
    dark: '#64D2FF',
  },
  systemYellow: {
    light: '#FFCC00',
    dark: '#FFD60A',
  },

  // Gray Colors
  systemGray: {
    light: '#8E8E93',
    dark: '#8E8E93',
  },
  systemGray2: {
    light: '#AEAEB2',
    dark: '#636366',
  },
  systemGray3: {
    light: '#C7C7CC',
    dark: '#48484A',
  },
  systemGray4: {
    light: '#D1D1D6',
    dark: '#3A3A3C',
  },
  systemGray5: {
    light: '#E5E5EA',
    dark: '#2C2C2E',
  },
  systemGray6: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
  },

  // Background Colors
  systemBackground: {
    light: '#FFFFFF',
    dark: '#000000',
  },
  secondarySystemBackground: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
  },
  tertiarySystemBackground: {
    light: '#FFFFFF',
    dark: '#2C2C2E',
  },

  // Grouped Background Colors
  systemGroupedBackground: {
    light: '#F2F2F7',
    dark: '#000000',
  },
  secondarySystemGroupedBackground: {
    light: '#FFFFFF',
    dark: '#1C1C1E',
  },
  tertiarySystemGroupedBackground: {
    light: '#F2F2F7',
    dark: '#2C2C2E',
  },

  // Fill Colors
  systemFill: {
    light: 'rgba(120, 120, 128, 0.2)',
    dark: 'rgba(120, 120, 128, 0.36)',
  },
  secondarySystemFill: {
    light: 'rgba(120, 120, 128, 0.16)',
    dark: 'rgba(120, 120, 128, 0.32)',
  },
  tertiarySystemFill: {
    light: 'rgba(118, 118, 128, 0.12)',
    dark: 'rgba(118, 118, 128, 0.24)',
  },
  quaternarySystemFill: {
    light: 'rgba(116, 116, 128, 0.08)',
    dark: 'rgba(118, 118, 128, 0.18)',
  },

  // Label Colors
  label: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  secondaryLabel: {
    light: 'rgba(60, 60, 67, 0.6)',
    dark: 'rgba(235, 235, 245, 0.6)',
  },
  tertiaryLabel: {
    light: 'rgba(60, 60, 67, 0.3)',
    dark: 'rgba(235, 235, 245, 0.3)',
  },
  quaternaryLabel: {
    light: 'rgba(60, 60, 67, 0.18)',
    dark: 'rgba(235, 235, 245, 0.16)',
  },

  // Separator Colors
  separator: {
    light: 'rgba(60, 60, 67, 0.29)',
    dark: 'rgba(84, 84, 88, 0.6)',
  },
  opaqueSeparator: {
    light: '#C6C6C8',
    dark: '#38383A',
  },

  // Link Color
  link: {
    light: '#007AFF',
    dark: '#0A84FF',
  },

  // Placeholder Text Color
  placeholderText: {
    light: 'rgba(60, 60, 67, 0.3)',
    dark: 'rgba(235, 235, 245, 0.3)',
  },
};

// iOS Typography Scale - SF Pro Font Family
export const iosTypographyScale = {
  // Large Title
  largeTitle: {
    fontSize: '34px',
    lineHeight: '41px',
    fontWeight: 400,
    letterSpacing: '0.37px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Title 1
  title1: {
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: 400,
    letterSpacing: '0.36px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Title 2
  title2: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 400,
    letterSpacing: '0.35px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Title 3
  title3: {
    fontSize: '20px',
    lineHeight: '25px',
    fontWeight: 400,
    letterSpacing: '0.38px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Headline
  headline: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: 600,
    letterSpacing: '-0.43px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Body
  body: {
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: 400,
    letterSpacing: '-0.43px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Callout
  callout: {
    fontSize: '16px',
    lineHeight: '21px',
    fontWeight: 400,
    letterSpacing: '-0.32px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Subheadline
  subheadline: {
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '-0.24px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Footnote
  footnote: {
    fontSize: '13px',
    lineHeight: '18px',
    fontWeight: 400,
    letterSpacing: '-0.08px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Caption 1
  caption1: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    letterSpacing: '0px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },

  // Caption 2
  caption2: {
    fontSize: '11px',
    lineHeight: '13px',
    fontWeight: 400,
    letterSpacing: '0.07px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
};

// iOS Spacing System
export const iosSpacing = {
  // Base spacing unit (4px)
  base: 4,

  // Spacing scale
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  xxl: 48,  // 48px
  xxxl: 64, // 64px

  // Component-specific spacing
  component: {
    // Padding
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,

    // Margins
    marginXS: 4,
    marginSM: 8,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    // List item spacing
    listItemPadding: 16,
    listItemMinHeight: 44,

    // Button spacing
    buttonPaddingHorizontal: 16,
    buttonPaddingVertical: 12,
    buttonMinHeight: 44,

    // Card spacing
    cardPadding: 16,
    cardMargin: 16,

    // Section spacing
    sectionSpacing: 32,
    sectionHeaderSpacing: 8,
  },

  // Layout spacing
  layout: {
    containerPadding: 16,
    sectionSpacing: 32,
    componentSpacing: 16,
    elementSpacing: 8,
  },
};

// iOS Border Radius System
export const iosBorderRadius = {
  // Base border radius values
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,

  // Component-specific border radius
  component: {
    button: 8,
    card: 12,
    modal: 16,
    sheet: 16,
    input: 8,
    badge: 16,
    avatar: 9999,
    image: 8,
  },

  // Interactive elements
  interactive: {
    small: 6,
    medium: 8,
    large: 12,
  },
};

// iOS Shadow System
export const iosShadows = {
  // Elevation shadows
  elevation: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    xl: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xxl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },

  // Component-specific shadows
  component: {
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cardElevated: '0 4px 20px rgba(0, 0, 0, 0.08)',
    modal: '0 10px 40px rgba(0, 0, 0, 0.15)',
    sheet: '0 -2px 20px rgba(0, 0, 0, 0.1)',
    button: '0 1px 2px rgba(0, 0, 0, 0.05)',
    buttonPressed: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
    input: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    inputFocused: '0 0 0 3px rgba(0, 122, 255, 0.1)',
  },

  // Dark mode shadows
  dark: {
    card: '0 1px 3px rgba(0, 0, 0, 0.3)',
    cardElevated: '0 4px 20px rgba(0, 0, 0, 0.4)',
    modal: '0 10px 40px rgba(0, 0, 0, 0.6)',
    sheet: '0 -2px 20px rgba(0, 0, 0, 0.4)',
  },
};

// iOS Animation Timing
export const iosAnimationTiming = {
  // Easing functions
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Duration values
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
};

// iOS Z-Index Scale
export const iosZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// iOS Breakpoints
export const iosBreakpoints = {
  values: {
    xs: 0,
    sm: 375,   // iPhone SE
    md: 414,   // iPhone Pro
    lg: 768,   // iPad
    xl: 1024,  // iPad Pro
    xxl: 1366, // Large iPad Pro
  },
  
  // Device-specific breakpoints
  device: {
    iphoneSE: 375,
    iphone: 414,
    iphoneMax: 428,
    ipadMini: 768,
    ipad: 820,
    ipadPro: 1024,
    ipadProLarge: 1366,
  },
};

// iOS Safe Areas
export const iosSafeAreas = {
  // Safe area insets
  insets: {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  },

  // Fallback values
  fallback: {
    top: '20px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  },

  // Component heights
  heights: {
    statusBar: 20,
    navigationBar: 44,
    tabBar: 49,
    tabBarSafeArea: 83, // 49 + 34 (safe area)
  },
};

// Export all design tokens as a single object
export const iosDesignTokens = {
  colors: iosSemanticColors,
  typography: iosTypographyScale,
  spacing: iosSpacing,
  borderRadius: iosBorderRadius,
  shadows: iosShadows,
  animation: iosAnimationTiming,
  zIndex: iosZIndex,
  breakpoints: iosBreakpoints,
  safeAreas: iosSafeAreas,
};

export default iosDesignTokens;