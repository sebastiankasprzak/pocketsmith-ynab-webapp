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
  Settings as SettingsIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

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
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
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
        className="ios-app-container ios-safe-area"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          width: '100%'
        }}
      >
        {/* iOS-style header */}
        <Box className={`ios-header ${theme.palette.mode === 'dark' ? 'dark' : ''}`}>
          <Box className="ios-safe-area-top">
            <Box className="ios-nav-bar">
              {showBackButton ? (
                <button className="ios-nav-button" onClick={handleBackClick}>
                  ← Back
                </button>
              ) : (
                <Box sx={{ minWidth: 44 }} />
              )}
              
              <Typography className="ios-nav-title" component="h1">
                {title || 'PS-YNAB Sync'}
              </Typography>
              
              <Box sx={{ minWidth: 44 }} />
            </Box>
          </Box>
        </Box>

        {/* Content area */}
        <Box 
          className="ios-content ios-scroll-container ios-hide-scrollbar"
          sx={{ flex: 1, overflow: 'auto' }}
        >
          <Box sx={{ p: 2 }}>
            {children}
          </Box>
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
    );
  } catch (error) {
    console.error('IOSLayout render error:', error);
    // Fallback to simple layout if there's an error
    return (
      <Box sx={{ p: 2, minHeight: '100vh' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title || 'PS-YNAB Sync'}
        </Typography>
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