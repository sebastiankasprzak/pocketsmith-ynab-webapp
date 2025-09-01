import { createTheme, Theme } from '@mui/material/styles';
import { useMemo } from 'react';

// iOS-specific color palette
const iosColors = {
  primary: {
    main: '#007AFF',
    light: '#5AC8FA',
    dark: '#0051D5',
  },
  secondary: {
    main: '#5856D6',
    light: '#AF52DE',
    dark: '#32D74B',
  },
  error: {
    main: '#FF3B30',
    light: '#FF6961',
    dark: '#D70015',
  },
  warning: {
    main: '#FF9500',
    light: '#FFCC02',
    dark: '#FF6D00',
  },
  success: {
    main: '#32D74B',
    light: '#30DB5B',
    dark: '#248A3D',
  },
  grey: {
    50: '#F2F2F7',
    100: '#E5E5EA',
    200: '#D1D1D6',
    300: '#C7C7CC',
    400: '#AEAEB2',
    500: '#8E8E93',
    600: '#636366',
    700: '#48484A',
    800: '#3A3A3C',
    900: '#1C1C1E',
  },
};

// iOS-specific typography
const iosTypography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    'SF Pro Display',
    'SF Pro Text',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.125rem', // 34px - Large Title
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '1.75rem', // 28px - Title 1
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.375rem', // 22px - Title 2
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem', // 20px - Title 3
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.0625rem', // 17px - Headline
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '0.9375rem', // 15px - Subheadline
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '1.0625rem', // 17px - Body
    fontWeight: 400,
    lineHeight: 1.4,
  },
  body2: {
    fontSize: '0.9375rem', // 15px - Callout
    fontWeight: 400,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: '0.75rem', // 12px - Caption 1
    fontWeight: 400,
    lineHeight: 1.3,
  },
  button: {
    fontSize: '1.0625rem', // 17px
    fontWeight: 600,
    textTransform: 'none' as const,
  },
};

// iOS-specific component overrides
const iosComponentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        minHeight: 44,
        textTransform: 'none' as const,
        fontWeight: 600,
        fontSize: '1.0625rem',
        '&:active': {
          opacity: 0.3,
        },
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          minHeight: 44,
          fontSize: '1.0625rem',
          '& input': {
            fontSize: '16px', // Prevent zoom on iOS
          },
        },
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        minHeight: 44,
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)',
        '&:active': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(248, 248, 248, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)',
        boxShadow: 'none',
        color: '#000',
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: '44px !important',
        paddingLeft: 16,
        paddingRight: 16,
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(248, 248, 248, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.1)',
        height: 49,
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        fontSize: '0.625rem',
        fontWeight: 500,
        '&.Mui-selected': {
          color: '#007AFF',
        },
      },
    },
  },
};

export const useIOSTheme = (prefersDarkMode: boolean = false): Theme => {
  return useMemo(() => {
    const baseTheme = createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
        primary: iosColors.primary,
        secondary: iosColors.secondary,
        error: iosColors.error,
        warning: iosColors.warning,
        success: iosColors.success,
        grey: iosColors.grey,
        background: {
          default: prefersDarkMode ? '#000000' : '#F2F2F7',
          paper: prefersDarkMode ? '#1C1C1E' : '#FFFFFF',
        },
        text: {
          primary: prefersDarkMode ? '#FFFFFF' : '#000000',
          secondary: prefersDarkMode ? '#EBEBF5' : '#8E8E93',
        },
      },
      typography: iosTypography,
      shape: {
        borderRadius: 8,
      },
      components: {
        ...iosComponentOverrides,
        // Dark mode overrides
        ...(prefersDarkMode && {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: 'rgba(28, 28, 30, 0.8)',
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
              },
            },
          },
          MuiBottomNavigation: {
            styleOverrides: {
              root: {
                backgroundColor: 'rgba(28, 28, 30, 0.8)',
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
          MuiListItem: {
            styleOverrides: {
              root: {
                borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                '&:active': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              },
            },
          },
        }),
      },
    });

    return baseTheme;
  }, [prefersDarkMode]);
};

export default useIOSTheme;