import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface IOSSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
}

export const IOSSpinner = ({ size = 'medium', color = 'primary' }: IOSSpinnerProps) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 40;
      default:
        return 30;
    }
  };

  return (
    <CircularProgress
      size={getSize()}
      thickness={3}
      sx={{
        color: color === 'inherit' ? 'currentColor' : `${color}.main`,
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(360deg)'
          }
        }
      }}
    />
  );
};

interface IOSSkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const IOSSkeleton = ({
  width = '100%',
  height = '1em',
  variant = 'text',
  animation = 'pulse'
}: IOSSkeletonProps) => {
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'rectangular':
        return '8px';
      default:
        return '4px';
    }
  };

  const getAnimation = () => {
    switch (animation) {
      case 'wave':
        return 'wave 1.6s ease-in-out 0.5s infinite';
      case 'pulse':
        return 'pulse 1.5s ease-in-out 0.5s infinite';
      default:
        return 'none';
    }
  };

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: getBorderRadius(),
        animation: getAnimation(),
        '@keyframes pulse': {
          '0%': {
            opacity: 1
          },
          '50%': {
            opacity: 0.4
          },
          '100%': {
            opacity: 1
          }
        },
        '@keyframes wave': {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '50%': {
            transform: 'translateX(100%)'
          },
          '100%': {
            transform: 'translateX(100%)'
          }
        }
      }}
    />
  );
};

interface IOSLoadingOverlayProps {
  loading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const IOSLoadingOverlay = ({
  loading,
  message = 'Loading...',
  children
}: IOSLoadingOverlayProps) => {
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            borderRadius: 'inherit',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0
              },
              '100%': {
                opacity: 1
              }
            }
          }}
        >
          <IOSSpinner size="medium" />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

interface IOSProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

export const IOSProgressBar = ({
  progress,
  height = 4,
  color = 'primary',
  showLabel = false
}: IOSProgressBarProps) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Box sx={{ width: '100%' }}>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(clampedProgress)}%
          </Typography>
        </Box>
      )}
      
      <Box
        sx={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'rgba(118, 118, 128, 0.12)',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: `${color}.main`,
            borderRadius: 'inherit',
            transition: 'width 0.3s ease',
            background: `linear-gradient(90deg, 
              ${color === 'primary' ? '#007AFF' : 
                color === 'success' ? '#34C759' :
                color === 'warning' ? '#FF9500' : '#FF3B30'} 0%, 
              ${color === 'primary' ? '#5AC8FA' : 
                color === 'success' ? '#30D158' :
                color === 'warning' ? '#FFCC02' : '#FF453A'} 100%)`
          }}
        />
      </Box>
    </Box>
  );
};

interface IOSPulsingDotProps {
  size?: number;
  color?: string;
}

export const IOSPulsingDot = ({ size = 8, color = '#34C759' }: IOSPulsingDotProps) => {
  return (
    <Box
      sx={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(0.95)',
            boxShadow: `0 0 0 0 ${color}40`
          },
          '70%': {
            transform: 'scale(1)',
            boxShadow: `0 0 0 ${size}px ${color}00`
          },
          '100%': {
            transform: 'scale(0.95)',
            boxShadow: `0 0 0 0 ${color}00`
          }
        }
      }}
    />
  );
};

export default {
  IOSSpinner,
  IOSSkeleton,
  IOSLoadingOverlay,
  IOSProgressBar,
  IOSPulsingDot
};