import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Portal, IconButton } from '@mui/material';
import { 
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { IOSProgressIndicator } from './IOSProgressIndicator';
import type { SyncProgressState } from './IOSProgressIndicator';

export interface SyncNotificationData {
  id: string;
  type: 'sync_started' | 'sync_progress' | 'sync_completed' | 'sync_failed' | 'sync_warning';
  title: string;
  message?: string;
  progress?: number;
  transactionCount?: number;
  accountName?: string;
  estimatedTime?: string;
  duration?: number; // Auto-dismiss after this time (ms), 0 for persistent
  timestamp: Date;
}

interface IOSSyncNotificationProps {
  notification: SyncNotificationData;
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
  index?: number;
}

export const IOSSyncNotification: React.FC<IOSSyncNotificationProps> = ({
  notification,
  onClose,
  position = 'top',
  index = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    // Trigger haptic feedback based on notification type
    switch (notification.type) {
      case 'sync_started':
        triggerHaptic('light');
        break;
      case 'sync_completed':
        triggerHaptic('success');
        break;
      case 'sync_failed':
        triggerHaptic('error');
        break;
      case 'sync_warning':
        triggerHaptic('warning');
        break;
      default:
        triggerHaptic('light');
    }
  }, [notification.type, triggerHaptic]);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(notification.id);
    }, 300);
  }, [notification.id, onClose]);

  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'sync_started':
        return {
          icon: <SyncIcon />,
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
          syncState: 'syncing' as SyncProgressState,
        };
      case 'sync_progress':
        return {
          icon: <ProgressIcon />,
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
          syncState: 'syncing' as SyncProgressState,
        };
      case 'sync_completed':
        return {
          icon: <SuccessIcon />,
          color: '#34C759',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
          syncState: 'completed' as SyncProgressState,
        };
      case 'sync_failed':
        return {
          icon: <ErrorIcon />,
          color: '#FF3B30',
          backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
          syncState: 'failed' as SyncProgressState,
        };
      case 'sync_warning':
        return {
          icon: <WarningIcon />,
          color: '#FF9500',
          backgroundColor: isDark ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)',
          syncState: 'pending' as SyncProgressState,
        };
      default:
        return {
          icon: <SyncIcon />,
          color: '#007AFF',
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
          syncState: 'idle' as SyncProgressState,
        };
    }
  };

  const config = getNotificationConfig();
  const showProgress = notification.type === 'sync_progress' && notification.progress !== undefined;

  if (!isVisible) return null;

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          [position]: position === 'top' 
            ? `calc(env(safe-area-inset-top, 20px) + ${index * 90}px)` 
            : `calc(env(safe-area-inset-bottom, 20px) + ${index * 90}px)`,
          left: '16px',
          right: '16px',
          zIndex: 9999 - index,
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
            backgroundColor: isDark 
              ? 'rgba(28, 28, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            boxShadow: isDark
              ? '0 10px 40px rgba(0, 0, 0, 0.3)'
              : '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${isDark ? 'rgba(84, 84, 88, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: config.backgroundColor,
              pointerEvents: 'none'
            }
          }}
        >
          {/* Icon */}
          <Box 
            sx={{ 
              mt: 0.5, 
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: `${config.color}20`,
              color: config.color,
              animation: notification.type === 'sync_started' || notification.type === 'sync_progress'
                ? 'syncPulse 2s ease-in-out infinite'
                : 'none',
              '@keyframes syncPulse': {
                '0%': { 
                  transform: 'scale(1)',
                  backgroundColor: `${config.color}20`,
                },
                '50%': { 
                  transform: 'scale(1.05)',
                  backgroundColor: `${config.color}30`,
                },
                '100%': { 
                  transform: 'scale(1)',
                  backgroundColor: `${config.color}20`,
                },
              },
            }}
          >
            {React.cloneElement(config.icon, {
              sx: {
                fontSize: 18,
                animation: notification.type === 'sync_started' || notification.type === 'sync_progress'
                  ? 'spin 2s linear infinite'
                  : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              },
            })}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, zIndex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: notification.message ? 0.5 : 0,
                fontSize: '15px',
              }}
            >
              {notification.title}
            </Typography>
            
            {notification.message && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.4,
                  fontSize: '13px',
                  mb: showProgress ? 1 : 0,
                }}
              >
                {notification.message}
              </Typography>
            )}

            {/* Progress indicator for sync progress notifications */}
            {showProgress && (
              <Box sx={{ mt: 1 }}>
                <IOSProgressIndicator
                  variant="linear"
                  size="small"
                  progress={notification.progress}
                  color="primary"
                  showLabel={false}
                />
              </Box>
            )}

            {/* Additional metadata */}
            {(notification.transactionCount || notification.estimatedTime) && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 0.5,
                flexWrap: 'wrap'
              }}>
                {notification.transactionCount && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: config.color,
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: `${config.color}15`,
                      px: 1,
                      py: 0.25,
                      borderRadius: '8px',
                    }}
                  >
                    {notification.transactionCount} transactions
                  </Typography>
                )}
                {notification.estimatedTime && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '12px',
                    }}
                  >
                    ETA: {notification.estimatedTime}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              zIndex: 1,
              color: 'text.secondary',
              width: 24,
              height: 24,
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Portal>
  );
};

