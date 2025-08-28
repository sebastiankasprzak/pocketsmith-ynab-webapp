import React from 'react';
import { Chip, Box } from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Sync
} from '@mui/icons-material';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'idle' | 'syncing';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'small',
  showIcon = true,
  showLabel = true
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'syncing': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { fontSize: size === 'small' ? 'small' : 'medium' } as const;
    
    switch (status) {
      case 'success': return <CheckCircle {...iconProps} />;
      case 'error': return <Error {...iconProps} />;
      case 'warning': return <Warning {...iconProps} />;
      case 'syncing': return <Sync className="rotating" {...iconProps} />;
      default: return <Schedule {...iconProps} />;
    }
  };

  if (!showLabel && showIcon) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {getStatusIcon(status)}
      </Box>
    );
  }

  return (
    <Chip
      size={size}
      label={status}
      color={getStatusColor(status) as any}
      icon={showIcon ? getStatusIcon(status) : undefined}
    />
  );
};