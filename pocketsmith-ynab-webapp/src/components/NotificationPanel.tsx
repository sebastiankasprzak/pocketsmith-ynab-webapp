import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
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

interface NotificationPanelProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onDismiss
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { shouldUseIOSExperience } = useIOSDetection();
  const { triggerHaptic } = useHapticFeedback();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOpen = Boolean(anchorEl);
  const notificationCount = notifications.length;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      triggerHaptic('selection');
    } catch (error) {
      console.debug('Haptic feedback failed:', error);
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: { label: string; path: string }) => {
    try {
      triggerHaptic('selection');
    } catch (error) {
      console.debug('Haptic feedback failed:', error);
    }
    navigate(action.path);
    handleClose();
  };

  const handleDismiss = (id: string) => {
    try {
      triggerHaptic('light');
    } catch (error) {
      console.debug('Haptic feedback failed:', error);
    }
    onDismiss?.(id);
  };

  const getIcon = (type: string) => {
    const iconProps = { fontSize: 'small' as const };
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ color: '#34C759', ...iconProps }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#FF3B30', ...iconProps }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#FF9500', ...iconProps }} />;
      default:
        return <InfoIcon sx={{ color: '#007AFF', ...iconProps }} />;
    }
  };

  const getTypeColor = (type: string) => {
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // iOS-style notification panel
  const renderIOSPanel = () => (
    <Paper
      elevation={0}
      sx={{
        width: isMobile ? '90vw' : 380,
        maxWidth: isMobile ? '90vw' : 380,
        maxHeight: isMobile ? '70vh' : 500,
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        ...(theme.palette.mode === 'dark' && {
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        })
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600 }}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '15px' }}>
          {notificationCount} {notificationCount === 1 ? 'item' : 'items'}
        </Typography>
      </Box>

      {/* Notification List */}
      <Box sx={{ 
        maxHeight: isMobile ? 'calc(70vh - 80px)' : 420,
        overflow: 'auto'
      }}>
        {notifications.length === 0 ? (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ fontSize: '15px' }}>
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          notifications.map((notification, index) => (
            <Box key={notification.id}>
              <Box sx={{ 
                p: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                }
              }}>
                {/* Icon */}
                <Box sx={{ mt: 0.5 }}>
                  {getIcon(notification.type)}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: '15px',
                      mb: 0.5,
                      lineHeight: 1.3
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '14px',
                      lineHeight: 1.4,
                      mb: notification.action ? 1 : 0
                    }}
                  >
                    {notification.message}
                  </Typography>

                  {/* Action Button */}
                  {notification.action && (
                    <IOSButton
                      variant="plain"
                      size="small"
                      onClick={() => handleActionClick(notification.action!)}
                      hapticFeedback={true}
                      pressAnimation={true}
                      endIcon={<ChevronRightIcon sx={{ fontSize: '14px' }} />}
                      sx={{
                        color: getTypeColor(notification.type),
                        fontWeight: 600,
                        fontSize: '14px',
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
                    <CloseIcon sx={{ fontSize: '16px' }} />
                  </IOSButton>
                )}
              </Box>
              {index < notifications.length - 1 && (
                <Divider sx={{ ml: 6 }} />
              )}
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );

  // Standard Material-UI panel
  const renderStandardPanel = () => (
    <Paper
      elevation={8}
      sx={{
        width: isMobile ? '90vw' : 380,
        maxWidth: isMobile ? '90vw' : 380,
        maxHeight: isMobile ? '70vh' : 500,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">
          Notifications
        </Typography>
        <Typography variant="body2">
          {notificationCount}
        </Typography>
      </Box>

      {/* Notification List */}
      <List sx={{ 
        maxHeight: isMobile ? 'calc(70vh - 80px)' : 420,
        overflow: 'auto',
        p: 0
      }}>
        {notifications.length === 0 ? (
          <ListItem sx={{ 
            flexDirection: 'column',
            py: 4,
            textAlign: 'center'
          }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </ListItem>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {notification.message}
                      </Typography>
                      {notification.action && (
                        <Button
                          size="small"
                          onClick={() => handleActionClick(notification.action!)}
                          sx={{ p: 0, minWidth: 'auto' }}
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </Box>
                  }
                />
                {notification.dismissible && onDismiss && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );

  return (
    <>
      {/* Notification Button */}
      <IconButton
        ref={buttonRef}
        onClick={handleClick}
        size="small"
        sx={{
          color: 'text.primary',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'scale(1.05)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
        aria-label={`Notifications (${notificationCount})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Badge 
          badgeContent={notificationCount > 99 ? '99+' : notificationCount} 
          color="error"
          invisible={notificationCount === 0}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              minWidth: '18px',
              height: '18px',
              ...(shouldUseIOSExperience && {
                backgroundColor: '#FF3B30',
                color: 'white',
                fontWeight: 600
              })
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Panel Popover */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
        sx={{
          '& .MuiPopover-paper': {
            mt: 1,
            ...(shouldUseIOSExperience && {
              backgroundColor: 'transparent',
              boxShadow: 'none'
            })
          }
        }}
        slotProps={{
          paper: {
            sx: {
              ...(shouldUseIOSExperience && {
                backgroundColor: 'transparent',
                boxShadow: 'none'
              })
            }
          }
        }}
      >
        {shouldUseIOSExperience ? renderIOSPanel() : renderStandardPanel()}
      </Popover>
    </>
  );
};

export default NotificationPanel;