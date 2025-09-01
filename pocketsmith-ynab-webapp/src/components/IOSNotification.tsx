import React, { useState, useEffect } from 'react';
import { Box, Typography, Portal, IconButton } from '@mui/material';
import { 
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export type IOSNotificationType = 'success' | 'error' | 'warning' | 'info';

interface IOSNotificationProps {
  type: IOSNotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 for persistent
  onClose?: () => void;
  showCloseButton?: boolean;
  position?: 'top' | 'bottom';
}

export const IOSNotification = ({
  type,
  title,
  message,
  duration = 4000,
  onClose,
  showCloseButton = true,
  position = 'top'
}: IOSNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    // Trigger haptic feedback based on notification type
    switch (type) {
      case 'success':
        triggerHaptic('light');
        break;
      case 'error':
        triggerHaptic('heavy');
        break;
      case 'warning':
        triggerHaptic('medium');
        break;
      default:
        triggerHaptic('light');
    }
  }, [type, triggerHaptic]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ color: '#34C759' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#FF3B30' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#FF9500' }} />;
      default:
        return <InfoIcon sx={{ color: '#007AFF' }} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(52, 199, 89, 0.1)';
      case 'error':
        return 'rgba(255, 59, 48, 0.1)';
      case 'warning':
        return 'rgba(255, 149, 0, 0.1)';
      default:
        return 'rgba(0, 122, 255, 0.1)';
    }
  };

  if (!isVisible) return null;

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          [position]: position === 'top' ? 'env(safe-area-inset-top, 20px)' : 'env(safe-area-inset-bottom, 20px)',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          animation: isAnimating 
            ? `slideOut${position === 'top' ? 'Up' : 'Down'} 0.3s ease-in`
            : `slideIn${position === 'top' ? 'Down' : 'Up'} 0.3s ease-out`,
          '@keyframes slideInDown': {
            '0%': {
              transform: 'translateY(-100%)',
              opacity: 0
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1
            }
          },
          '@keyframes slideInUp': {
            '0%': {
              transform: 'translateY(100%)',
              opacity: 0
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1
            }
          },
          '@keyframes slideOutUp': {
            '0%': {
              transform: 'translateY(0)',
              opacity: 1
            },
            '100%': {
              transform: 'translateY(-100%)',
              opacity: 0
            }
          },
          '@keyframes slideOutDown': {
            '0%': {
              transform: 'translateY(0)',
              opacity: 1
            },
            '100%': {
              transform: 'translateY(100%)',
              opacity: 0
            }
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: getBackgroundColor(),
              pointerEvents: 'none'
            }
          }}
        >
          {/* Icon */}
          <Box sx={{ mt: 0.5, zIndex: 1 }}>
            {getIcon()}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, zIndex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: message ? 0.5 : 0
              }}
            >
              {title}
            </Typography>
            {message && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.4
                }}
              >
                {message}
              </Typography>
            )}
          </Box>

          {/* Close Button */}
          {showCloseButton && (
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                zIndex: 1,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Portal>
  );
};

// Hook for managing notifications
interface NotificationState {
  id: string;
  type: IOSNotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export const useIOSNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = (notification: Omit<NotificationState, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'error', title, message, duration });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'warning', title, message, duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'info', title, message, duration });
  };

  const NotificationContainer = () => (
    <>
      {notifications.map((notification, index) => (
        <Box
          key={notification.id}
          sx={{
            position: 'fixed',
            top: `calc(env(safe-area-inset-top, 20px) + ${index * 80}px)`,
            left: 0,
            right: 0,
            zIndex: 9999 - index
          }}
        >
          <IOSNotification
            {...notification}
            onClose={() => hideNotification(notification.id)}
          />
        </Box>
      ))}
    </>
  );

  return {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    NotificationContainer
  };
};

export default IOSNotification;