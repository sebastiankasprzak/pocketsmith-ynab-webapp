import React, { type ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountsIcon,
  Sync as SyncIcon,
  Balance as BalanceIcon,
} from '@mui/icons-material';
import { useIOSDetection } from '../hooks/useIOSDetection';

interface IOSLayoutProps {
  children: ReactNode;
  title?: string;
}

interface TabRoute {
  path: string;
  label: string;
  icon: ReactNode;
}

const tabRoutes: TabRoute[] = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/accounts', label: 'Accounts', icon: <AccountsIcon /> },
  { path: '/sync', label: 'Sync', icon: <SyncIcon /> },
  { path: '/settings', label: 'Balance', icon: <BalanceIcon /> },
];

export const IOSLayout = ({ children, title }: IOSLayoutProps) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { capabilities, shouldUseIOSExperience, deviceClass } = useIOSDetection();

  useEffect(() => {
    // Add iOS-specific classes to body for global styling
    if (capabilities.isIOS) {
      document.body.classList.add('ios-device');
      
      if (capabilities.isIPad) {
        document.body.classList.add('ios-ipad');
      }
      
      if (capabilities.hasNotch) {
        document.body.classList.add('ios-notch');
      }
      
      if (capabilities.hasDynamicIsland) {
        document.body.classList.add('ios-dynamic-island');
      }
      
      if (capabilities.supportsHaptics) {
        document.body.classList.add('ios-haptics');
      }
      
      if (capabilities.supportsStandalone) {
        document.body.classList.add('ios-standalone');
      }
      
      document.body.classList.add(`ios-version-${capabilities.version}`);
      document.body.classList.add(`device-${deviceClass}`);
    }
    
    return () => {
      // Clean up all iOS-related classes
      document.body.classList.remove(
        'ios-device',
        'ios-ipad',
        'ios-notch',
        'ios-dynamic-island',
        'ios-haptics',
        'ios-standalone',
        `ios-version-${capabilities.version}`,
        `device-${deviceClass}`
      );
    };
  }, [capabilities, deviceClass]);



  // Map legacy paths to iOS tab paths for proper tab highlighting
  const pathMapping: Record<string, string> = {
    '/account-mappings': '/accounts',
    '/sync-status': '/sync',
    '/balance-comparison': '/settings',
  };

  const getCurrentTab = () => {
    const currentPath = location.pathname;
    // Check if current path is a legacy path and map it to iOS tab path
    const mappedPath = pathMapping[currentPath];
    if (mappedPath) {
      return mappedPath;
    }
    // Check if current path matches any tab route directly
    const directMatch = tabRoutes.find(route => route.path === currentPath);
    return directMatch?.path || '/';
  };

  const currentTab = getCurrentTab();

  // Always render iOS layout when this component is used
  // The parent component (App.tsx) already handles the iOS detection logic

  try {
    return (
      <Box 
        className="pwa-fullscreen-container"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100dvh',
          width: '100%',
          // Remove backgroundColor - let CSS handle it
        }}
      >
        {/* Content area with proper safe area handling */}
        <Box 
          className="pwa-content-area"
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            flex: 1,
            backgroundColor: theme.palette.background.default,
          }}
        >
          {/* Content area */}
          <Box 
            className="ios-content ios-scroll-container ios-hide-scrollbar"
            sx={{ 
              flex: 1, 
              overflow: 'auto',
              px: 0, // Remove horizontal padding - let components handle their own spacing
              pb: 2  // Bottom padding only
            }}
          >
            {children}
          </Box>

          {/* iOS-style tab bar */}
          <Box className={`ios-tab-bar ios-safe-area-bottom ${theme.palette.mode === 'dark' ? 'dark' : ''}`}>
            {tabRoutes.map((route) => (
              <Box
                key={route.path}
                className={`ios-tab-item ${currentTab === route.path ? 'active' : ''}`}
                onClick={() => navigate(route.path)}
                component="button"
                sx={{ 
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <Box className="ios-tab-icon">
                  {route.icon}
                </Box>
                <Typography variant="caption" component="span">
                  {route.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  } catch (error) {
    console.error('IOSLayout render error:', error);
    // Fallback to simple layout if there's an error
    return (
      <Box sx={{ p: 2, minHeight: '100vh' }}>
        {children}
      </Box>
    );
  }
};

// Legacy hook - kept for backward compatibility
// Use the enhanced useIOSDetection from hooks/useIOSDetection.ts instead
export const useIOSDetectionLegacy = () => {
  const { capabilities } = useIOSDetection();
  
  return { 
    isIOS: capabilities.isIOS, 
    isStandalone: capabilities.supportsStandalone 
  };
};

export default IOSLayout;