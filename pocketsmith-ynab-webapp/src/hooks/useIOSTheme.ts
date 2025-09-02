import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { useMemo } from 'react';
import { iosDesignTokens } from '../theme/iosDesignTokens';

// Extract design tokens for easier access
const { colors, typography, spacing, borderRadius, shadows } = iosDesignTokens;

// iOS-specific color palette using design tokens
const iosColors = {
  primary: {
    main: colors.systemBlue.light,
    light: colors.systemTeal.light,
    dark: colors.systemBlue.dark,
  },
  secondary: {
    main: colors.systemIndigo.light,
    light: colors.systemPurple.light,
    dark: colors.systemIndigo.dark,
  },
  error: {
    main: colors.systemRed.light,
    light: colors.systemPink.light,
    dark: colors.systemRed.dark,
  },
  warning: {
    main: colors.systemOrange.light,
    light: colors.systemYellow.light,
    dark: colors.systemOrange.dark,
  },
  success: {
    main: colors.systemGreen.light,
    light: colors.systemGreen.light,
    dark: colors.systemGreen.dark,
  },
  grey: {
    50: colors.systemGray6.light,
    100: colors.systemGray5.light,
    200: colors.systemGray4.light,
    300: colors.systemGray3.light,
    400: colors.systemGray2.light,
    500: colors.systemGray.light,
    600: colors.systemGray2.dark,
    700: colors.systemGray3.dark,
    800: colors.systemGray4.dark,
    900: colors.systemGray6.dark,
  },
};

// iOS-specific typography using design tokens
const iosTypography = {
  fontFamily: typography.body.fontFamily,
  h1: {
    ...typography.largeTitle,
    fontWeight: 400,
  },
  h2: {
    ...typography.title1,
    fontWeight: 400,
  },
  h3: {
    ...typography.title2,
    fontWeight: 400,
  },
  h4: {
    ...typography.title3,
    fontWeight: 400,
  },
  h5: {
    ...typography.headline,
  },
  h6: {
    ...typography.subheadline,
    fontWeight: 600,
  },
  body1: {
    ...typography.body,
  },
  body2: {
    ...typography.callout,
  },
  caption: {
    ...typography.caption1,
  },
  button: {
    ...typography.body,
    fontWeight: 600,
    textTransform: 'none' as const,
  },
  // Additional iOS typography variants
  largeTitle: typography.largeTitle,
  title1: typography.title1,
  title2: typography.title2,
  title3: typography.title3,
  headline: typography.headline,
  callout: typography.callout,
  subheadline: typography.subheadline,
  footnote: typography.footnote,
  caption1: typography.caption1,
  caption2: typography.caption2,
};

