import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Card,
  CardContent,
  Stack,
  Fade,
  Backdrop,
  Paper
} from '@mui/material';
import { keyframes } from '@mui/system';

// Pulse animation for skeleton loading
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

// Loading spinner with optional text
interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  color?: 'primary' | 'secondary' | 'inherit';
  centered?: boolean;
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  text,
  color = 'primary',
  centered = true,
  fullHeight = false
}) => {
  const content = (
    <Stack spacing={2} alignItems="center">
      <CircularProgress size={size} color={color} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Stack>
  );

  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: fullHeight ? '100vh' : 200,
          p: 3
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

// Progress bar with percentage and optional text
interface ProgressBarProps {
  value: number; // 0-100
  text?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
  variant?: 'determinate' | 'indeterminate';
  size?: 'small' | 'medium' | 'large';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  text,
  showPercentage = true,
  color = 'primary',
  variant = 'determinate',
  size = 'medium'
}) => {
  const height = size === 'small' ? 4 : size === 'large' ? 12 : 8;

  return (
    <Box sx={{ width: '100%' }}>
      {(text || showPercentage) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          {text && (
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          )}
          {showPercentage && variant === 'determinate' && (
            <Typography variant="body2" color="text.secondary">
              {Math.round(value)}%
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant={variant}
        value={value}
        color={color}
        sx={{ height, borderRadius: height / 2 }}
      />
    </Box>
  );
};

// Circular progress with percentage in center
interface CircularProgressWithLabelProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  color?: 'primary' | 'secondary' | 'inherit';
  showLabel?: boolean;
}

export const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({
  value,
  size = 80,
  thickness = 4,
  color = 'primary',
  showLabel = true
}) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        color={color}
      />
      {showLabel && (
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
            color="text.secondary"
            sx={{ fontSize: size > 60 ? '0.875rem' : '0.75rem' }}
          >
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Skeleton loaders for different content types
interface SkeletonLoaderProps {
  type: 'text' | 'card' | 'table' | 'list' | 'avatar' | 'custom';
  lines?: number;
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  lines = 3,
  height,
  width,
  animation = 'wave'
}) => {
  switch (type) {
    case 'text':
      return (
        <Stack spacing={1}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              height={height || 20}
              width={index === lines - 1 ? '60%' : '100%'}
              animation={animation}
            />
          ))}
        </Stack>
      );

    case 'card':
      return (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="text" height={24} width="40%" animation={animation} />
              <Skeleton variant="rectangular" height={120} animation={animation} />
              <Stack spacing={1}>
                <Skeleton variant="text" height={16} animation={animation} />
                <Skeleton variant="text" height={16} width="80%" animation={animation} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      );

    case 'table':
      return (
        <Stack spacing={1}>
          {/* Table header */}
          <Stack direction="row" spacing={2}>
            <Skeleton variant="text" height={20} width="25%" animation={animation} />
            <Skeleton variant="text" height={20} width="25%" animation={animation} />
            <Skeleton variant="text" height={20} width="25%" animation={animation} />
            <Skeleton variant="text" height={20} width="25%" animation={animation} />
          </Stack>
          {/* Table rows */}
          {Array.from({ length: lines }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2}>
              <Skeleton variant="text" height={16} width="25%" animation={animation} />
              <Skeleton variant="text" height={16} width="25%" animation={animation} />
              <Skeleton variant="text" height={16} width="25%" animation={animation} />
              <Skeleton variant="text" height={16} width="25%" animation={animation} />
            </Stack>
          ))}
        </Stack>
      );

    case 'list':
      return (
        <Stack spacing={2}>
          {Array.from({ length: lines }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={40} height={40} animation={animation} />
              <Stack spacing={1} sx={{ flex: 1 }}>
                <Skeleton variant="text" height={16} width="60%" animation={animation} />
                <Skeleton variant="text" height={14} width="40%" animation={animation} />
              </Stack>
            </Stack>
          ))}
        </Stack>
      );

    case 'avatar':
      return (
        <Skeleton
          variant="circular"
          width={width || 40}
          height={height || 40}
          animation={animation}
        />
      );

    case 'custom':
      return (
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
          animation={animation}
        />
      );

    default:
      return <Skeleton animation={animation} />;
  }
};

// Full-screen loading overlay
interface LoadingOverlayProps {
  open: boolean;
  text?: string;
  backdrop?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  text = 'Loading...',
  backdrop = true
}) => {
  if (backdrop) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        <LoadingSpinner text={text} color="inherit" centered={false} />
      </Backdrop>
    );
  }

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <LoadingSpinner text={text} centered={false} />
        </Paper>
      </Box>
    </Fade>
  );
};

// Inline loading state for buttons and small components
interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  size?: number;
  color?: 'primary' | 'secondary' | 'inherit';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  children,
  size = 16,
  color = 'inherit'
}) => {
  if (loading) {
    return <CircularProgress size={size} color={color} />;
  }

  return <>{children}</>;
};

// Pulsing dot indicator for real-time updates
interface PulsingDotProps {
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: number;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  color = 'primary',
  size = 8
}) => {
  const getColor = () => {
    switch (color) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'secondary': return '#9c27b0';
      default: return '#1976d2';
    }
  };

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: getColor(),
        animation: `${pulse} 2s ease-in-out infinite`,
      }}
    />
  );
};

// Loading state for data tables
interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <Stack spacing={1}>
      {/* Header row */}
      <Stack direction="row" spacing={2} sx={{ p: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`header-${colIndex}`}
            variant="text"
            height={20}
            width={`${100 / columns}%`}
            sx={{ fontWeight: 'bold' }}
          />
        ))}
      </Stack>
      
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Stack key={`row-${rowIndex}`} direction="row" spacing={2} sx={{ p: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              height={16}
              width={`${100 / columns}%`}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

// Loading state for cards/dashboard widgets
interface CardLoadingProps {
  title?: boolean;
  content?: boolean;
  actions?: boolean;
}

export const CardLoading: React.FC<CardLoadingProps> = ({
  title = true,
  content = true,
  actions = false
}) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {title && (
            <Skeleton variant="text" height={24} width="40%" />
          )}
          
          {content && (
            <Stack spacing={1}>
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="text" height={16} />
              <Skeleton variant="text" height={16} width="80%" />
            </Stack>
          )}
          
          {actions && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={80} height={32} />
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};