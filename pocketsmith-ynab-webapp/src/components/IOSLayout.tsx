import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountsIcon,
  Sync as SyncIcon,
  Balance as BalanceIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
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

export const IOSLayout = ({
  children,
  title,
  showBackButton = false,
  onBackClick
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Add iOS class to body for global styling
    if (iOS) {
      document.body.classList.add('ios-device');
    }
    
    return () => {
      document.body.classList.remove('ios-device');
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const currentTab = tabRoutes.find(route => route.path === location.pathname)?.path || '/';

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
              px: 2, // Horizontal padding only
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

// Hook for detecting iOS and providing iOS-specific utilities
export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(iOS);
    setIsStandalone(standalone);
  }, []);

  return { isIOS, isStandalone };
};

export default IOSLayout;