// iOS-specific component overrides using design tokens
const iosComponentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.component.button,
        minHeight: spacing.component.buttonMinHeight,
        paddingLeft: spacing.component.buttonPaddingHorizontal,
        paddingRight: spacing.component.buttonPaddingHorizontal,
        paddingTop: spacing.component.buttonPaddingVertical,
        paddingBottom: spacing.component.buttonPaddingVertical,
        textTransform: 'none' as const,
        fontWeight: 600,
        fontSize: typography.body.fontSize,
        fontFamily: typography.body.fontFamily,
        boxShadow: shadows.component.button,
        '&:active': {
          opacity: 0.3,
          transform: 'scale(0.96)',
          boxShadow: shadows.component.buttonPressed,
        },
        '&:hover': {
          boxShadow: shadows.component.button,
        },
      },
      contained: {
        boxShadow: shadows.component.button,
        '&:hover': {
          boxShadow: shadows.elevation.md,
        },
        '&:active': {
          boxShadow: shadows.component.buttonPressed,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.component.card,
        boxShadow: shadows.component.card,
        padding: spacing.component.cardPadding,
        margin: `${spacing.component.cardMargin}px 0`,
        '&:hover': {
          boxShadow: shadows.component.cardElevated,
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: borderRadius.component.input,
          minHeight: spacing.component.buttonMinHeight,
          fontSize: typography.body.fontSize,
          fontFamily: typography.body.fontFamily,
          boxShadow: shadows.component.input,
          '& input': {
            fontSize: '16px', // Prevent zoom on iOS
            padding: `${spacing.component.paddingMD}px`,
          },
          '&:focus-within': {
            boxShadow: shadows.component.inputFocused,
          },
        },
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        minHeight: spacing.component.listItemMinHeight,
        padding: `${spacing.component.paddingSM}px ${spacing.component.listItemPadding}px`,
        borderBottom: `0.5px solid ${colors.separator.light}`,
        '&:active': {
          backgroundColor: colors.systemFill.light,
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        minHeight: spacing.component.listItemMinHeight,
        padding: `${spacing.component.paddingSM}px ${spacing.component.listItemPadding}px`,
        borderRadius: borderRadius.component.button,
        '&:hover': {
          backgroundColor: colors.systemFill.light,
        },
        '&:active': {
          backgroundColor: colors.secondarySystemFill.light,
          transform: 'scale(0.98)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: colors.secondarySystemBackground.light + 'CC', // 80% opacity
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `0.5px solid ${colors.separator.light}`,
        boxShadow: 'none',
        color: colors.label.light,
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: `${iosDesignTokens.safeAreas.heights.navigationBar}px !important`,
        paddingLeft: spacing.component.paddingMD,
        paddingRight: spacing.component.paddingMD,
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        backgroundColor: colors.secondarySystemBackground.light + 'CC', // 80% opacity
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${colors.separator.light}`,
        height: iosDesignTokens.safeAreas.heights.tabBar,
        paddingBottom: 'env(safe-area-inset-bottom)',
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        fontSize: typography.caption2.fontSize,
        fontWeight: 500,
        fontFamily: typography.caption2.fontFamily,
        '&.Mui-selected': {
          color: colors.systemBlue.light,
        },
        '&:not(.Mui-selected)': {
          color: colors.systemGray.light,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.component.card,
        boxShadow: shadows.component.card,
      },
      elevation1: {
        boxShadow: shadows.elevation.sm,
      },
      elevation2: {
        boxShadow: shadows.elevation.md,
      },
      elevation3: {
        boxShadow: shadows.elevation.lg,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: borderRadius.component.modal,
        boxShadow: shadows.component.modal,
        margin: spacing.component.marginMD,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.component.badge,
        fontSize: typography.footnote.fontSize,
        fontFamily: typography.footnote.fontFamily,
        fontWeight: 500,
        height: 'auto',
        padding: `${spacing.xs}px ${spacing.sm}px`,
      },
    },
  },
};

export const useIOSTheme = (prefersDarkMode: boolean = false): Theme => {
  return useMemo(() => {
    // Create dark mode component overrides
    const darkModeOverrides = prefersDarkMode ? {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.secondarySystemBackground.dark + 'CC', // 80% opacity
            borderBottomColor: colors.separator.dark,
            color: colors.label.dark,
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: colors.secondarySystemBackground.dark + 'CC', // 80% opacity
            borderTopColor: colors.separator.dark,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              color: colors.systemBlue.dark,
            },
            '&:not(.Mui-selected)': {
              color: colors.systemGray.dark,
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderBottomColor: colors.separator.dark,
            '&:active': {
              backgroundColor: colors.systemFill.dark,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: colors.systemFill.dark,
            },
            '&:active': {
              backgroundColor: colors.secondarySystemFill.dark,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: shadows.dark.card,
            '&:hover': {
              boxShadow: shadows.dark.cardElevated,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: shadows.dark.card,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            boxShadow: shadows.dark.modal,
          },
        },
      },
    } : {};

    const baseTheme = createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
        primary: {
          main: prefersDarkMode ? colors.systemBlue.dark : colors.systemBlue.light,
          light: prefersDarkMode ? colors.systemTeal.dark : colors.systemTeal.light,
          dark: prefersDarkMode ? colors.systemBlue.light : colors.systemBlue.dark,
        },
        secondary: {
          main: prefersDarkMode ? colors.systemIndigo.dark : colors.systemIndigo.light,
          light: prefersDarkMode ? colors.systemPurple.dark : colors.systemPurple.light,
          dark: prefersDarkMode ? colors.systemIndigo.light : colors.systemIndigo.dark,
        },
        error: {
          main: prefersDarkMode ? colors.systemRed.dark : colors.systemRed.light,
          light: prefersDarkMode ? colors.systemPink.dark : colors.systemPink.light,
          dark: prefersDarkMode ? colors.systemRed.light : colors.systemRed.dark,
        },
        warning: {
          main: prefersDarkMode ? colors.systemOrange.dark : colors.systemOrange.light,
          light: prefersDarkMode ? colors.systemYellow.dark : colors.systemYellow.light,
          dark: prefersDarkMode ? colors.systemOrange.light : colors.systemOrange.dark,
        },
        success: {
          main: prefersDarkMode ? colors.systemGreen.dark : colors.systemGreen.light,
          light: prefersDarkMode ? colors.systemGreen.dark : colors.systemGreen.light,
          dark: prefersDarkMode ? colors.systemGreen.light : colors.systemGreen.dark,
        },
        grey: prefersDarkMode ? {
          50: colors.systemGray6.dark,
          100: colors.systemGray5.dark,
          200: colors.systemGray4.dark,
          300: colors.systemGray3.dark,
          400: colors.systemGray2.dark,
          500: colors.systemGray.dark,
          600: colors.systemGray2.light,
          700: colors.systemGray3.light,
          800: colors.systemGray4.light,
          900: colors.systemGray6.light,
        } : iosColors.grey,
        background: {
          default: prefersDarkMode ? colors.systemBackground.dark : colors.systemGroupedBackground.light,
          paper: prefersDarkMode ? colors.secondarySystemGroupedBackground.dark : colors.systemBackground.light,
        },
        text: {
          primary: prefersDarkMode ? colors.label.dark : colors.label.light,
          secondary: prefersDarkMode ? colors.secondaryLabel.dark : colors.secondaryLabel.light,
          disabled: prefersDarkMode ? colors.tertiaryLabel.dark : colors.tertiaryLabel.light,
        },
        divider: prefersDarkMode ? colors.separator.dark : colors.separator.light,
        action: {
          active: prefersDarkMode ? colors.label.dark : colors.label.light,
          hover: prefersDarkMode ? colors.systemFill.dark : colors.systemFill.light,
          selected: prefersDarkMode ? colors.secondarySystemFill.dark : colors.secondarySystemFill.light,
          disabled: prefersDarkMode ? colors.quaternaryLabel.dark : colors.quaternaryLabel.light,
          disabledBackground: prefersDarkMode ? colors.quaternarySystemFill.dark : colors.quaternarySystemFill.light,
        },
        // Add iOS semantic colors to the palette
        ios: {
          systemBlue: colors.systemBlue,
          systemGreen: colors.systemGreen,
          systemIndigo: colors.systemIndigo,
          systemOrange: colors.systemOrange,
          systemPink: colors.systemPink,
          systemPurple: colors.systemPurple,
          systemRed: colors.systemRed,
          systemTeal: colors.systemTeal,
          systemYellow: colors.systemYellow,
          systemGray: colors.systemGray,
          label: colors.label,
          secondaryLabel: colors.secondaryLabel,
          tertiaryLabel: colors.tertiaryLabel,
          quaternaryLabel: colors.quaternaryLabel,
          systemFill: colors.systemFill,
          secondarySystemFill: colors.secondarySystemFill,
          tertiarySystemFill: colors.tertiarySystemFill,
          quaternarySystemFill: colors.quaternarySystemFill,
          separator: colors.separator,
          opaqueSeparator: colors.opaqueSeparator,
          link: colors.link,
          placeholderText: colors.placeholderText,
          systemBackground: colors.systemBackground,
          secondarySystemBackground: colors.secondarySystemBackground,
          tertiarySystemBackground: colors.tertiarySystemBackground,
          systemGroupedBackground: colors.systemGroupedBackground,
          secondarySystemGroupedBackground: colors.secondarySystemGroupedBackground,
          tertiarySystemGroupedBackground: colors.tertiarySystemGroupedBackground,
        },
      },
      typography: iosTypography,
      shape: {
        borderRadius: borderRadius.md,
      },
      spacing: spacing.base,
      breakpoints: {
        values: iosDesignTokens.breakpoints.values,
      },
      zIndex: {
        mobileStepper: iosDesignTokens.zIndex.docked,
        fab: iosDesignTokens.zIndex.docked,
        speedDial: iosDesignTokens.zIndex.docked,
        appBar: iosDesignTokens.zIndex.sticky,
        drawer: iosDesignTokens.zIndex.dropdown,
        modal: iosDesignTokens.zIndex.modal,
        snackbar: iosDesignTokens.zIndex.toast,
        tooltip: iosDesignTokens.zIndex.tooltip,
      },
      components: {
        ...iosComponentOverrides,
        ...darkModeOverrides,
      },
    });

    // Add custom iOS design tokens to the theme
    (baseTheme as any).ios = iosDesignTokens;

    return baseTheme;
  }, [prefersDarkMode]);
};

export default useIOSTheme;