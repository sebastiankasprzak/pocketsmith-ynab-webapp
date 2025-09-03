import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface IOSProgressIndicatorProps {
  progress?: number; // 0-100, undefined for indeterminate
  variant?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  thickness?: number;
  className?: string;
}

export const IOSProgressIndicator = ({
  progress,
  variant = 'linear',
  size = 'medium',
  color = 'primary',
  showLabel = false,
  label,
  thickness,
  className = ''
}: IOSProgressIndicatorProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getColorValue = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      default:
        return theme.palette.primary.main;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return variant === 'circular' ? 20 : 2;
      case 'large':
        return variant === 'circular' ? 48 : 8;
      default: // medium
        return variant === 'circular' ? 32 : 4;
    }
  };

  const getThickness = () => {
    if (thickness !== undefined) return thickness;
    switch (size) {
      case 'small':
        return 2;
      case 'large':
        return 4;
      default:
        return 3;
    }
  };

  const clampedProgress = progress !== undefined ? Math.max(0, Math.min(100, progress)) : undefined;
  const isIndeterminate = progress === undefined;

  if (variant === 'circular') {
    return (
      <Box
        className={`ios-progress-indicator circular ${className}`}
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: showLabel ? 1 : 0,
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Background circle */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={getSize()}
            thickness={getThickness()}
            sx={{
              color: isDark 
                ? 'rgba(120, 120, 128, 0.24)' 
                : 'rgba(120, 120, 128, 0.16)',
              position: 'absolute',
            }}
          />
          
          {/* Progress circle */}
          <CircularProgress
            variant={isIndeterminate ? 'indeterminate' : 'determinate'}
            value={clampedProgress}
            size={getSize()}
            thickness={getThickness()}
            sx={{
              color: getColorValue(),
              animationDuration: isIndeterminate ? '1.4s' : undefined,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          
          {/* Center label for determinate progress */}
          {!isIndeterminate && showLabel && !label && (
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                component="div"
                sx={{
                  color: 'text.secondary',
                  fontSize: size === 'small' ? '10px' : size === 'large' ? '14px' : '12px',
                  fontWeight: 600,
                }}
              >
                {Math.round(clampedProgress || 0)}%
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* External label */}
        {showLabel && label && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: size === 'small' ? '11px' : size === 'large' ? '15px' : '13px',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    );
  }

  // Linear variant
  const height = getSize();
  
  return (
    <Box
      className={`ios-progress-indicator linear ${className}`}
      sx={{ width: '100%' }}
    >
      {/* Label */}
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
              fontWeight: 500,
            }}
          >
            {label || 'Progress'}
          </Typography>
          {!isIndeterminate && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
                fontWeight: 600,
              }}
            >
              {Math.round(clampedProgress || 0)}%
            </Typography>
          )}
        </Box>
      )}
      
      {/* Progress track */}
      <Box
        sx={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: isDark 
            ? 'rgba(120, 120, 128, 0.24)' 
            : 'rgba(120, 120, 128, 0.16)',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Progress fill */}
        <Box
          sx={{
            width: isIndeterminate ? '30%' : `${clampedProgress}%`,
            height: '100%',
            backgroundColor: getColorValue(),
            borderRadius: 'inherit',
            transition: isIndeterminate ? 'none' : 'width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            animation: isIndeterminate ? 'indeterminateProgress 2s ease-in-out infinite' : 'none',
            '@keyframes indeterminateProgress': {
              '0%': {
                transform: 'translateX(-100%)',
              },
              '50%': {
                transform: 'translateX(0%)',
              },
              '100%': {
                transform: 'translateX(400%)',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default IOSProgressIndicator;