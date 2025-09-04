import React, { type ReactNode, useState, useCallback } from 'react';
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
 * 
 * Positioning: Automatically positions above the iOS tab bar (55px on phone, 65px on iPad)
 * plus safe area insets and margin to ensure visibility on all iOS devices.
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
  const { triggerHaptic } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (capabilities.supportsHaptics) {
      triggerHaptic('medium');
    }
    onClick?.();
  }, [disabled, capabilities.supportsHaptics, triggerHaptic, onClick]);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

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

  // Use native button for iOS to ensure proper touch handling
  if (capabilities.isIOS) {
    return (
      <button
        className={`ios-fab-native ${className}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        aria-label="Add new mapping"
        style={{
          position: 'fixed',
          bottom: capabilities.isIPad 
            ? `calc(65px + env(safe-area-inset-bottom, 0px) + 16px)`
            : `calc(55px + env(safe-area-inset-bottom, 0px) + 16px)`,
          right: '24px',
          zIndex: 1300,
          backgroundColor: getColorValue(),
          color: 'white',
          width: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
          height: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
          borderRadius: '50%',
          border: 'none',
          boxShadow: isDark 
            ? '0 8px 24px rgba(0, 0, 0, 0.4)' 
            : '0 8px 24px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
          transform: isPressed ? 'scale(0.9)' : 'scale(1)',
          opacity: disabled ? 0.5 : (isPressed ? 0.8 : 1),
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        {children}
      </button>
    );
  }

  // Fallback to MUI Fab for non-iOS
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
      // iOS-specific accessibility and touch improvements
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Add new mapping"
      // Ensure the button is properly touchable on iOS
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
      }}
      sx={{
        position: 'fixed',
        // Position above the iOS tab bar (55px) plus safe area insets plus margin
        bottom: `calc(55px + env(safe-area-inset-bottom, 0px) + 16px)`,
        right: 24,
        zIndex: 1300, // Higher than MUI default fab (1050) and modal backdrop (1300)
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
        // Ensure proper touch handling on iOS
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        cursor: disabled ? 'default' : 'pointer',
        // Responsive adjustments for different screen sizes
        '@media screen and (min-width: 768px)': {
          // iPad - tab bar is 65px
          bottom: `calc(65px + env(safe-area-inset-bottom, 0px) + 16px)`,
        },
        '@media screen and (orientation: landscape) and (max-height: 500px)': {
          // Landscape mode - tab bar is 65px
          bottom: `calc(65px + env(safe-area-inset-bottom, 0px) + 16px)`,
        },
      }}
    >
      {children}
    </Fab>
  );
};

export default IOSFloatingActionButton;