import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useIOSDetection } from '../hooks/useIOSDetection';

interface IOSTabBarItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface IOSTabBarProps {
  tabs: IOSTabBarItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showLabels?: boolean;
  variant?: 'filled' | 'transparent';
}

export const IOSTabBar = ({
  tabs,
  activeTab,
  onTabChange,
  showLabels = true,
  variant = 'filled'
}: IOSTabBarProps) => {
  const theme = useTheme();
  const { selection } = useHapticFeedback();
  const { capabilities } = useIOSDetection();
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  const isDark = theme.palette.mode === 'dark';

  const handleTabPress = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    
    selection();
    onTabChange(tabId);
  };

  const handleTabPressStart = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    setPressedTab(tabId);
  };

  const handleTabPressEnd = () => {
    setPressedTab(null);
  };

  const getTabBarBackground = () => {
    if (variant === 'transparent') {
      return isDark 
        ? 'rgba(28, 28, 30, 0.8)' 
        : 'rgba(248, 248, 248, 0.8)';
    }
    return isDark ? '#1C1C1E' : '#F8F8F8';
  };

  const getTabBarHeight = () => {
    const baseHeight = 49;
    const safeAreaHeight = capabilities.hasNotch || capabilities.hasDynamicIsland ? 34 : 0;
    return baseHeight + safeAreaHeight;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        backgroundColor: getTabBarBackground(),
        backdropFilter: variant === 'transparent' ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: variant === 'transparent' ? 'blur(20px)' : 'none',
        borderTop: `0.5px solid ${isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)'}`,
        height: getTabBarHeight(),
        paddingBottom: capabilities.hasNotch || capabilities.hasDynamicIsland 
          ? 'env(safe-area-inset-bottom, 34px)' 
          : 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: 49,
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isPressed = pressedTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <Box
              key={tab.id}
              onMouseDown={() => handleTabPressStart(tab.id, isDisabled)}
              onMouseUp={handleTabPressEnd}
              onMouseLeave={handleTabPressEnd}
              onTouchStart={() => handleTabPressStart(tab.id, isDisabled)}
              onTouchEnd={handleTabPressEnd}
              onClick={() => handleTabPress(tab.id, isDisabled)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 49,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.3 : 1,
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.1s ease-in-out',
                position: 'relative',
                py: 0.5,
              }}
            >
              {/* Icon Container */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  mb: showLabels ? 0.25 : 0,
                  '& svg': {
                    fontSize: '24px',
                    color: isActive 
                      ? (isDark ? '#0A84FF' : '#007AFF')
                      : (isDark ? '#8E8E93' : '#8E8E93'),
                    transition: 'color 0.2s ease-in-out',
                  },
                }}
              >
                {tab.icon}
                
                {/* Badge */}
                {tab.badge && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#FF3B30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        lineHeight: 1,
                      }}
                    >
                      {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Label */}
              {showLabels && (
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isActive 
                      ? (isDark ? '#0A84FF' : '#007AFF')
                      : (isDark ? '#8E8E93' : '#8E8E93'),
                    transition: 'color 0.2s ease-in-out',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  }}
                >
                  {tab.label}
                </Typography>
              )}

              {/* Active Indicator (subtle glow effect) */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 1,
                    backgroundColor: isDark 
                      ? 'rgba(10, 132, 255, 0.1)' 
                      : 'rgba(0, 122, 255, 0.1)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default IOSTabBar;