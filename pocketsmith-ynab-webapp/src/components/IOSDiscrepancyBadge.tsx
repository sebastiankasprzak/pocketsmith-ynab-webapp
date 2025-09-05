import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { IOSStatusBadge } from './IOSStatusBadge';

export type DiscrepancyLevel = 'none' | 'minor' | 'moderate' | 'major' | 'critical';

interface IOSDiscrepancyBadgeProps {
  amount: number;
  currency?: string;
  level: DiscrepancyLevel;
  variant?: 'filled' | 'outlined' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  showDirection?: boolean;
  showIcon?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IOSDiscrepancyBadge: React.FC<IOSDiscrepancyBadgeProps> = ({
  amount,
  currency = 'USD',
  level,
  variant = 'filled',
  size = 'medium',
  showDirection = true,
  showIcon = true,
  onClick,
  className = ''
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));
  };

  // Get level configuration
  const getLevelConfig = () => {
    switch (level) {
      case 'none':
        return {
          status: 'success' as const,
          color: isDark ? '#30DB5B' : '#34C759', // iOS systemGreen
          backgroundColor: isDark ? 'rgba(48, 219, 91, 0.2)' : 'rgba(52, 199, 89, 0.1)',
          borderColor: isDark ? '#30DB5B' : '#34C759',
          icon: <CheckIcon />,
          text: 'Match'
        };
      case 'minor':
        return {
          status: 'info' as const,
          color: isDark ? '#0A84FF' : '#007AFF', // iOS systemBlue
          backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: isDark ? '#0A84FF' : '#007AFF',
          icon: <WarningIcon />,
          text: formatCurrency(amount)
        };
      case 'moderate':
        return {
          status: 'warning' as const,
          color: isDark ? '#FFD60A' : '#FFCC00', // iOS systemYellow
          backgroundColor: isDark ? 'rgba(255, 214, 10, 0.2)' : 'rgba(255, 204, 0, 0.1)',
          borderColor: isDark ? '#FFD60A' : '#FFCC00',
          icon: <WarningIcon />,
          text: formatCurrency(amount)
        };
      case 'major':
        return {
          status: 'warning' as const,
          color: isDark ? '#FF9F0A' : '#FF9500', // iOS systemOrange
          backgroundColor: isDark ? 'rgba(255, 159, 10, 0.2)' : 'rgba(255, 149, 0, 0.1)',
          borderColor: isDark ? '#FF9F0A' : '#FF9500',
          icon: <WarningIcon />,
          text: formatCurrency(amount)
        };
      case 'critical':
        return {
          status: 'error' as const,
          color: isDark ? '#FF453A' : '#FF3B30', // iOS systemRed
          backgroundColor: isDark ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255, 59, 48, 0.1)',
          borderColor: isDark ? '#FF453A' : '#FF3B30',
          icon: <ErrorIcon />,
          text: formatCurrency(amount)
        };
      default:
        return {
          status: 'neutral' as const,
          color: isDark ? '#8E8E93' : '#8E8E93', // iOS systemGray
          backgroundColor: isDark ? 'rgba(142, 142, 147, 0.2)' : 'rgba(142, 142, 147, 0.1)',
          borderColor: isDark ? '#8E8E93' : '#8E8E93',
          icon: <CheckIcon />,
          text: 'Unknown'
        };
    }
  };

  const config = getLevelConfig();
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  // For matching balances, use simple success badge
  if (level === 'none') {
    return (
      <IOSStatusBadge
        status="success"
        text="Match"
        variant={variant}
        size={size}
        icon={showIcon ? <CheckIcon /> : false}
        onClick={onClick}
        className={`ios-discrepancy-badge match ${className}`}
      />
    );
  }

  // For discrepancies, create custom badge with direction indicator
  return (
    <Box
      className={`ios-discrepancy-badge ${level} ${className}`}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-1px)',
        } : {},
        '&:active': onClick ? {
          transform: 'translateY(0)',
        } : {},
      }}
    >
      {/* Direction indicator */}
      {showDirection && (isPositive || isNegative) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size === 'small' ? 16 : size === 'large' ? 20 : 18,
            height: size === 'small' ? 16 : size === 'large' ? 20 : 18,
            borderRadius: '50%',
            backgroundColor: config.backgroundColor,
            border: variant === 'outlined' ? `1px solid ${config.borderColor}` : 'none',
          }}
        >
          {isPositive ? (
            <TrendingUpIcon 
              sx={{ 
                fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
                color: config.color 
              }} 
            />
          ) : (
            <TrendingDownIcon 
              sx={{ 
                fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
                color: config.color 
              }} 
            />
          )}
        </Box>
      )}

      {/* Main badge */}
      <IOSStatusBadge
        status={config.status}
        text={config.text}
        variant={variant}
        size={size}
        icon={showIcon ? config.icon : false}
        onClick={onClick}
      />
    </Box>
  );
};

export default IOSDiscrepancyBadge;