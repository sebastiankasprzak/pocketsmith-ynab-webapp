import React from 'react';
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
}

export const IOSDashboardNotifications: React.FC<IOSDashboardNotificationsProps> = ({
  notifications,
  onDismiss
}) => {
  const navigate = useNavigate();
  const { shouldUseIOSExperience } = useIOSDetection();
  const { triggerHaptic } = useHapticFeedback();

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
    onDismiss?.(id);
  };

  if (notifications.length === 0) return null;

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

  // iOS-style notifications
  return (
    <Box sx={{ mb: 3 }}>
      {notifications.map((notification) => (
        <Box
          key={notification.id}
          sx={{
            mb: 2,
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative',
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
      ))}
    </Box>
  );
};

export default IOSDashboardNotifications;