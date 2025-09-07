import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Sync as SyncIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';

export type SyncProgressState = 'idle' | 'syncing' | 'completed' | 'failed' | 'pending';

interface IOSProgressIndicatorProps {
  progress?: number; // 0-100, undefined for indeterminate
  variant?: 'linear' | 'circular' | 'sync';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  thickness?: number;
  className?: string;
  // Sync-specific props
  syncState?: SyncProgressState;
  animated?: boolean;
  showIcon?: boolean;
  transitionsCount?: number;
  estimatedTime?: string;
}

export const IOSProgressIndicator = ({
  progress,
  variant = 'linear',
  size = 'medium',
  color = 'primary',
  showLabel = false,
  label,
  thickness,
  className = '',
  syncState = 'idle',
  animated = false,
  showIcon = false,
  transitionsCount,
  estimatedTime
}: IOSProgressIndicatorProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getColorValue = () => {
    // Override color based on sync state
    if (syncState && variant === 'sync') {
      switch (syncState) {
        case 'syncing':
          return '#007AFF';
        case 'completed':
          return '#34C759';
        case 'failed':
          return '#FF3B30';
        case 'pending':
          return '#FF9500';
        default:
          return isDark ? '#8E8E93' : '#C7C7CC';
      }
    }

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

  const getSyncIcon = () => {
    switch (syncState) {
      case 'syncing':
        return <SyncIcon />;
      case 'completed':
        return <CompleteIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return <SyncIcon />;
    }
  };

  const getSyncLabel = () => {
    if (label) return label;
    
    switch (syncState) {
      case 'syncing':
        return transitionsCount ? `Syncing ${transitionsCount} transactions` : 'Syncing...';
      case 'completed':
        return transitionsCount ? `Completed ${transitionsCount} transactions` : 'Completed';
      case 'failed':
        return 'Sync failed';
      case 'pending':
        return estimatedTime ? `Starting in ${estimatedTime}` : 'Pending...';
      default:
        return 'Ready to sync';
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
  const isIndeterminate = progress === undefined || syncState === 'syncing';

  // Sync variant - specialized for sync operations
  if (variant === 'sync') {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    const shouldAnimate = animated || syncState === 'syncing' || syncState === 'pending';
    
    return (
      <Box
        className={`ios-progress-indicator sync ${className}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* Icon */}
        {showIcon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: iconSize + 8,
              height: iconSize + 8,
              borderRadius: '50%',
              backgroundColor: `${getColorValue()}20`,
              color: getColorValue(),
              animation: shouldAnimate ? 'syncPulse 2s ease-in-out infinite' : 'none',
              '@keyframes syncPulse': {
                '0%': { 
                  transform: 'scale(1)',
                  backgroundColor: `${getColorValue()}20`,
                },
                '50%': { 
                  transform: 'scale(1.1)',
                  backgroundColor: `${getColorValue()}30`,
                },
                '100%': { 
                  transform: 'scale(1)',
                  backgroundColor: `${getColorValue()}20`,
                },
              },
            }}
          >
            {React.cloneElement(getSyncIcon(), {
              sx: {
                fontSize: iconSize,
                animation: syncState === 'syncing' ? 'spin 2s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              },
            })}
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
              fontSize: size === 'small' ? '13px' : size === 'large' ? '16px' : '14px',
            }}
          >
            {getSyncLabel()}
          </Typography>

          {/* Progress bar for determinate progress */}
          {!isIndeterminate && clampedProgress !== undefined && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: size === 'small' ? 2 : size === 'large' ? 4 : 3,
                  backgroundColor: isDark 
                    ? 'rgba(120, 120, 128, 0.24)' 
                    : 'rgba(120, 120, 128, 0.16)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${clampedProgress}%`,
                    height: '100%',
                    backgroundColor: getColorValue(),
                    borderRadius: 'inherit',
                    transition: 'width 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Indeterminate progress bar */}
          {isIndeterminate && syncState === 'syncing' && (
            <Box sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: size === 'small' ? 2 : size === 'large' ? 4 : 3,
                  backgroundColor: isDark 
                    ? 'rgba(120, 120, 128, 0.24)' 
                    : 'rgba(120, 120, 128, 0.16)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: '30%',
                    height: '100%',
                    backgroundColor: getColorValue(),
                    borderRadius: 'inherit',
                    animation: 'indeterminateSync 2s ease-in-out infinite',
                    '@keyframes indeterminateSync': {
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
          )}

          {/* Additional info */}
          {(estimatedTime || transitionsCount) && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: size === 'small' ? '11px' : size === 'large' ? '13px' : '12px',
              }}
            >
              {estimatedTime && `ETA: ${estimatedTime}`}
              {estimatedTime && transitionsCount && ' • '}
              {transitionsCount && `${transitionsCount} items`}
            </Typography>
          )}
        </Box>

        {/* Progress percentage */}
        {!isIndeterminate && clampedProgress !== undefined && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: getColorValue(),
              fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
              minWidth: 'fit-content',
            }}
          >
            {Math.round(clampedProgress)}%
          </Typography>
        )}
      </Box>
    );
  }

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