import { createTheme } from '@mui/material/styles';

// Create Material-UI theme with responsive design
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      fontWeight: 500,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '24px',
          paddingBottom: '24px',
          width: '100%',
          maxWidth: '100%',
          '@media (max-width:600px)': {
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '12px',
            paddingRight: '12px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          minHeight: '44px', // Accessibility: minimum touch target size
          '&:focus-visible': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px', // Accessibility: minimum touch target size
          minHeight: '44px',
          '&:focus-visible': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:focus-within': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px #1976d2',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:600px)': {
            padding: '12px 8px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: '48px', // Accessibility: adequate touch target
          '&:focus-visible': {
            outline: '2px solid #1976d2',
            outlineOffset: '-2px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '44px', // Accessibility: minimum touch target size
          },
          '& .MuiInputBase-input:focus': {
            outline: 'none', // Let MUI handle focus styles
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        // Override default MenuProps to prevent scroll issues
        MenuProps: {
          disableScrollLock: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        },
      },
      styleOverrides: {
        select: {
          minHeight: '44px', // Accessibility: minimum touch target size
          display: 'flex',
          alignItems: 'center',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 'auto',
          minHeight: '32px',
          '& .MuiChip-label': {
            padding: '6px 12px',
            '@media (max-width:600px)': {
              padding: '4px 8px',
              fontSize: '0.75rem',
            },
          },
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        // Disable scroll-based repositioning to prevent scrollTop errors
        disableScrollLock: true,
      },
      styleOverrides: {
        root: {
          // Ensure popover doesn't interfere with scroll handling
          '& .MuiBackdrop-root': {
            // Prevent backdrop from interfering with scroll events
            pointerEvents: 'none',
          },
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        // Disable scroll lock for Menu components (which use Popover internally)
        disableScrollLock: true,
      },
    },
  },
});