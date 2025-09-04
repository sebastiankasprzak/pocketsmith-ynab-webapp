import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface IOSActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: IOSActionSheetAction[];
  cancelLabel?: string;
}

export const IOSActionSheet = ({
  open,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel'
}: IOSActionSheetProps) => {
  const theme = useTheme();
  const { selection } = useHapticFeedback();
  const isDark = theme.palette.mode === 'dark';

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  const handleActionPress = (action: IOSActionSheetAction) => {
    if (selection) {
      selection();
    }
    action.onPress();
    onClose();
  };

  const handleCancel = () => {
    if (selection) {
      selection();
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10001,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 8px 8px 8px',
      }}
      onClick={onClose}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
          borderRadius: '16px',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out',
          '@keyframes slideUp': {
            '0%': {
              transform: 'translateY(100%)',
              opacity: 0,
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1,
            },
          },
        }}
      >
        {/* Header */}
        {(title || message) && (
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            {title && (
              <Typography 
                sx={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isDark ? '#EBEBF5' : '#8E8E93',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>
            )}
            {message && (
              <Typography 
                sx={{ 
                  mt: title ? 1 : 0,
                  fontSize: '13px',
                  color: isDark ? '#EBEBF5' : '#8E8E93',
                  lineHeight: 1.4
                }}
              >
                {message}
              </Typography>
            )}
          </Box>
        )}

        {/* Actions */}
        <Box>
          {actions.map((action, index) => (
            <Box
              key={index}
              onClick={() => !action.disabled && handleActionPress(action)}
              sx={{
                minHeight: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: index < actions.length - 1 ? `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                fontSize: '20px',
                fontWeight: action.destructive ? 600 : 400,
                color: action.destructive 
                  ? '#FF3B30' 
                  : action.disabled 
                    ? (isDark ? '#48484A' : '#C7C7CC')
                    : '#007AFF',
                backgroundColor: 'transparent',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: action.disabled ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                },
                '&:active': {
                  backgroundColor: action.disabled ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  transform: action.disabled ? 'none' : 'scale(0.98)',
                },
              }}
            >
              {action.label}
            </Box>
          ))}
        </Box>

        {/* Cancel Button */}
        <Box sx={{ p: 1 }}>
          <Box
            onClick={handleCancel}
            sx={{
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#007AFF',
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
              },
              '&:active': {
                backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
                transform: 'scale(0.98)',
              },
            }}
          >
            {cancelLabel}
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body
  );
};

export default IOSActionSheet;