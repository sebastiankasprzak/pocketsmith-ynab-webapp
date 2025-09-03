import React, { ReactNode, useState } from 'react';
import { Card, CardContent, CardActions, Box, useTheme } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSCardProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
  hapticFeedback?: boolean;
  pressAnimation?: boolean;
  disabled?: boolean;
}

export const IOSCard = ({
  children,
  actions,
  className = '',
  onClick,
  elevated = false,
  hapticFeedback = true,
  pressAnimation = true,
  disabled = false
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { impact } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) return;
    
    if (hapticFeedback) {
      impact('light');
    }
    onClick?.(event);
  };

  const handleMouseDown = () => {
    if (!disabled && onClick && pressAnimation) {
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
    if (!disabled && onClick && pressAnimation) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <Card
      className={`ios-card ${isDark ? 'dark' : ''} ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        cursor: onClick && !disabled ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isPressed && pressAnimation ? 'scale(0.96)' : 'scale(1)',
        opacity: disabled ? 0.5 : (isPressed ? 0.8 : 1),
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: '12px',
        border: isDark 
          ? '1px solid rgba(84, 84, 88, 0.2)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: elevated 
          ? (isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.15)')
          : (isDark 
              ? '0 1px 3px rgba(0, 0, 0, 0.2)' 
              : '0 1px 3px rgba(0, 0, 0, 0.1)'),
        '&:hover': onClick && !disabled ? {
          transform: 'translateY(-1px)',
          boxShadow: elevated 
            ? (isDark 
                ? '0 6px 16px rgba(0, 0, 0, 0.4)' 
                : '0 6px 16px rgba(0, 0, 0, 0.2)')
            : (isDark 
                ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                : '0 2px 8px rgba(0, 0, 0, 0.15)'),
        } : {},
      }}
    >
      <CardContent sx={{ 
        padding: '16px',
        '&:last-child': { paddingBottom: actions ? '16px' : '16px' }
      }}>
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ 
          padding: '8px 16px 16px 16px',
          justifyContent: 'flex-end'
        }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default IOSCard;