import React, { ReactNode, useState } from 'react';
import { Button, useTheme } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSButtonProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'plain' | 'filled' | 'tinted';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  pressAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const IOSButton = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  hapticFeedback = true,
  pressAnimation = true,
  size = 'medium',
  disabled = false,
  onClick,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { impact } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    if (hapticFeedback) {
      impact(variant === 'destructive' ? 'medium' : 'light');
    }
    onClick?.(event);
  };

  const handleMouseDown = () => {
    if (!disabled && pressAnimation) {
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
    if (!disabled && pressAnimation) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 32,
          fontSize: '15px',
          padding: '6px 16px',
        };
      case 'large':
        return {
          minHeight: 50,
          fontSize: '19px',
          padding: '14px 28px',
        };
      default: // medium
        return {
          minHeight: 44,
          fontSize: '17px',
          padding: '12px 24px',
        };
    }
  };

  const getButtonStyles = () => {
    const sizeStyles = getSizeStyles();
    const baseStyles = {
      ...sizeStyles,
      borderRadius: size === 'large' ? '12px' : '8px',
      fontWeight: 600,
      textTransform: 'none' as const,
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      transform: isPressed && pressAnimation ? 'scale(0.94)' : 'scale(1)',
      opacity: disabled ? 0.5 : (isPressed ? 0.6 : 1),
      border: 'none',
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none',
      },
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#007AFF',
          color: 'white',
          '&:hover': {
            backgroundColor: '#0051D5',
          },
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#007AFF',
          border: '1px solid #007AFF',
          '&:hover': {
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
          },
        };
      case 'destructive':
        return {
          ...baseStyles,
          backgroundColor: '#FF3B30',
          color: 'white',
          '&:hover': {
            backgroundColor: '#D70015',
          },
        };
      case 'plain':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#007AFF',
          '&:hover': {
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
          },
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: isDark ? 'rgba(120, 120, 128, 0.2)' : 'rgba(120, 120, 128, 0.16)',
          color: isDark ? '#FFFFFF' : '#000000',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(120, 120, 128, 0.3)' : 'rgba(120, 120, 128, 0.24)',
          },
        };
      case 'tinted':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(0, 122, 255, 0.15)',
          color: '#007AFF',
          '&:hover': {
            backgroundColor: 'rgba(0, 122, 255, 0.25)',
          },
        };
      default:
        return baseStyles;
    }
  };

  return (
    <Button
      className={`ios-button ${className}`}
      sx={getButtonStyles()}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </Button>
  );
};

export default IOSButton;