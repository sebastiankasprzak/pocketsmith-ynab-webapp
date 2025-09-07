import React, { ReactNode } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Circle as DotIcon,
  Sync as SyncIcon,
  Pause as PauseIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';

export type IOSStatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'neutral'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'syncing'
  | 'completed'
  | 'failed'
  | 'idle'
  | 'queued'
  | 'processing';

interface IOSStatusBadgeProps {
  status: IOSStatusType;
  text: string;
  variant?: 'filled' | 'outlined' | 'dot' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode | boolean; // true for default icon, false for no icon, ReactNode for custom icon
  className?: string;
  onClick?: () => void;
  animated?: boolean; // for syncing/pending states
}

export const IOSStatusBadge = ({
  status,
  text,
  variant = 'filled',
  size = 'medium',
  icon = true,
  className = '',
  onClick,
  animated = false
}: IOSStatusBadgeProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          color: '#34C759',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
          borderColor: '#34C759',
          icon: <SuccessIcon />,
        };
      case 'error':
        return {
          color: '#FF3B30',
          backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
          borderColor: '#FF3B30',
          icon: <ErrorIcon />,
        };
      case 'warning':
        return {
          color: '#FF9500',
          backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.1)',
          borderColor: '#FF9500',
          icon: <WarningIcon />,
        };
      case 'info':
        return {
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: '#007AFF',
          icon: <InfoIcon />,
        };
      case 'active':
        return {
          color: '#34C759',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
          borderColor: '#34C759',
          icon: <DotIcon />,
        };
      case 'inactive':
        return {
          color: isDark ? '#8E8E93' : '#8E8E93',
          backgroundColor: isDark ? 'rgba(142, 142, 147, 0.2)' : 'rgba(142, 142, 147, 0.1)',
          borderColor: '#8E8E93',
          icon: <DotIcon />,
        };
      case 'pending':
        return {
          color: '#FF9500',
          backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.1)',
          borderColor: '#FF9500',
          icon: <PendingIcon />,
        };
      case 'syncing':
        return {
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: '#007AFF',
          icon: <SyncIcon />,
        };
      case 'completed':
        return {
          color: '#34C759',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
          borderColor: '#34C759',
          icon: <SuccessIcon />,
        };
      case 'failed':
        return {
          color: '#FF3B30',
          backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
          borderColor: '#FF3B30',
          icon: <ErrorIcon />,
        };
      case 'idle':
        return {
          color: isDark ? '#8E8E93' : '#8E8E93',
          backgroundColor: isDark ? 'rgba(142, 142, 147, 0.2)' : 'rgba(142, 142, 147, 0.1)',
          borderColor: '#8E8E93',
          icon: <PauseIcon />,
        };
      case 'queued':
        return {
          color: '#FF9500',
          backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.1)',
          borderColor: '#FF9500',
          icon: <PendingIcon />,
        };
      case 'processing':
        return {
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: '#007AFF',
          icon: <SyncIcon />,
        };
      default: // neutral
        return {
          color: isDark ? '#FFFFFF' : '#000000',
          backgroundColor: isDark ? 'rgba(120, 120, 128, 0.24)' : 'rgba(120, 120, 128, 0.16)',
          borderColor: isDark ? 'rgba(120, 120, 128, 0.4)' : 'rgba(120, 120, 128, 0.3)',
          icon: <DotIcon />,
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 20,
          fontSize: '11px',
          padding: '2px 6px',
          iconSize: 12,
          gap: 4,
        };
      case 'large':
        return {
          height: 32,
          fontSize: '15px',
          padding: '6px 12px',
          iconSize: 18,
          gap: 8,
        };
      default: // medium
        return {
          height: 24,
          fontSize: '13px',
          padding: '4px 8px',
          iconSize: 14,
          gap: 6,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();

  const renderIcon = () => {
    if (icon === false) return null;
    
    const iconElement = icon === true ? statusConfig.icon : icon;
    
    return React.cloneElement(iconElement as React.ReactElement, {
      sx: {
        fontSize: sizeConfig.iconSize,
        color: variant === 'outlined' || variant === 'minimal' ? statusConfig.color : 'currentColor',
        animation: animated && (status === 'syncing' || status === 'pending' || status === 'processing') 
          ? 'spin 1s linear infinite' 
          : 'none',
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${statusConfig.borderColor}`,
          color: statusConfig.color,
        };
      case 'dot':
        return {
          backgroundColor: 'transparent',
          color: isDark ? '#FFFFFF' : '#000000',
          border: 'none',
          padding: `${sizeConfig.padding.split(' ')[0]} 0`,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          color: statusConfig.color,
          border: 'none',
          padding: `${sizeConfig.padding.split(' ')[0]} 0`,
        };
      default: // filled
        return {
          backgroundColor: statusConfig.backgroundColor,
          color: statusConfig.color,
          border: 'none',
        };
    }
  };

  if (variant === 'dot') {
    return (
      <Box
        className={`ios-status-badge dot ${className}`}
        onClick={onClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: `${sizeConfig.gap}px`,
          cursor: onClick ? 'pointer' : 'default',
          ...getVariantStyles(),
        }}
      >
        <Box
          sx={{
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
            borderRadius: '50%',
            backgroundColor: statusConfig.color,
            animation: animated && (status === 'syncing' || status === 'pending' || status === 'processing' || status === 'queued') 
              ? 'pulse 2s ease-in-out infinite' 
              : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: sizeConfig.fontSize,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {text}
        </Typography>
      </Box>
    );
  }

  return (
    <Chip
      className={`ios-status-badge ${variant} ${className}`}
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${sizeConfig.gap}px`,
          }}
        >
          {renderIcon()}
          <Typography
            variant="caption"
            sx={{
              fontSize: sizeConfig.fontSize,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {text}
          </Typography>
        </Box>
      }
      onClick={onClick}
      sx={{
        height: sizeConfig.height,
        borderRadius: `${sizeConfig.height / 2}px`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        '& .MuiChip-label': {
          padding: sizeConfig.padding,
        },
        '&:hover': onClick ? {
          transform: 'translateY(-1px)',
          boxShadow: `0 2px 8px ${statusConfig.color}40`,
        } : {},
        '&:active': onClick ? {
          transform: 'translateY(0)',
        } : {},
        ...getVariantStyles(),
      }}
    />
  );
};

export default IOSStatusBadge;