// Hook for managing sync notifications
export const useIOSSyncNotifications = () => {
  const [notifications, setNotifications] = useState<SyncNotificationData[]>([]);

  const showNotification = useCallback((notification: Omit<SyncNotificationData, 'id' | 'timestamp'>) => {
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: SyncNotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSyncStarted = useCallback((accountName?: string, transactionCount?: number) => {
    return showNotification({
      type: 'sync_started',
      title: 'Sync Started',
      message: accountName ? `Syncing ${accountName}` : 'Starting synchronization...',
      transactionCount,
      duration: 3000,
    });
  }, [showNotification]);

  const showSyncProgress = useCallback((progress: number, transactionCount?: number, estimatedTime?: string) => {
    return showNotification({
      type: 'sync_progress',
      title: 'Sync in Progress',
      message: `${Math.round(progress)}% complete`,
      progress,
      transactionCount,
      estimatedTime,
      duration: 0, // Don't auto-dismiss progress notifications
    });
  }, [showNotification]);

  const showSyncCompleted = useCallback((transactionCount?: number, accountName?: string) => {
    return showNotification({
      type: 'sync_completed',
      title: 'Sync Completed',
      message: accountName 
        ? `Successfully synced ${accountName}` 
        : 'Synchronization completed successfully',
      transactionCount,
      duration: 5000,
    });
  }, [showNotification]);

  const showSyncFailed = useCallback((error?: string, accountName?: string) => {
    return showNotification({
      type: 'sync_failed',
      title: 'Sync Failed',
      message: error || (accountName ? `Failed to sync ${accountName}` : 'Synchronization failed'),
      duration: 8000,
    });
  }, [showNotification]);

  const showSyncWarning = useCallback((message: string, accountName?: string) => {
    return showNotification({
      type: 'sync_warning',
      title: 'Sync Warning',
      message: accountName ? `${accountName}: ${message}` : message,
      duration: 6000,
    });
  }, [showNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const NotificationContainer: React.FC<{ position?: 'top' | 'bottom' }> = ({ position = 'top' }) => (
    <>
      {notifications.map((notification, index) => (
        <IOSSyncNotification
          key={notification.id}
          notification={notification}
          onClose={hideNotification}
          position={position}
          index={index}
        />
      ))}
    </>
  );

  return {
    notifications,
    showNotification,
    hideNotification,
    showSyncStarted,
    showSyncProgress,
    showSyncCompleted,
    showSyncFailed,
    showSyncWarning,
    clearAllNotifications,
    NotificationContainer,
  };
};

export default IOSSyncNotification;