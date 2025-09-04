import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export const IOSConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false
}: IOSConfirmationDialogProps) => {
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

  const handleConfirm = () => {
    if (selection) {
      selection();
    }
    onConfirm();
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
        zIndex: 10002,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          animation: 'scaleIn 0.3s ease-out',
          '@keyframes scaleIn': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
        }}
      >
        {/* Content */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography 
            sx={{ 
              fontSize: '17px',
              fontWeight: 600,
              color: isDark ? '#FFFFFF' : '#000000',
              mb: message ? 1 : 0,
              lineHeight: 1.3
            }}
          >
            {title}
          </Typography>
          {message && (
            <Typography 
              sx={{ 
                fontSize: '13px',
                color: isDark ? '#EBEBF5' : '#8E8E93',
                lineHeight: 1.4
              }}
            >
              {message}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ borderTop: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
          <Box sx={{ display: 'flex' }}>
            {/* Cancel Button */}
            <Box
              onClick={loading ? undefined : handleCancel}
              sx={{
                flex: 1,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                fontWeight: 400,
                color: '#007AFF',
                backgroundColor: 'transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                borderRight: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: loading ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                },
                '&:active': {
                  backgroundColor: loading ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                },
              }}
            >
              {cancelLabel}
            </Box>

            {/* Confirm Button */}
            <Box
              onClick={loading ? undefined : handleConfirm}
              sx={{
                flex: 1,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                fontWeight: 600,
                color: destructive ? '#FF3B30' : '#007AFF',
                backgroundColor: 'transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: loading ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                },
                '&:active': {
                  backgroundColor: loading ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                },
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${destructive ? '#FF3B30' : '#007AFF'}`,
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              ) : (
                confirmLabel
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>,
    document.body
  );
};

export default IOSConfirmationDialog;