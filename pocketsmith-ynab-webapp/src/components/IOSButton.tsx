import React, { ReactNode } from 'react';
import { Button, ButtonProps, useTheme } from '@mui/material';

interface IOSButtonProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'plain';
  fullWidth?: boolean;
}

export const IOSButton = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const theme = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      minHeight: 44,
      borderRadius: '8px',
      fontSize: '17px',
      fontWeight: 600,
      textTransform: 'none' as const,
      transition: 'opacity 0.2s ease',
      '&:active': {
        opacity: 0.3,
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
      default:
        return baseStyles;
    }
  };

  return (
    <Button
      className={`ios-button ${className}`}
      sx={getButtonStyles()}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </Button>
  );
};

export default IOSButton;