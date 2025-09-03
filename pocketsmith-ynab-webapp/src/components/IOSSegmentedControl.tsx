import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSSegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface IOSSegmentedControlProps {
  options: IOSSegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  disabled?: boolean;
  className?: string;
}

export const IOSSegmentedControl = ({
  options,
  value,
  onChange,
  size = 'medium',
  fullWidth = false,
  hapticFeedback = true,
  disabled = false,
  className = '',
}: IOSSegmentedControlProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selection } = useHapticFeedback();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Find selected index
  useEffect(() => {
    const index = options.findIndex(option => option.value === value);
    setSelectedIndex(index >= 0 ? index : 0);
  }, [value, options]);

  // Update indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const selectedButton = optionRefs.current[selectedIndex];
      if (selectedButton && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        
        setIndicatorStyle({
          width: buttonRect.width - 4, // Account for padding
          height: buttonRect.height - 4,
          transform: `translateX(${buttonRect.left - containerRect.left + 2}px)`,
        });
      }
    };

    updateIndicator();
    
    // Update on resize
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedIndex, options]);

  const handleOptionClick = (option: IOSSegmentedControlOption, index: number) => {
    if (disabled || option.disabled || option.value === value) return;
    
    onChange(option.value);
    
    if (hapticFeedback) {
      selection();
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 32,
          fontSize: '15px',
          padding: '6px',
          borderRadius: '8px',
        };
      case 'large':
        return {
          height: 50,
          fontSize: '19px',
          padding: '8px',
          borderRadius: '12px',
        };
      default: // medium
        return {
          height: 40,
          fontSize: '17px',
          padding: '6px',
          borderRadius: '10px',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getContainerStyles = () => ({
    position: 'relative' as const,
    display: 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    height: sizeStyles.height,
    backgroundColor: isDark ? 'rgba(120, 120, 128, 0.16)' : 'rgba(120, 120, 128, 0.12)',
    borderRadius: sizeStyles.borderRadius,
    padding: sizeStyles.padding,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'default',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
  });

  const getIndicatorStyles = () => ({
    position: 'absolute' as const,
    top: sizeStyles.padding,
    left: sizeStyles.padding,
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    borderRadius: `${parseInt(sizeStyles.borderRadius) - 2}px`,
    boxShadow: isDark 
      ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
      : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    zIndex: 1,
    ...indicatorStyle,
  });

  const getOptionStyles = (option: IOSSegmentedControlOption, index: number) => {
    const isSelected = option.value === value;
    const isDisabled = disabled || option.disabled;
    
    return {
      flex: 1,
      height: '100%',
      border: 'none',
      backgroundColor: 'transparent',
      color: isSelected 
        ? (isDark ? '#FFFFFF' : '#000000')
        : isDisabled
          ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
          : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
      fontSize: sizeStyles.fontSize,
      fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      fontWeight: isSelected ? 600 : 400,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      borderRadius: `${parseInt(sizeStyles.borderRadius) - 2}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: option.icon ? '6px' : 0,
      position: 'relative' as const,
      zIndex: 2,
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      WebkitTapHighlightColor: 'transparent',
      '&:active': {
        transform: isDisabled ? 'none' : 'scale(0.98)',
      },
    };
  };

  return (
    <Box
      ref={containerRef}
      className={`ios-segmented-control ${className}`}
      sx={getContainerStyles()}
    >
      {/* Selection indicator */}
      <Box sx={getIndicatorStyles()} />
      
      {/* Options */}
      {options.map((option, index) => (
        <Box
          key={option.value}
          ref={(el) => (optionRefs.current[index] = el)}
          component="button"
          onClick={() => handleOptionClick(option, index)}
          sx={getOptionStyles(option, index)}
        >
          {option.icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'small' ? '16px' : size === 'large' ? '20px' : '18px',
              }}
            >
              {option.icon}
            </Box>
          )}
          <Box component="span">
            {option.label}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default IOSSegmentedControl;