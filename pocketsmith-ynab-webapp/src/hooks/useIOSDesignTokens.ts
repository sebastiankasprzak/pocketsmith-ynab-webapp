/**
 * iOS Design Tokens Hook
 * Provides easy access to iOS design tokens with theme context
 */

import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { iosDesignTokens } from '../theme/iosDesignTokens';

export interface IOSDesignTokensHook {
  colors: typeof iosDesignTokens.colors;
  typography: typeof iosDesignTokens.typography;
  spacing: typeof iosDesignTokens.spacing;
  borderRadius: typeof iosDesignTokens.borderRadius;
  shadows: typeof iosDesignTokens.shadows;
  animation: typeof iosDesignTokens.animation;
  zIndex: typeof iosDesignTokens.zIndex;
  breakpoints: typeof iosDesignTokens.breakpoints;
  safeAreas: typeof iosDesignTokens.safeAreas;
  
  // Utility functions
  getColor: (colorName: keyof typeof iosDesignTokens.colors, mode?: 'light' | 'dark') => string;
  getSpacing: (size: keyof typeof iosDesignTokens.spacing) => string;
  getBorderRadius: (size: keyof typeof iosDesignTokens.borderRadius) => string;
  getShadow: (type: string) => string;
  getTypography: (variant: keyof typeof iosDesignTokens.typography) => typeof iosDesignTokens.typography[keyof typeof iosDesignTokens.typography];
}

/**
 * Hook for accessing iOS design tokens with theme context
 * Provides utility functions for common design token operations
 */
export const useIOSDesignTokens = (): IOSDesignTokensHook => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const utilities = useMemo(() => ({
    getColor: (colorName: keyof typeof iosDesignTokens.colors, mode: 'light' | 'dark' = isDarkMode ? 'dark' : 'light') => {
      const color = iosDesignTokens.colors[colorName];
      if (typeof color === 'object' && 'light' in color && 'dark' in color) {
        return color[mode];
      }
      return color as string;
    },

    getSpacing: (size: keyof typeof iosDesignTokens.spacing) => {
      const value = iosDesignTokens.spacing[size];
      return typeof value === 'number' ? `${value}px` : value;
    },

    getBorderRadius: (size: keyof typeof iosDesignTokens.borderRadius) => {
      const value = iosDesignTokens.borderRadius[size];
      return typeof value === 'number' ? `${value}px` : value;
    },

    getShadow: (type: string) => {
      // Check elevation shadows first
      if (type in iosDesignTokens.shadows.elevation) {
        return iosDesignTokens.shadows.elevation[type as keyof typeof iosDesignTokens.shadows.elevation];
      }
      
      // Check component shadows
      if (type in iosDesignTokens.shadows.component) {
        return iosDesignTokens.shadows.component[type as keyof typeof iosDesignTokens.shadows.component];
      }
      
      // Check dark mode shadows if in dark mode
      if (isDarkMode && type in iosDesignTokens.shadows.dark) {
        return iosDesignTokens.shadows.dark[type as keyof typeof iosDesignTokens.shadows.dark];
      }
      
      return 'none';
    },

    getTypography: (variant: keyof typeof iosDesignTokens.typography) => {
      return iosDesignTokens.typography[variant];
    },
  }), [isDarkMode]);

  return {
    colors: iosDesignTokens.colors,
    typography: iosDesignTokens.typography,
    spacing: iosDesignTokens.spacing,
    borderRadius: iosDesignTokens.borderRadius,
    shadows: iosDesignTokens.shadows,
    animation: iosDesignTokens.animation,
    zIndex: iosDesignTokens.zIndex,
    breakpoints: iosDesignTokens.breakpoints,
    safeAreas: iosDesignTokens.safeAreas,
    ...utilities,
  };
};

/**
 * Hook for creating iOS-style component styles
 * Returns common style objects for iOS components
 */
