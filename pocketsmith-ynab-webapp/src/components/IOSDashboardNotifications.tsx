import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { 
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useIOSDetection } from '../hooks/useIOSDetection';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { IOSButton } from './IOSButton';

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    path: string;
  };
  dismissible?: boolean;
}

interface IOSDashboardNotificationsProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  autoHideDuration?: number; // in milliseconds, default 5 seconds
}

export const IOSDashboardNotifications: React.FC<IOSDashboardNotificationsProps> = ({
  notifications,
  onDismiss,
  autoHideDuration = 5000 // 5 seconds default
}) => {
  // Early return if no notifications to prevent any interference
  if (notifications.length === 0) return null;
  
  const navigate = useNavigate();
  const { shouldUseIOSExperience } = useIOSDetection();
  const { triggerHaptic } = useHapticFeedback();
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [progress, setProgress] = useState<Map<string, number>>(new Map());
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());
  const [mountedNotifications, setMountedNotifications] = useState<Set<string>>(new Set());

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ color: '#34C759', fontSize: '20px' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#FF3B30', fontSize: '20px' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#FF9500', fontSize: '20px' }} />;
      default:
        return <InfoIcon sx={{ color: '#007AFF', fontSize: '20px' }} />;
    }
  };

  const getBackgroundColor = (type: string, isDark = false) => {
    const alpha = isDark ? '0.2' : '0.1';
    switch (type) {
      case 'success':
        return `rgba(52, 199, 89, ${alpha})`;
      case 'error':
        return `rgba(255, 59, 48, ${alpha})`;
      case 'warning':
        return `rgba(255, 149, 0, ${alpha})`;
      default:
        return `rgba(0, 122, 255, ${alpha})`;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  const handleActionPress = (action: { label: string; path: string }) => {
    try {
      triggerHaptic('selection');
    } catch (error) {
      console.debug('Haptic feedback failed:', error);
    }
    navigate(action.path);
  };

  const handleDismiss = (id: string) => {
    try {
      triggerHaptic('light');
    } catch (error) {
      console.debug('Haptic feedback failed:', error);
    }
    
    // Clear the timer and interval for this notification
    const timer = timersRef.current.get(id);
    const interval = timersRef.current.get(`${id}_interval`);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    if (interval) {
      clearInterval(interval);
      timersRef.current.delete(`${id}_interval`);
    }
    
    // Remove progress tracking
    setProgress(prev => {
      const newProgress = new Map(prev);
      newProgress.delete(id);
      return newProgress;
    });
    
    onDismiss?.(id);
  };

  // Handle notification entrance animations
  useEffect(() => {
    notifications.forEach((notification) => {
      if (!mountedNotifications.has(notification.id)) {
        // Add to mounted set immediately
        setMountedNotifications(prev => new Set(prev).add(notification.id));
        
        // Delay visibility for entrance animation
        setTimeout(() => {
          setVisibleNotifications(prev => new Set(prev).add(notification.id));
        }, 100);
      }
    });

    // Remove notifications that are no longer in the list
    const currentIds = new Set(notifications.map(n => n.id));
    setMountedNotifications(prev => {
      const newSet = new Set();
      prev.forEach(id => {
        if (currentIds.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
    setVisibleNotifications(prev => {
      const newSet = new Set();
      prev.forEach(id => {
        if (currentIds.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [notifications, mountedNotifications]);

  // Set up auto-dismiss timers for notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      // Only auto-dismiss if dismissible and not already has a timer
      if (notification.dismissible !== false && !timersRef.current.has(notification.id)) {
        // Wait for entrance animation before starting timer
        setTimeout(() => {
          const startTime = Date.now();
          
          // Set up progress tracking
          const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progressPercent = Math.min((elapsed / autoHideDuration) * 100, 100);
            
            setProgress(prev => new Map(prev.set(notification.id, progressPercent)));
            
            if (progressPercent >= 100) {
              clearInterval(progressInterval);
            }
          }, 50); // Update every 50ms for smoother animation
          
          // Set up auto-dismiss timer
          const timer = setTimeout(() => {
            clearInterval(progressInterval);
            handleDismiss(notification.id);
          }, autoHideDuration);
          
          timersRef.current.set(notification.id, timer);
          
          // Store interval reference for cleanup
          timersRef.current.set(`${notification.id}_interval`, progressInterval as any);
        }, 500); // Wait 500ms for entrance animation
      }
    });

    // Cleanup timers for notifications that are no longer present
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    timersRef.current.forEach((timer, id) => {
      if (!currentNotificationIds.has(id.replace('_interval', '')) && !currentNotificationIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });

    // Cleanup all timers on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      setProgress(new Map());
      setVisibleNotifications(new Set());
      setMountedNotifications(new Set());
    };
  }, [notifications, autoHideDuration]);

  if (!shouldUseIOSExperience) {
    // Fallback to standard Material-UI alerts for non-iOS
    return (
      <Box sx={{ mb: 3 }}>
        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              p: 2,
              mb: 1,
              borderRadius: 1,
              backgroundColor: getBackgroundColor(notification.type),
              border: `1px solid ${getBorderColor(notification.type)}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2
            }}
          >
            {getIcon(notification.type)}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {notification.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
              {notification.action && (
                <Button
                  size="small"
                  onClick={() => navigate(notification.action!.path)}
                  sx={{ mt: 1, p: 0, minWidth: 'auto' }}
                >
                  {notification.action.label}
                </Button>
              )}
            </Box>
            {notification.dismissible && onDismiss && (
              <Button
                size="small"
                onClick={() => onDismiss(notification.id)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </Button>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  // iOS-style notifications as overlay
  const hasVisibleNotifications = notifications.some(n => 
    mountedNotifications.has(n.id)
  );
  
  if (!hasVisibleNotifications) return null;
  
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        pointerEvents: 'none',
        p: 2,
        pt: 8, // Account for status bar and navigation
      }}
    >
      {notifications.map((notification) => {
        const isVisible = visibleNotifications.has(notification.id);
        const isMounted = mountedNotifications.has(notification.id);
        
        if (!isMounted) return null;
        
        return (
          <Box
            key={notification.id}
            sx={{
              mb: 2,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              position: 'relative',
              pointerEvents: 'auto',
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: getBackgroundColor(notification.type),
                pointerEvents: 'none'
              }
            }}
          >
          {/* Auto-dismiss progress indicator */}
          {notification.dismissible !== false && progress.has(notification.id) && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: `${progress.get(notification.id) || 0}%`,
                backgroundColor: getBorderColor(notification.type),
                transition: 'width 0.1s linear',
                zIndex: 2
              }}
            />
          )}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Icon */}
            <Box sx={{ mt: 0.25 }}>
              {getIcon(notification.type)}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '17px',
                  color: 'text.primary',
                  mb: 0.5,
                  lineHeight: 1.3
                }}
              >
                {notification.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '15px',
                  lineHeight: 1.4,
                  mb: notification.action ? 1.5 : 0
                }}
              >
                {notification.message}
              </Typography>

              {/* Action Button */}
              {notification.action && (
                <IOSButton
                  variant="plain"
                  size="small"
                  onClick={() => handleActionPress(notification.action!)}
                  hapticFeedback={true}
                  pressAnimation={true}
                  endIcon={<ChevronRightIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    color: getBorderColor(notification.type),
                    fontWeight: 600,
                    fontSize: '15px',
                    p: 0,
                    minWidth: 'auto',
                    justifyContent: 'flex-start'
                  }}
                >
                  {notification.action.label}
                </IOSButton>
              )}
            </Box>

            {/* Dismiss Button */}
            {notification.dismissible && onDismiss && (
              <IOSButton
                variant="plain"
                size="small"
                onClick={() => handleDismiss(notification.id)}
                hapticFeedback={true}
                pressAnimation={true}
                sx={{
                  minWidth: 'auto',
                  p: 0.5,
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: '18px' }} />
              </IOSButton>
            )}
          </Box>
        </Box>
        );
      })}
    </Box>
  );
};

export default IOSDashboardNotifications;