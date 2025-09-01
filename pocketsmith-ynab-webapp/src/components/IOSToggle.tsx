import React from 'react';
import { Box, Typography } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const IOSToggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'medium',
  color = 'success'
}: IOSToggleProps) => {
  const { triggerHaptic } = useHapticFeedback();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '40px',
          height: '24px',
          thumbSize: '20px',
          thumbOffset: '2px'
        };
      case 'large':
        return {
          width: '60px',
          height: '36px',
          thumbSize: '32px',
          thumbOffset: '2px'
        };
      default:
        return {
          width: '50px',
          height: '30px',
          thumbSize: '26px',
          thumbOffset: '2px'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handleToggle = () => {
    if (disabled) return;
    
    triggerHaptic('light');
    onChange(!checked);
  };

  const getBackgroundColor = () => {
    if (disabled) {
      return checked ? 'rgba(52, 199, 89, 0.3)' : 'rgba(118, 118, 128, 0.16)';
    }
    
    if (checked) {
      switch (color) {
        case 'primary':
          return '#007AFF';
        case 'warning':
          return '#FF9500';
        case 'error':
          return '#FF3B30';
        default:
          return '#34C759'; // success/green
      }
    }
    
    return 'rgba(118, 118, 128, 0.32)';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: disabled ? 'default' : 'pointer'
      }}
      onClick={handleToggle}
    >
      {label && (
        <Typography
          variant="body2"
          sx={{
            color: disabled ? 'text.disabled' : 'text.primary',
            fontWeight: 500,
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {label}
        </Typography>
      )}
      
      <Box
        sx={{
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.height,
          backgroundColor: getBackgroundColor(),
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          '&:active': disabled ? {} : {
            transform: 'scale(0.95)'
          }
        }}
      >
        {/* Toggle Thumb */}
        <Box
          sx={{
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: sizeStyles.thumbOffset,
            left: checked 
              ? `calc(100% - ${sizeStyles.thumbSize} - ${sizeStyles.thumbOffset})`
              : sizeStyles.thumbOffset,
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.02)',
            transform: checked ? 'scale(1)' : 'scale(0.95)'
          }}
        />
      </Box>
    </Box>
  );
};

export default IOSToggle;