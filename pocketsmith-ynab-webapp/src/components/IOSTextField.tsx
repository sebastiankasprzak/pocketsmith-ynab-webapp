import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, useTheme, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  error?: boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  hapticFeedback?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const IOSTextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error = false,
  helperText,
  startAdornment,
  endAdornment,
  hapticFeedback = true,
  clearable = false,
  onClear,
  maxLength,
  showCharacterCount = false,
  disabled = false,
  required = false,
  multiline = false,
  rows,
  className = '',
  onFocus,
  onBlur,
  ...props
}: IOSTextFieldProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selection } = useHapticFeedback();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Respect maxLength if provided
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (hapticFeedback) {
      selection();
    }
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    if (hapticFeedback) {
      selection();
    }
    // Focus back to input after clearing
    inputRef.current?.focus();
  };

  const getInputStyles = () => {
    return {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : '#FFFFFF',
        borderRadius: '10px',
        minHeight: multiline ? 'auto' : '44px',
        fontSize: '17px',
        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontWeight: 400,
        letterSpacing: '-0.43px',
        border: `1px solid ${
          error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : isFocused 
              ? (isDark ? '#0A84FF' : '#007AFF')
              : isDark 
                ? 'rgba(84, 84, 88, 0.36)' 
                : 'rgba(60, 60, 67, 0.18)'
        }`,
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        '&:hover': {
          borderColor: error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : isDark 
              ? 'rgba(84, 84, 88, 0.5)' 
              : 'rgba(60, 60, 67, 0.3)',
        },
        '&.Mui-focused': {
          borderColor: error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : (isDark ? '#0A84FF' : '#007AFF'),
          boxShadow: error
            ? `0 0 0 3px ${isDark ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`
            : `0 0 0 3px ${isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.2)'}`,
        },
        '& fieldset': {
          border: 'none',
        },
        '& input': {
          padding: multiline ? '12px 16px' : '12px 16px',
          fontSize: '17px', // Prevent zoom on iOS
          '&::placeholder': {
            color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
            opacity: 1,
          },
        },
        '& textarea': {
          padding: '12px 16px',
          fontSize: '17px',
          '&::placeholder': {
            color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
            opacity: 1,
          },
        },
      },
      '& .MuiInputLabel-root': {
        fontSize: '17px',
        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontWeight: 400,
        color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
        transform: 'translate(16px, 12px) scale(1)',
        '&.Mui-focused': {
          color: error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : (isDark ? '#0A84FF' : '#007AFF'),
          transform: 'translate(16px, -9px) scale(0.75)',
        },
        '&.MuiInputLabel-shrink': {
          transform: 'translate(16px, -9px) scale(0.75)',
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : '#FFFFFF',
          padding: '0 4px',
        },
      },
      '& .MuiFormHelperText-root': {
        fontSize: '13px',
        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        marginLeft: '16px',
        marginTop: '6px',
        color: error 
          ? (isDark ? '#FF453A' : '#FF3B30')
          : isDark 
            ? 'rgba(235, 235, 245, 0.6)' 
            : 'rgba(60, 60, 67, 0.6)',
      },
    };
  };

  // Build end adornment with clear button and character count
  const buildEndAdornment = () => {
    const elements = [];

    // Character count
    if (showCharacterCount && maxLength) {
      elements.push(
        <Box
          key="char-count"
          sx={{
            fontSize: '13px',
            color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
            marginRight: clearable && value ? 1 : 0,
          }}
        >
          {value.length}/{maxLength}
        </Box>
      );
    }

    // Clear button
    if (clearable && value && !disabled) {
      elements.push(
        <Box
          key="clear-button"
          component="button"
          onClick={handleClear}
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(120, 120, 128, 0.36)' : 'rgba(120, 120, 128, 0.2)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(120, 120, 128, 0.5)' : 'rgba(120, 120, 128, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.9)',
            },
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              position: 'relative',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: '1px',
                height: '10px',
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                top: 0,
                left: '50%',
                transformOrigin: 'center',
              },
              '&::before': {
                transform: 'translateX(-50%) rotate(45deg)',
              },
              '&::after': {
                transform: 'translateX(-50%) rotate(-45deg)',
              },
            }}
          />
        </Box>
      );
    }

    // Custom end adornment
    if (endAdornment) {
      elements.push(
        <Box key="custom-end" sx={{ marginLeft: elements.length > 0 ? 1 : 0 }}>
          {endAdornment}
        </Box>
      );
    }

    return elements.length > 0 ? (
      <InputAdornment position="end">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {elements}
        </Box>
      </InputAdornment>
    ) : undefined;
  };

  return (
    <Box className={`ios-text-field ${className}`}>
      <TextField
        inputRef={inputRef}
        label={label}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        type={type}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        multiline={multiline}
        rows={rows}
        fullWidth
        variant="outlined"
        sx={getInputStyles()}
        InputProps={{
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : undefined,
          endAdornment: buildEndAdornment(),
        }}
        inputProps={{
          maxLength: maxLength,
          style: {
            fontSize: '17px', // Prevent zoom on iOS Safari
          },
        }}
        {...props}
      />
    </Box>
  );
};

export default IOSTextField;