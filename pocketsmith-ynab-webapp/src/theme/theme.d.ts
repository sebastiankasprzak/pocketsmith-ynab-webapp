/**
 * Material-UI Theme Extensions for iOS Design Tokens
 * Extends the default Material-UI theme interface to include iOS design tokens
 */

import '@mui/material/styles';
import { iosDesignTokens } from './iosDesignTokens';

declare module '@mui/material/styles' {
  interface Theme {
    ios: typeof iosDesignTokens;
  }

  interface ThemeOptions {
    ios?: typeof iosDesignTokens;
  }

  // Extend Typography variants to include iOS-specific variants
  interface TypographyVariants {
    largeTitle: React.CSSProperties;
    title1: React.CSSProperties;
    title2: React.CSSProperties;
    title3: React.CSSProperties;
    headline: React.CSSProperties;
    callout: React.CSSProperties;
    subheadline: React.CSSProperties;
    footnote: React.CSSProperties;
    caption1: React.CSSProperties;
    caption2: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    largeTitle?: React.CSSProperties;
    title1?: React.CSSProperties;
    title2?: React.CSSProperties;
    title3?: React.CSSProperties;
    headline?: React.CSSProperties;
    callout?: React.CSSProperties;
    subheadline?: React.CSSProperties;
    footnote?: React.CSSProperties;
    caption1?: React.CSSProperties;
    caption2?: React.CSSProperties;
  }
}

// Extend Typography props to include iOS variants
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    largeTitle: true;
    title1: true;
    title2: true;
    title3: true;
    headline: true;
    callout: true;
    subheadline: true;
    footnote: true;
    caption1: true;
    caption2: true;
  }
}

// Extend Palette to include iOS semantic colors
declare module '@mui/material/styles/createPalette' {
  interface Palette {
    ios: {
      systemBlue: {
        light: string;
        dark: string;
      };
      systemGreen: {
        light: string;
        dark: string;
      };
      systemIndigo: {
        light: string;
        dark: string;
      };
      systemOrange: {
        light: string;
        dark: string;
      };
      systemPink: {
        light: string;
        dark: string;
      };
      systemPurple: {
        light: string;
        dark: string;
      };
      systemRed: {
        light: string;
        dark: string;
      };
      systemTeal: {
        light: string;
        dark: string;
      };
      systemYellow: {
        light: string;
        dark: string;
      };
      systemGray: {
        light: string;
        dark: string;
      };
      label: {
        light: string;
        dark: string;
      };
      secondaryLabel: {
        light: string;
        dark: string;
      };
      tertiaryLabel: {
        light: string;
        dark: string;
      };
      quaternaryLabel: {
        light: string;
        dark: string;
      };
      systemFill: {
        light: string;
        dark: string;
      };
      secondarySystemFill: {
        light: string;
        dark: string;
      };
      tertiarySystemFill: {
        light: string;
        dark: string;
      };
      quaternarySystemFill: {
        light: string;
        dark: string;
      };
      separator: {
        light: string;
        dark: string;
      };
      opaqueSeparator: {
        light: string;
        dark: string;
      };
      link: {
        light: string;
        dark: string;
      };
      placeholderText: {
        light: string;
        dark: string;
      };
      systemBackground: {
        light: string;
        dark: string;
      };
      secondarySystemBackground: {
        light: string;
        dark: string;
      };
      tertiarySystemBackground: {
        light: string;
        dark: string;
      };
      systemGroupedBackground: {
        light: string;
        dark: string;
      };
      secondarySystemGroupedBackground: {
        light: string;
        dark: string;
      };
      tertiarySystemGroupedBackground: {
        light: string;
        dark: string;
      };
    };
  }

  interface PaletteOptions {
    ios?: {
      systemBlue?: {
        light?: string;
        dark?: string;
      };
      systemGreen?: {
        light?: string;
        dark?: string;
      };
      systemIndigo?: {
        light?: string;
        dark?: string;
      };
      systemOrange?: {
        light?: string;
        dark?: string;
      };
      systemPink?: {
        light?: string;
        dark?: string;
      };
      systemPurple?: {
        light?: string;
        dark?: string;
      };
      systemRed?: {
        light?: string;
        dark?: string;
      };
      systemTeal?: {
        light?: string;
        dark?: string;
      };
      systemYellow?: {
        light?: string;
        dark?: string;
      };
      systemGray?: {
        light?: string;
        dark?: string;
      };
      label?: {
        light?: string;
        dark?: string;
      };
      secondaryLabel?: {
        light?: string;
        dark?: string;
      };
      tertiaryLabel?: {
        light?: string;
        dark?: string;
      };
      quaternaryLabel?: {
        light?: string;
        dark?: string;
      };
      systemFill?: {
        light?: string;
        dark?: string;
      };
      secondarySystemFill?: {
        light?: string;
        dark?: string;
      };
      tertiarySystemFill?: {
        light?: string;
        dark?: string;
      };
      quaternarySystemFill?: {
        light?: string;
        dark?: string;
      };
      separator?: {
        light?: string;
        dark?: string;
      };
      opaqueSeparator?: {
        light?: string;
        dark?: string;
      };
      link?: {
        light?: string;
        dark?: string;
      };
      placeholderText?: {
        light?: string;
        dark?: string;
      };
      systemBackground?: {
        light?: string;
        dark?: string;
      };
      secondarySystemBackground?: {
        light?: string;
        dark?: string;
      };
      tertiarySystemBackground?: {
        light?: string;
        dark?: string;
      };
      systemGroupedBackground?: {
        light?: string;
        dark?: string;
      };
      secondarySystemGroupedBackground?: {
        light?: string;
        dark?: string;
      };
      tertiarySystemGroupedBackground?: {
        light?: string;
        dark?: string;
      };
    };
  }
}