export const useIOSStyles = () => {
  const theme = useTheme();
  const tokens = useIOSDesignTokens();

  return useMemo(() => ({
    // Card styles
    card: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: tokens.getBorderRadius('md'),
      boxShadow: tokens.getShadow('card'),
      padding: tokens.getSpacing('md'),
      margin: `${tokens.getSpacing('md')} 0`,
      '&:hover': {
        boxShadow: tokens.getShadow('cardElevated'),
        transform: 'translateY(-1px)',
      },
      transition: `all ${tokens.animation.duration.short}ms ${tokens.animation.easing.standard}`,
    },

    // Button styles
    button: {
      borderRadius: tokens.getBorderRadius('md'),
      minHeight: tokens.spacing.component.buttonMinHeight,
      padding: `${tokens.spacing.component.buttonPaddingVertical}px ${tokens.spacing.component.buttonPaddingHorizontal}px`,
      fontSize: tokens.typography.body.fontSize,
      fontFamily: tokens.typography.body.fontFamily,
      fontWeight: 600,
      textTransform: 'none' as const,
      boxShadow: tokens.getShadow('button'),
      '&:active': {
        opacity: 0.3,
        transform: 'scale(0.96)',
        boxShadow: tokens.getShadow('buttonPressed'),
      },
      transition: `all ${tokens.animation.duration.shortest}ms ${tokens.animation.easing.sharp}`,
    },

    // List item styles
    listItem: {
      minHeight: tokens.spacing.component.listItemMinHeight,
      padding: `${tokens.spacing.component.paddingSM}px ${tokens.spacing.component.listItemPadding}px`,
      borderBottom: `0.5px solid ${theme.palette.divider}`,
      '&:active': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:last-child': {
        borderBottom: 'none',
      },
    },

    // Input styles
    input: {
      borderRadius: tokens.getBorderRadius('md'),
      minHeight: tokens.spacing.component.buttonMinHeight,
      fontSize: tokens.typography.body.fontSize,
      fontFamily: tokens.typography.body.fontFamily,
      boxShadow: tokens.getShadow('input'),
      '&:focus-within': {
        boxShadow: tokens.getShadow('inputFocused'),
      },
    },

    // Section styles
    section: {
      marginBottom: tokens.spacing.layout.sectionSpacing,
      '& .section-header': {
        ...tokens.typography.headline,
        marginBottom: tokens.spacing.layout.elementSpacing,
        color: theme.palette.text.primary,
      },
    },

    // Safe area utilities
    safeArea: {
      top: {
        paddingTop: `max(${tokens.safeAreas.insets.top}, ${tokens.safeAreas.fallback.top})`,
      },
      bottom: {
        paddingBottom: `max(${tokens.safeAreas.insets.bottom}, ${tokens.safeAreas.fallback.bottom})`,
      },
      left: {
        paddingLeft: `max(${tokens.safeAreas.insets.left}, ${tokens.safeAreas.fallback.left})`,
      },
      right: {
        paddingRight: `max(${tokens.safeAreas.insets.right}, ${tokens.safeAreas.fallback.right})`,
      },
      all: {
        paddingTop: `max(${tokens.safeAreas.insets.top}, ${tokens.safeAreas.fallback.top})`,
        paddingRight: `max(${tokens.safeAreas.insets.right}, ${tokens.safeAreas.fallback.right})`,
        paddingBottom: `max(${tokens.safeAreas.insets.bottom}, ${tokens.safeAreas.fallback.bottom})`,
        paddingLeft: `max(${tokens.safeAreas.insets.left}, ${tokens.safeAreas.fallback.left})`,
      },
    },

    // Typography utilities
    typography: {
      largeTitle: tokens.typography.largeTitle,
      title1: tokens.typography.title1,
      title2: tokens.typography.title2,
      title3: tokens.typography.title3,
      headline: tokens.typography.headline,
      body: tokens.typography.body,
      callout: tokens.typography.callout,
      subheadline: tokens.typography.subheadline,
      footnote: tokens.typography.footnote,
      caption1: tokens.typography.caption1,
      caption2: tokens.typography.caption2,
    },
  }), [theme, tokens]);
};

export default useIOSDesignTokens;