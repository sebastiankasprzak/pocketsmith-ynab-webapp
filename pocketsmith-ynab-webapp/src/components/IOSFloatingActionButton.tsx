import React, { ReactNode, useState } from 'react';
import { Fab, useTheme } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useIOSDetection } from '../hooks/useIOSDetection';

interface IOSFloatingActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * iOS-style Floating Action Button with native interactions
 * Provides iOS-style FAB with haptic feedback and press animations
 */
export const IOSFloatingActionButton = ({
  children,
  onClick,
  disabled = false,
  color = 'primary',
  size = 'large',
  className = ''
}: IOSFloatingActionButtonProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { capabilities } = useIOSDetection();
  const { triggerFeedback } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    if (capabilities.supportsHaptics) {
      triggerFeedback('medium');
    }
    onClick?.();
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const getColorValue = () => {
    switch (color) {
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'info':
        return '#007AFF';
      case 'warning':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  return (
    <Fab
      className={`ios-fab ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      size={size}
      sx={{
        position: 'fixed',
        bottom: capabilities.hasNotch || capabilities.hasDynamicIsland ? 34 : 24,
        right: 24,
        zIndex: theme.zIndex.fab,
        backgroundColor: getColorValue(),
        color: 'white',
        width: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
        height: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
        boxShadow: isDark 
          ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
          : '0 8px 24px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isPressed ? 'scale(0.9)' : 'scale(1)',
        opacity: disabled ? 0.5 : (isPressed ? 0.8 : 1),
        '&:hover': !disabled ? {
          backgroundColor: getColorValue(),
          transform: isPressed ? 'scale(0.9)' : 'scale(1.05)',
          boxShadow: isDark 
            ? '0 12px 32px rgba(0, 0, 0, 0.5)' 
            : '0 12px 32px rgba(0, 0, 0, 0.25)',
        } : {},
        '&:active': {
          transform: 'scale(0.9)',
        },
        // iOS-specific styling
        border: 'none',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {children}
    </Fab>
  );
};

export default IOSFloatingActionButton;