import React, { ReactNode, useEffect, useState } from 'react';
import { Box, Portal, Backdrop, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'half' | 'full';
  showHandle?: boolean;
  showCloseButton?: boolean;
}

export const IOSBottomSheet = ({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  showCloseButton = false
}: IOSBottomSheetProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const getSheetHeight = () => {
    switch (height) {
      case 'half':
        return '50vh';
      case 'full':
        return '90vh';
      default:
        return 'auto';
    }
  };

  const handleClose = () => {
    triggerHaptic('light');
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 200);
  };

  // Handle swipe down to close
  const swipeHandlers = useSwipeGestures({
    onSwipeDown: () => {
      if (open) {
        handleClose();
      }
    },
    threshold: 50
  });

  useEffect(() => {
    if (open) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
      triggerHaptic('light');
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, triggerHaptic]);

  if (!open && !isAnimating) return null;

  return (
    <Portal>
      <Backdrop
        open={open}
        onClick={handleClose}
        sx={{
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          animation: open && !isAnimating ? 'backdropFadeIn 0.3s ease-out' : 'backdropFadeOut 0.2s ease-in',
          '@keyframes backdropFadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          },
          '@keyframes backdropFadeOut': {
            '0%': { opacity: 1 },
            '100%': { opacity: 0 }
          }
        }}
      >
        <Box
          {...swipeHandlers}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            maxHeight: getSheetHeight(),
            minHeight: height === 'auto' ? 'auto' : getSheetHeight(),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
            animation: open && !isAnimating ? 'sheetSlideUp 0.3s ease-out' : 'sheetSlideDown 0.2s ease-in',
            '@keyframes sheetSlideUp': {
              '0%': {
                transform: 'translateY(100%)'
              },
              '100%': {
                transform: 'translateY(0)'
              }
            },
            '@keyframes sheetSlideDown': {
              '0%': {
                transform: 'translateY(0)'
              },
              '100%': {
                transform: 'translateY(100%)'
              }
            }
          }}
        >
          {/* Handle */}
          {showHandle && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 1.5,
                cursor: 'pointer'
              }}
              onClick={handleClose}
            >
              <Box
                sx={{
                  width: '36px',
                  height: '4px',
                  backgroundColor: 'text.disabled',
                  borderRadius: '2px'
                }}
              />
            </Box>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title || ''}
              </Typography>
              {showCloseButton && (
                <IconButton
                  onClick={handleClose}
                  size="small"
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 3,
              py: 2,
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {children}
          </Box>

          {/* Safe area bottom padding for iOS */}
          <Box
            sx={{
              height: 'env(safe-area-inset-bottom, 0px)',
              backgroundColor: 'background.paper'
            }}
          />
        </Box>
      </Backdrop>
    </Portal>
  );
};

export default IOSBottomSheet;