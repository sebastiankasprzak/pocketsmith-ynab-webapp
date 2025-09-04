import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  useTheme,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSModalPickerOption {
  label: string;
  value: string;
  disabled?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface IOSModalPickerProps {
  options: IOSModalPickerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  disabled?: boolean;
  showIcons?: boolean;
  showSubtitles?: boolean;
}

export const IOSModalPicker: React.FC<IOSModalPickerProps> = React.memo(({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error = false,
  disabled = false,
  showIcons = false,
  showSubtitles = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selection, impact } = useHapticFeedback();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  // Cleanup body styles on unmount
  useEffect(() => {
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    
    // Prevent body scroll on iOS
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    setIsOpen(true);
    
    if (selection) {
      selection();
    }
  };

  const handleClose = () => {
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    
    setIsOpen(false);
  };

  const handleSelect = (optionValue: string) => {
    // Small delay to prevent iOS scroll issues
    setTimeout(() => {
      onChange(optionValue);
    }, 50);
    
    handleClose();
    
    if (impact) {
      impact('light');
    }
  };

  const renderTrigger = () => (
    <Box
      onClick={handleOpen}
      sx={{
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : '#FFFFFF',
        borderRadius: '10px',
        minHeight: '44px',
        fontSize: '17px',
        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontWeight: 400,
        letterSpacing: '-0.43px',
        border: `1px solid ${
          error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : isDark 
              ? 'rgba(84, 84, 88, 0.36)' 
              : 'rgba(60, 60, 67, 0.18)'
        }`,
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        '&:hover': {
          borderColor: disabled 
            ? undefined
            : error 
              ? (isDark ? '#FF453A' : '#FF3B30')
              : isDark 
                ? 'rgba(84, 84, 88, 0.5)' 
                : 'rgba(60, 60, 67, 0.3)',
        },
        '&:active': {
          transform: disabled ? 'none' : 'scale(0.98)',
        },
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {showIcons && selectedOption?.icon && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {selectedOption.icon}
          </Box>
        )}
        <Box>
          <Typography
            sx={{
              fontSize: '17px',
              color: value 
                ? (isDark ? '#FFFFFF' : '#000000')
                : (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)'),
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `5px solid ${isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'}`,
        }}
      />
    </Box>
  );

  const renderModal = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={handleClose}
      >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: '400px',
          maxHeight: '70vh',
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
          boxShadow: isDark 
            ? '0 10px 40px rgba(0, 0, 0, 0.6)'
            : '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '17px',
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontWeight: 600,
              color: isDark ? '#FFFFFF' : '#000000',
            }}
          >
            {label || 'Select Option'}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Options List - iOS-safe scrolling */}
        <Box 
          sx={{ 
            padding: 0, 
            maxHeight: 'calc(70vh - 80px)', 
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            // iOS-specific fixes for scroll handling
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {options.length === 0 ? (
            <Box
              sx={{
                minHeight: '44px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                fontStyle: 'italic',
              }}
            >
              No options available
            </Box>
          ) : (
            options.map((option) => (
              <Box
                key={option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                sx={{
                  minHeight: '44px',
                  padding: '12px 20px',
                  borderBottom: `0.5px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
                  backgroundColor: value === option.value 
                    ? (isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                    : 'transparent',
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: option.disabled
                      ? 'transparent'
                      : value === option.value
                        ? (isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)')
                        : (isDark ? 'rgba(120, 120, 128, 0.16)' : 'rgba(120, 120, 128, 0.08)'),
                  },
                  '&:active': {
                    transform: option.disabled ? 'none' : 'scale(0.98)',
                  },
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                {showIcons && option.icon && (
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {option.icon}
                  </Box>
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '17px',
                      fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                      fontWeight: value === option.value ? 600 : 400,
                      color: option.disabled
                        ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                        : value === option.value
                          ? (isDark ? '#0A84FF' : '#007AFF')
                          : (isDark ? '#FFFFFF' : '#000000'),
                      lineHeight: 1.2,
                    }}
                  >
                    {option.label}
                  </Typography>
                  {showSubtitles && option.subtitle && (
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        color: option.disabled
                          ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                          : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
                        marginTop: '2px',
                        lineHeight: 1.2,
                      }}
                    >
                      {option.subtitle}
                    </Typography>
                  )}
                </Box>
                {value === option.value && (
                  <CheckIcon
                    sx={{
                      fontSize: 20,
                      color: isDark ? '#0A84FF' : '#007AFF',
                      marginLeft: 1,
                    }}
                  />
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>
      </Box>,
      document.body
    );
  };

  return (
    <Box className="ios-modal-picker">
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontSize: '17px',
            fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontWeight: 400,
            color: error 
              ? (isDark ? '#FF453A' : '#FF3B30')
              : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
            marginBottom: '8px',
            marginLeft: '16px',
          }}
        >
          {label}
        </Typography>
      )}

      {renderTrigger()}
      {renderModal()}
    </Box>
  );
});

IOSModalPicker.displayName = 'IOSModalPicker';

export default IOSModalPicker;