/**
 * Tests for iOS Theme System
 */

import { renderHook } from '@testing-library/react';
import { useIOSTheme } from '../useIOSTheme';
import { iosDesignTokens } from '../../theme/iosDesignTokens';

describe('useIOSTheme', () => {
  it('should create a theme with iOS design tokens', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    // Check that the theme has iOS design tokens
    expect(theme.ios).toBeDefined();
    expect(theme.ios.colors).toBeDefined();
    expect(theme.ios.typography).toBeDefined();
    expect(theme.ios.spacing).toBeDefined();
    expect(theme.ios.borderRadius).toBeDefined();
    expect(theme.ios.shadows).toBeDefined();
  });

  it('should use light mode colors by default', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe(iosDesignTokens.colors.systemBlue.light);
    expect(theme.palette.background.default).toBe(iosDesignTokens.colors.systemGroupedBackground.light);
  });

  it('should use dark mode colors when prefersDarkMode is true', () => {
    const { result } = renderHook(() => useIOSTheme(true));
    const theme = result.current;

    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe(iosDesignTokens.colors.systemBlue.dark);
    expect(theme.palette.background.default).toBe(iosDesignTokens.colors.systemBackground.dark);
  });

  it('should include iOS typography variants', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    // Check that iOS typography variants are included
    expect(theme.typography.largeTitle).toBeDefined();
    expect(theme.typography.title1).toBeDefined();
    expect(theme.typography.title2).toBeDefined();
    expect(theme.typography.title3).toBeDefined();
    expect(theme.typography.headline).toBeDefined();
    expect(theme.typography.callout).toBeDefined();
    expect(theme.typography.subheadline).toBeDefined();
    expect(theme.typography.footnote).toBeDefined();
    expect(theme.typography.caption1).toBeDefined();
    expect(theme.typography.caption2).toBeDefined();
  });

  it('should use SF Pro font family', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    expect(theme.typography.fontFamily).toContain('SF Pro Text');
    expect(theme.typography.body1.fontFamily).toContain('SF Pro Text');
    expect(theme.typography.largeTitle.fontFamily).toContain('SF Pro Display');
  });

  it('should include iOS component overrides', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    // Check that component overrides are applied
    expect(theme.components?.MuiButton?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiCard?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiTextField?.styleOverrides?.root).toBeDefined();
    expect(theme.components?.MuiListItem?.styleOverrides?.root).toBeDefined();
  });

  it('should use iOS spacing system', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    // Material-UI spacing is a function, so we test the base unit
    expect(theme.spacing(1)).toBe(`${iosDesignTokens.spacing.base}px`);
    expect(theme.spacing(2)).toBe(`${iosDesignTokens.spacing.base * 2}px`);
  });

  it('should use iOS border radius', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    expect(theme.shape.borderRadius).toBe(iosDesignTokens.borderRadius.md);
  });

  it('should include iOS semantic colors in palette', () => {
    const { result } = renderHook(() => useIOSTheme(false));
    const theme = result.current;

    expect(theme.palette.ios).toBeDefined();
    expect(theme.palette.ios.systemBlue).toBeDefined();
    expect(theme.palette.ios.systemGreen).toBeDefined();
    expect(theme.palette.ios.systemRed).toBeDefined();
    expect(theme.palette.ios.label).toBeDefined();
    expect(theme.palette.ios.separator).toBeDefined();
  });

  it('should apply dark mode overrides correctly', () => {
    const { result } = renderHook(() => useIOSTheme(true));
    const theme = result.current;

    // Check that dark mode component overrides are applied
    const appBarOverrides = theme.components?.MuiAppBar?.styleOverrides?.root as any;
    expect(appBarOverrides?.backgroundColor).toContain(iosDesignTokens.colors.secondarySystemBackground.dark);
    
    const cardOverrides = theme.components?.MuiCard?.styleOverrides?.root as any;
    expect(cardOverrides?.boxShadow).toBe(iosDesignTokens.shadows.dark.card);
  });
});