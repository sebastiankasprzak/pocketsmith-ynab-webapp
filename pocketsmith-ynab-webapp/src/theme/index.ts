/**
 * Theme System Exports
 * Central export point for all theme-related utilities and design tokens
 */

export { iosDesignTokens, iosSemanticColors, iosTypographyScale, iosSpacing, iosBorderRadius, iosShadows, iosAnimationTiming, iosZIndex, iosBreakpoints, iosSafeAreas } from './iosDesignTokens';
export type { } from './theme.d';

// Re-export the main theme from the root theme file
export { theme } from '../theme';

// Utility functions for working with iOS design tokens
export const getIOSColor = (colorName: keyof typeof iosSemanticColors, mode: 'light' | 'dark' = 'light') => {
  return iosSemanticColors[colorName][mode];
};

export const getIOSSpacing = (size: keyof typeof iosSpacing) => {
  return `${iosSpacing[size]}px`;
};

export const getIOSBorderRadius = (size: keyof typeof iosBorderRadius) => {
  return `${iosBorderRadius[size]}px`;
};

export const getIOSShadow = (type: keyof typeof iosShadows.elevation | keyof typeof iosShadows.component) => {
  if (type in iosShadows.elevation) {
    return iosShadows.elevation[type as keyof typeof iosShadows.elevation];
  }
  return iosShadows.component[type as keyof typeof iosShadows.component];
};

export const getIOSTypography = (variant: keyof typeof iosTypographyScale) => {
  return iosTypographyScale[variant];
};

// CSS-in-JS helper for creating iOS-style components
export const createIOSStyles = (theme: any) => ({
  // Common iOS component styles
  iosCard: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.ios.borderRadius.component.card,
    boxShadow: theme.ios.shadows.component.card,
    padding: theme.ios.spacing.component.cardPadding,
    margin: `${theme.ios.spacing.component.cardMargin}px 0`,
    '&:hover': {
      boxShadow: theme.ios.shadows.component.cardElevated,
      transform: 'translateY(-1px)',
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
  
  iosButton: {
    borderRadius: theme.ios.borderRadius.component.button,
    minHeight: theme.ios.spacing.component.buttonMinHeight,
    padding: `${theme.ios.spacing.component.buttonPaddingVertical}px ${theme.ios.spacing.component.buttonPaddingHorizontal}px`,
    fontSize: theme.ios.typography.body.fontSize,
    fontFamily: theme.ios.typography.body.fontFamily,
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: theme.ios.shadows.component.button,
    '&:active': {
      opacity: 0.3,
      transform: 'scale(0.96)',
      boxShadow: theme.ios.shadows.component.buttonPressed,
    },
  },
  
  iosListItem: {
    minHeight: theme.ios.spacing.component.listItemMinHeight,
    padding: `${theme.ios.spacing.component.paddingSM}px ${theme.ios.spacing.component.listItemPadding}px`,
    borderBottom: `0.5px solid ${theme.palette.divider}`,
    '&:active': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  
  iosInput: {
    borderRadius: theme.ios.borderRadius.component.input,
    minHeight: theme.ios.spacing.component.buttonMinHeight,
    fontSize: theme.ios.typography.body.fontSize,
    fontFamily: theme.ios.typography.body.fontFamily,
    boxShadow: theme.ios.shadows.component.input,
    '&:focus-within': {
      boxShadow: theme.ios.shadows.component.inputFocused,
    },
  },
  
  iosSection: {
    marginBottom: theme.ios.spacing.layout.sectionSpacing,
    '& .section-header': {
      ...theme.ios.typography.headline,
      marginBottom: theme.ios.spacing.layout.elementSpacing,
      color: theme.palette.text.primary,
    },
  },
  
  // Safe area utilities
  iosSafeAreaTop: {
    paddingTop: `max(${theme.ios.safeAreas.insets.top}, ${theme.ios.safeAreas.fallback.top})`,
  },
  
  iosSafeAreaBottom: {
    paddingBottom: `max(${theme.ios.safeAreas.insets.bottom}, ${theme.ios.safeAreas.fallback.bottom})`,
  },
  
  iosSafeAreaLeft: {
    paddingLeft: `max(${theme.ios.safeAreas.insets.left}, ${theme.ios.safeAreas.fallback.left})`,
  },
  
  iosSafeAreaRight: {
    paddingRight: `max(${theme.ios.safeAreas.insets.right}, ${theme.ios.safeAreas.fallback.right})`,
  },
  
  iosSafeAreaAll: {
    paddingTop: `max(${theme.ios.safeAreas.insets.top}, ${theme.ios.safeAreas.fallback.top})`,
    paddingRight: `max(${theme.ios.safeAreas.insets.right}, ${theme.ios.safeAreas.fallback.right})`,
    paddingBottom: `max(${theme.ios.safeAreas.insets.bottom}, ${theme.ios.safeAreas.fallback.bottom})`,
    paddingLeft: `max(${theme.ios.safeAreas.insets.left}, ${theme.ios.safeAreas.fallback.left})`,
  },
});

// Import the design tokens for easier access
import { iosSemanticColors, iosTypographyScale, iosSpacing, iosBorderRadius, iosShadows, iosAnimationTiming, iosZIndex, iosBreakpoints, iosSafeAreas } from './iosDesignTokens';