import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  useTheme,
  FormHelperText,
  InputAdornment,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSPickerOption {
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface IOSPickerProps extends Omit<SelectProps, 'variant' | 'value' | 'onChange'> {
  options: IOSPickerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
  hapticFeedback?: boolean;
  searchable?: boolean;
  emptyText?: string;
  groupBy?: boolean;
  showIcons?: boolean;
  showSubtitles?: boolean;
}

export const IOSPicker = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error = false,
  helperText,
  hapticFeedback = true,
  searchable = false,
  emptyText = 'No options available',
  groupBy = false,
  showIcons = false,
  showSubtitles = false,
  disabled = false,
  required = false,
  className = '',
  ...props
}: IOSPickerProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selection, impact } = useHapticFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Group options if groupBy is enabled
  const groupedOptions = groupBy
    ? filteredOptions.reduce((groups, option) => {
        const group = option.group || 'Other';
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
        return groups;
      }, {} as Record<string, IOSPickerOption[]>)
    : { '': filteredOptions };

  const selectedOption = options.find(option => option.value === value);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
    setSearchTerm('');
    
    if (hapticFeedback) {
      selection();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    handleClose();
    
    if (hapticFeedback) {
      impact('light');
    }
  };

  const getSelectStyles = () => {
    return {
      '& .MuiOutlinedInput-root': {
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
            : isOpen 
              ? (isDark ? '#0A84FF' : '#007AFF')
              : isDark 
                ? 'rgba(84, 84, 88, 0.36)' 
                : 'rgba(60, 60, 67, 0.18)'
        }`,
        transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        '&:hover': {
          borderColor: disabled 
            ? undefined
            : error 
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
        '& .MuiSelect-select': {
          padding: '12px 16px',
          paddingRight: '40px !important',
          fontSize: '17px',
          display: 'flex',
          alignItems: 'center',
          color: value 
            ? (isDark ? '#FFFFFF' : '#000000')
            : (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)'),
        },
        '& .MuiSelect-icon': {
          color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
          fontSize: '20px',
          right: '12px',
          transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        },
      },
      '& .MuiInputLabel-root': {
        fontSize: '17px',
        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontWeight: 400,
        color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
        transform: 'translate(16px, 12px) scale(1)',
        '&.Mui-focused, &.MuiInputLabel-shrink': {
          color: error 
            ? (isDark ? '#FF453A' : '#FF3B30')
            : (isDark ? '#0A84FF' : '#007AFF'),
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

  const renderCustomSelect = () => (
    <Box
      ref={selectRef}
      onClick={handleOpen}
      sx={{
        ...getSelectStyles()['& .MuiOutlinedInput-root'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        pointerEvents: disabled ? 'none' : 'auto',
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
          {selectedOption ? selectedOption.label : placeholder}
        </Box>
      </Box>
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: `5px solid ${isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'}`,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      />
    </Box>
  );

  const renderPopoverContent = () => (
    <Box
      sx={{
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        minWidth: selectRef.current?.offsetWidth || 200,
        maxWidth: 400,
        maxHeight: 300,
        border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
        boxShadow: isDark 
          ? '0 10px 40px rgba(0, 0, 0, 0.6)'
          : '0 10px 40px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Search input */}
      {searchable && (
        <Box sx={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}` }}>
          <input
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#000000',
              fontSize: '16px',
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              outline: 'none',
            }}
          />
        </Box>
      )}

      {/* Options list */}
      <List sx={{ padding: 0, maxHeight: searchable ? 200 : 300, overflow: 'auto' }}>
        {Object.keys(groupedOptions).length === 0 || filteredOptions.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={emptyText}
              sx={{
                textAlign: 'center',
                color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                fontStyle: 'italic',
              }}
            />
          </ListItem>
        ) : (
          Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <Box key={groupName}>
              {/* Group header */}
              {groupBy && groupName && (
                <Box
                  sx={{
                    padding: '8px 16px',
                    backgroundColor: isDark ? 'rgba(84, 84, 88, 0.16)' : 'rgba(120, 120, 128, 0.16)',
                    borderBottom: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {groupName}
                  </Typography>
                </Box>
              )}

              {/* Group options */}
              {groupOptions.map((option) => (
                <ListItem
                  key={option.value}
                  button
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  sx={{
                    minHeight: '44px',
                    padding: '12px 16px',
                    borderBottom: `0.5px solid ${isDark ? 'rgba(84, 84, 88, 0.36)' : 'rgba(60, 60, 67, 0.18)'}`,
                    backgroundColor: value === option.value 
                      ? (isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                      : 'transparent',
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
                  <ListItemText
                    primary={option.label}
                    secondary={showSubtitles && option.subtitle ? option.subtitle : undefined}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '17px',
                        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        fontWeight: value === option.value ? 600 : 400,
                        color: option.disabled
                          ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                          : value === option.value
                            ? (isDark ? '#0A84FF' : '#007AFF')
                            : (isDark ? '#FFFFFF' : '#000000'),
                      },
                      '& .MuiListItemText-secondary': {
                        fontSize: '13px',
                        fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        color: option.disabled
                          ? (isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)')
                          : (isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)'),
                        marginTop: '2px',
                      },
                    }}
                  />
                  {value === option.value && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </Box>
                  )}
                </ListItem>
              ))}
            </Box>
          ))
        )}
      </List>
    </Box>
  );

  return (
    <Box className={`ios-picker ${className}`}>
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
          {required && (
            <Box component="span" sx={{ color: isDark ? '#FF453A' : '#FF3B30', marginLeft: '4px' }}>
              *
            </Box>
          )}
        </Typography>
      )}

      {renderCustomSelect()}

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '13px',
            fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            marginLeft: '16px',
            marginTop: '6px',
            display: 'block',
            color: error 
              ? (isDark ? '#FF453A' : '#FF3B30')
              : isDark 
                ? 'rgba(235, 235, 245, 0.6)' 
                : 'rgba(60, 60, 67, 0.6)',
          }}
        >
          {helperText}
        </Typography>
      )}

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disablePortal={false}
        sx={{
          zIndex: 9999, // Higher than IOSBottomSheet (9998)
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            marginTop: '8px',
          },
        }}
        slotProps={{
          root: {
            style: {
              zIndex: 9999,
            },
          },
        }}
      >
        {renderPopoverContent()}
      </Popover>
    </Box>
  );
};

export default IOSPicker;