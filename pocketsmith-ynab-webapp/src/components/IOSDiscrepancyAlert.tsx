import React from 'react';
import { Box, Typography, Alert, AlertTitle } from '@mui/material';
import { 
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { IOSButton } from './IOSButton';
import { IOSStatusBadge } from './IOSStatusBadge';

export type DiscrepancyType = 'minor' | 'moderate' | 'major' | 'critical';
export type DiscrepancyDirection = 'positive' | 'negative';

interface IOSDiscrepancyAlertProps {
  amount: number;
  currency?: string;
  type: DiscrepancyType;
  direction: DiscrepancyDirection;
  accountName: string;
  onInvestigate?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const IOSDiscrepancyAlert: React.FC<IOSDiscrepancyAlertProps> = ({
  amount,
  currency = 'USD',
  type,
  direction,
  accountName,
  onInvestigate,
  onDismiss,
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

  // Get discrepancy configuration based on type
  const getDiscrepancyConfig = () => {
    switch (type) {
      case 'critical':
        return {
          severity: 'error' as const,
          color: isDark ? '#FF453A' : '#FF3B30', // iOS systemRed
          backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 59, 48, 0.1)',
          borderColor: isDark ? '#FF453A' : '#FF3B30',
          icon: <ErrorIcon />,
          title: 'Critical Discrepancy',
          description: 'Large balance difference requires immediate attention'
        };
      case 'major':
        return {
          severity: 'warning' as const,
          color: isDark ? '#FF9F0A' : '#FF9500', // iOS systemOrange
          backgroundColor: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 149, 0, 0.1)',
          borderColor: isDark ? '#FF9F0A' : '#FF9500',
          icon: <WarningIcon />,
          title: 'Major Discrepancy',
          description: 'Significant balance difference detected'
        };
      case 'moderate':
        return {
          severity: 'warning' as const,
          color: isDark ? '#FFD60A' : '#FFCC00', // iOS systemYellow
          backgroundColor: isDark ? 'rgba(255, 214, 10, 0.15)' : 'rgba(255, 204, 0, 0.1)',
          borderColor: isDark ? '#FFD60A' : '#FFCC00',
          icon: <WarningIcon />,
          title: 'Moderate Discrepancy',
          description: 'Balance difference should be reviewed'
        };
      default: // minor
        return {
          severity: 'info' as const,
          color: isDark ? '#0A84FF' : '#007AFF', // iOS systemBlue
          backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: isDark ? '#0A84FF' : '#007AFF',
          icon: <InfoIcon />,
          title: 'Minor Discrepancy',
          description: 'Small balance difference detected'
        };
    }
  };

  const config = getDiscrepancyConfig();

  return (
    <Alert
      severity={config.severity}
      className={`ios-discrepancy-alert ${type} ${className}`}
      onClose={onDismiss}
      sx={{
        borderRadius: '12px',
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.backgroundColor,
        color: config.color,
        mb: 2,
        '& .MuiAlert-icon': {
          color: config.color,
          fontSize: '20px'
        },
        '& .MuiAlert-message': {
          width: '100%'
        },
        '& .MuiAlert-action': {
          alignItems: 'flex-start',
          paddingTop: '4px'
        }
      }}
      icon={config.icon}
    >
      <AlertTitle sx={{ 
        color: config.color, 
        fontWeight: 600,
        fontSize: '15px',
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {config.title}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {direction === 'positive' ? (
            <TrendingUpIcon sx={{ fontSize: '16px', color: config.color }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: '16px', color: config.color }} />
          )}
          <IOSStatusBadge
            status={type === 'critical' ? 'error' : type === 'major' ? 'warning' : 'info'}
            text={formatCurrency(amount)}
            variant="filled"
            size="small"
            icon={false}
          />
        </Box>
      </AlertTitle>
      
      <Typography variant="body2" sx={{ 
        color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
        mb: 2,
        fontSize: '14px'
      }}>
        {config.description} for <strong>{accountName}</strong>
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {onInvestigate && (
          <IOSButton
            variant="filled"
            size="small"
            onClick={onInvestigate}
            sx={{
              backgroundColor: config.color,
              color: '#FFFFFF',
              fontSize: '13px',
              minHeight: '28px',
              '&:hover': {
                backgroundColor: config.color,
                opacity: 0.9
              }
            }}
          >
            Investigate
          </IOSButton>
        )}
        
        <Typography variant="caption" sx={{ 
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          fontSize: '12px'
        }}>
          {direction === 'positive' 
            ? 'PocketSmith balance is higher' 
            : 'YNAB balance is higher'
          }
        </Typography>
      </Box>
    </Alert>
  );
};

export default IOSDiscrepancyAlert;