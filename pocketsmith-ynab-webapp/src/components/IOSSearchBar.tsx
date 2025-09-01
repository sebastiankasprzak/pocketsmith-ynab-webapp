import React, { useState, useRef, useEffect } from 'react';
import { Box, InputBase, IconButton, Typography } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const IOSSearchBar = ({
  placeholder = 'Search',
  value = '',
  onChange,
  onFocus,
  onBlur,
  onCancel,
  showCancelButton = true,
  autoFocus = false,
  disabled = false
}: IOSSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleFocus = () => {
    setIsFocused(true);
    triggerHaptic('light');
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    triggerHaptic('light');
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    setInternalValue('');
    onChange?.('');
    setIsFocused(false);
    triggerHaptic('light');
    inputRef.current?.blur();
    onCancel?.();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Search Input Container */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(118, 118, 128, 0.12)',
          borderRadius: '10px',
          px: 1.5,
          py: 1,
          transition: 'all 0.2s ease',
          border: isFocused ? '2px solid' : '2px solid transparent',
          borderColor: isFocused ? 'primary.main' : 'transparent',
          '&:hover': disabled ? {} : {
            backgroundColor: 'rgba(118, 118, 128, 0.16)'
          }
        }}
      >
        {/* Search Icon */}
        <SearchIcon
          sx={{
            color: 'text.disabled',
            fontSize: '20px',
            mr: 1
          }}
        />

        {/* Input Field */}
        <InputBase
          ref={inputRef}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          sx={{
            flex: 1,
            fontSize: '16px',
            fontWeight: 400,
            color: 'text.primary',
            '& input': {
              padding: 0,
              '&::placeholder': {
                color: 'text.disabled',
                opacity: 1
              }
            }
          }}
        />

        {/* Clear Button */}
        {internalValue && (
          <IconButton
            onClick={handleClear}
            size="small"
            sx={{
              p: 0.5,
              ml: 0.5,
              backgroundColor: 'text.disabled',
              color: 'background.paper',
              '&:hover': {
                backgroundColor: 'text.secondary'
              }
            }}
          >
            <ClearIcon sx={{ fontSize: '14px' }} />
          </IconButton>
        )}
      </Box>

      {/* Cancel Button */}
      {showCancelButton && isFocused && (
        <Box
          component="button"
          onClick={handleCancel}
          sx={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            animation: 'slideInRight 0.2s ease-out',
            '@keyframes slideInRight': {
              '0%': {
                opacity: 0,
                transform: 'translateX(20px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0)'
              }
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              fontSize: '16px',
              whiteSpace: 'nowrap'
            }}
          >
            Cancel
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IOSSearchBar;