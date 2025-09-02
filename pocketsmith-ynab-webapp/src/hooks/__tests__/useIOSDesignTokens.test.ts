/**
 * Tests for iOS Design Tokens Hook
 */

import { renderHook } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { useIOSDesignTokens, useIOSStyles } from '../useIOSDesignTokens';
import { useIOSTheme } from '../useIOSTheme';
import { iosDesignTokens } from '../../theme/iosDesignTokens';
import React from 'react';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Wrapper component for theme provider
const createWrapper = (darkMode = false) => {
  return ({ children }: { children: React.ReactNode }) => {
    const theme = useIOSTheme(darkMode);
    return React.createElement(ThemeProvider, { theme }, children);
  };
};

describe('useIOSDesignTokens', () => {
  it('should provide access to all design tokens', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.colors).toBeDefined();
    expect(tokens.typography).toBeDefined();
    expect(tokens.spacing).toBeDefined();
    expect(tokens.borderRadius).toBeDefined();
    expect(tokens.shadows).toBeDefined();
    expect(tokens.animation).toBeDefined();
    expect(tokens.zIndex).toBeDefined();
    expect(tokens.breakpoints).toBeDefined();
    expect(tokens.safeAreas).toBeDefined();
  });

  it('should provide utility functions', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(typeof tokens.getColor).toBe('function');
    expect(typeof tokens.getSpacing).toBe('function');
    expect(typeof tokens.getBorderRadius).toBe('function');
    expect(typeof tokens.getShadow).toBe('function');
    expect(typeof tokens.getTypography).toBe('function');
  });

  it('should return correct colors for light mode', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.getColor('systemBlue')).toBe(iosDesignTokens.colors.systemBlue.light);
    expect(tokens.getColor('systemBlue', 'light')).toBe(iosDesignTokens.colors.systemBlue.light);
    expect(tokens.getColor('systemBlue', 'dark')).toBe(iosDesignTokens.colors.systemBlue.dark);
  });

  it('should return correct colors for dark mode', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(true),
    });

    const tokens = result.current;

    // In dark mode, default should be dark variant
    expect(tokens.getColor('systemBlue')).toBe(iosDesignTokens.colors.systemBlue.dark);
  });

  it('should return correct spacing values', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.getSpacing('md')).toBe('16px');
    expect(tokens.getSpacing('lg')).toBe('24px');
    expect(tokens.getSpacing('xs')).toBe('4px');
  });

  it('should return correct border radius values', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.getBorderRadius('md')).toBe('8px');
    expect(tokens.getBorderRadius('lg')).toBe('12px');
    expect(tokens.getBorderRadius('full')).toBe('9999px');
  });

  it('should return correct shadow values', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.getShadow('card')).toBe(iosDesignTokens.shadows.component.card);
    expect(tokens.getShadow('md')).toBe(iosDesignTokens.shadows.elevation.md);
    expect(tokens.getShadow('nonexistent')).toBe('none');
  });

  it('should return correct typography values', () => {
    const { result } = renderHook(() => useIOSDesignTokens(), {
      wrapper: createWrapper(false),
    });

    const tokens = result.current;

    expect(tokens.getTypography('largeTitle')).toEqual(iosDesignTokens.typography.largeTitle);
    expect(tokens.getTypography('body')).toEqual(iosDesignTokens.typography.body);
    expect(tokens.getTypography('caption1')).toEqual(iosDesignTokens.typography.caption1);
  });
});

describe('useIOSStyles', () => {
  it('should provide iOS component styles', () => {
    const { result } = renderHook(() => useIOSStyles(), {
      wrapper: createWrapper(false),
    });

    const styles = result.current;

    expect(styles.card).toBeDefined();
    expect(styles.button).toBeDefined();
    expect(styles.listItem).toBeDefined();
    expect(styles.input).toBeDefined();
    expect(styles.section).toBeDefined();
    expect(styles.safeArea).toBeDefined();
    expect(styles.typography).toBeDefined();
  });

  it('should include proper card styles', () => {
    const { result } = renderHook(() => useIOSStyles(), {
      wrapper: createWrapper(false),
    });

    const styles = result.current;

    expect(styles.card.borderRadius).toBe('8px');
    expect(styles.card.boxShadow).toBe(iosDesignTokens.shadows.component.card);
    expect(styles.card.padding).toBe('16px');
  });

  it('should include proper button styles', () => {
    const { result } = renderHook(() => useIOSStyles(), {
      wrapper: createWrapper(false),
    });

    const styles = result.current;

    expect(styles.button.borderRadius).toBe('8px');
    expect(styles.button.minHeight).toBe(iosDesignTokens.spacing.component.buttonMinHeight);
    expect(styles.button.fontWeight).toBe(600);
    expect(styles.button.textTransform).toBe('none');
  });

  it('should include safe area utilities', () => {
    const { result } = renderHook(() => useIOSStyles(), {
      wrapper: createWrapper(false),
    });

    const styles = result.current;

    expect(styles.safeArea.top).toBeDefined();
    expect(styles.safeArea.bottom).toBeDefined();
    expect(styles.safeArea.left).toBeDefined();
    expect(styles.safeArea.right).toBeDefined();
    expect(styles.safeArea.all).toBeDefined();
  });

  it('should include typography utilities', () => {
    const { result } = renderHook(() => useIOSStyles(), {
      wrapper: createWrapper(false),
    });

    const styles = result.current;

    expect(styles.typography.largeTitle).toEqual(iosDesignTokens.typography.largeTitle);
    expect(styles.typography.body).toEqual(iosDesignTokens.typography.body);
    expect(styles.typography.caption1).toEqual(iosDesignTokens.typography.caption1);
  });
});