import React from 'react';
import { Box, Typography } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSSegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface IOSSegmentedControlProps {
  options: IOSSegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
}

export const IOSSegmentedControl = ({
  options,
  value,
  onChange,
  size = 'medium',
  fullWidth = false,
  disabled = false
}: IOSSegmentedControlProps) => {
  const { triggerHaptic } = useHapticFeedback();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: '28px',
          fontSize: '13px',
          px: 1.5
        };
      case 'large':
        return {
          height: '40px',
          fontSize: '16px',
          px: 2.5
        };
      default:
        return {
          height: '32px',
          fontSize: '14px',
          px: 2
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handleOptionClick = (optionValue: string, optionDisabled?: boolean) => {
    if (disabled || optionDisabled || optionValue === value) return;
    
    triggerHaptic('light');
    onChange(optionValue);
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: '8px',
        p: '2px',
        width: fullWidth ? '100%' : 'auto',
        position: 'relative'
      }}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;

        return (
          <Box
            key={option.value}
            onClick={() => handleOptionClick(option.value, option.disabled)}
            sx={{
              flex: fullWidth ? 1 : 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: sizeStyles.height,
              px: sizeStyles.px,
              borderRadius: '6px',
              cursor: isDisabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isSelected ? 'background.paper' : 'transparent',
              boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              opacity: isDisabled ? 0.5 : 1,
              '&:hover': isDisabled ? {} : {
                backgroundColor: isSelected ? 'background.paper' : 'rgba(0, 0, 0, 0.05)'
              },
              '&:active': isDisabled ? {} : {
                transform: 'scale(0.98)'
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: sizeStyles.fontSize,
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? 'text.primary' : 'text.secondary',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {option.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default IOSSegmentedControl;