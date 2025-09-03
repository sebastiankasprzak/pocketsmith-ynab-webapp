import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSMetricCardProps {
  value: string | number;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * IOSMetricCard component for displaying key metrics in iOS style
 * Provides clean, focused metric display with optional interactions
 */
export const IOSMetricCard = ({
  value,
  label,
  color = 'primary',
  icon,
  subtitle,
  onClick,
  className = ''
}: IOSMetricCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { triggerHaptic } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const getColorValue = () => {
    switch (color) {
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      case 'info':
        return '#007AFF';
      default:
        return theme.palette.primary.main;
    }
  };

  const handleClick = () => {
    if (onClick) {
      try {
        triggerHaptic('light');
      } catch (error) {
        console.debug('Haptic feedback failed:', error);
      }
      onClick();
    }
  };

  const handleMouseDown = () => {
    if (onClick) {
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
    if (onClick) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <Box
      className={`ios-metric-card ${className}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: '12px',
        border: isDark 
          ? '1px solid rgba(84, 84, 88, 0.2)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        opacity: isPressed ? 0.8 : 1,
        minHeight: 100,
        '&:hover': onClick ? {
          transform: isPressed ? 'scale(0.96)' : 'translateY(-2px)',
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        } : {},
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            marginBottom: 1,
            color: getColorValue(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}

      {/* Value */}
      <Typography
        variant="h3"
        sx={{
          fontSize: '28px',
          fontWeight: 700,
          color: getColorValue(),
          lineHeight: 1,
          marginBottom: 0.5,
          textAlign: 'center',
        }}
      >
        {value}
      </Typography>

      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '13px',
          fontWeight: 500,
          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      {/* Subtitle */}
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '11px',
            fontWeight: 400,
            color: isDark ? 'rgba(235, 235, 245, 0.4)' : 'rgba(60, 60, 67, 0.4)',
            textAlign: 'center',
            marginTop: 0.5,
            lineHeight: 1.2,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default IOSMetricCard;