import React, { useState } from 'react';
import { Box, FormControlLabel, Switch, useTheme, Typography } from '@mui/material';
import type { SwitchProps } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSToggleProps extends Omit<SwitchProps, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  hapticFeedback?: boolean;
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const IOSToggle = ({
  checked,
  onChange,
  label,
  description,
  size = 'medium',
  hapticFeedback = true,
  labelPlacement = 'start',
  color = 'primary',
  disabled = false,
  className = '',
  ...props
}: IOSToggleProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { impact } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const newChecked = event.target.checked;
    onChange(newChecked);
    
    if (hapticFeedback) {
      impact(newChecked ? 'light' : 'medium');
    }
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 24,
          thumbSize: 20,
          fontSize: '15px',
        };
      case 'large':
        return {
          width: 60,
          height: 36,
          thumbSize: 32,
          fontSize: '19px',
        };
      default: // medium
        return {
          width: 51,
          height: 31,
          thumbSize: 27,
          fontSize: '17px',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getTrackColor = () => {
    if (disabled) {
      return isDark ? 'rgba(120, 120, 128, 0.16)' : 'rgba(120, 120, 128, 0.12)';
    }
    
    if (checked) {
      switch (color) {
        case 'success':
          return isDark ? '#30DB5B' : '#32D74B';
        case 'warning':
          return isDark ? '#FFD60A' : '#FFCC00';
        case 'error':
          return isDark ? '#FF453A' : '#FF3B30';
        default: // primary
          return isDark ? '#0A84FF' : '#007AFF';
      }
    }
    
    return isDark ? 'rgba(120, 120, 128, 0.36)' : 'rgba(120, 120, 128, 0.2)';
  };

  const getThumbColor = () => {
    if (disabled) {
      return isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)';
    }
    return '#FFFFFF';
  };

  const getSwitchStyles = () => ({
    width: sizeStyles.width,
    height: sizeStyles.height,
    padding: 0,
    margin: 0,
    '& .MuiSwitch-switchBase': {
      padding: 2,
      margin: 0,
      transitionDuration: '300ms',
      transform: isPressed && !disabled ? 'scale(0.95)' : 'scale(1)',
      '&.Mui-checked': {
        transform: `translateX(${sizeStyles.width - sizeStyles.thumbSize - 4}px) ${isPressed && !disabled ? 'scale(0.95)' : 'scale(1)'}`,
        color: getThumbColor(),
        '& + .MuiSwitch-track': {
          backgroundColor: getTrackColor(),
          opacity: 1,
          border: 0,
        },
        '& .MuiSwitch-thumb': {
          backgroundColor: getThumbColor(),
          boxShadow: isDark 
            ? '0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.02)',
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: getThumbColor(),
        border: `2px solid ${isDark ? '#0A84FF' : '#007AFF'}`,
      },
      '&.Mui-disabled': {
        '& .MuiSwitch-thumb': {
          backgroundColor: getThumbColor(),
        },
        '& + .MuiSwitch-track': {
          backgroundColor: getTrackColor(),
          opacity: 1,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: getThumbColor(),
      width: sizeStyles.thumbSize,
      height: sizeStyles.thumbSize,
      borderRadius: sizeStyles.thumbSize / 2,
      transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      boxShadow: isDark 
        ? '0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)'
        : '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.02)',
    },
    '& .MuiSwitch-track': {
      borderRadius: sizeStyles.height / 2,
      backgroundColor: getTrackColor(),
      opacity: 1,
      transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
    },
  });

  const getLabelStyles = () => ({
    margin: 0,
    '& .MuiFormControlLabel-label': {
      fontSize: sizeStyles.fontSize,
      fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      fontWeight: 400,
      color: disabled 
        ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
        : (isDark ? '#FFFFFF' : '#000000'),
      lineHeight: 1.4,
    },
  });

  const renderSwitch = () => (
    <Switch
      checked={checked}
      onChange={handleChange}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      sx={getSwitchStyles()}
      {...props}
    />
  );

  const renderContent = () => {
    if (!label && !description) {
      return renderSwitch();
    }

    const switchElement = renderSwitch();
    const labelElement = (
      <Box>
        {label && (
          <Typography
            variant="body1"
            sx={{
              fontSize: sizeStyles.fontSize,
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontWeight: 400,
              color: disabled 
                ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                : (isDark ? '#FFFFFF' : '#000000'),
              lineHeight: 1.4,
              marginBottom: description ? '4px' : 0,
            }}
          >
            {label}
          </Typography>
        )}
        {description && (
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontWeight: 400,
              color: disabled 
                ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    );

    const getFlexDirection = () => {
      switch (labelPlacement) {
        case 'top':
          return 'column';
        case 'bottom':
          return 'column-reverse';
        case 'end':
          return 'row-reverse';
        default: // start
          return 'row';
      }
    };

    const getAlignment = () => {
      return labelPlacement === 'top' || labelPlacement === 'bottom' 
        ? 'center' 
        : 'flex-start';
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: getFlexDirection(),
          alignItems: getAlignment(),
          gap: labelPlacement === 'top' || labelPlacement === 'bottom' ? '8px' : '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !disabled && handleChange({ target: { checked: !checked } } as any)}
      >
        {labelPlacement === 'start' || labelPlacement === 'top' ? (
          <>
            {labelElement}
            {switchElement}
          </>
        ) : (
          <>
            {switchElement}
            {labelElement}
          </>
        )}
      </Box>
    );
  };

  return (
    <Box className={`ios-toggle ${className}`}>
      {renderContent()}
    </Box>
  );
};

export default IOSToggle;