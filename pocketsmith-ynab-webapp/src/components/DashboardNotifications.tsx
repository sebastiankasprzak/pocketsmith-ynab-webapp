import React, { useEffect, useRef } from 'react';
import { Alert, Box, Button, Collapse, IconButton } from '@mui/material';
import { Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

interface DashboardNotificationsProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  autoHideDuration?: number; // in milliseconds, default 10 seconds
}

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({
  notifications,
  onDismiss,
  autoHideDuration = 10000 // 10 seconds default
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const toggleExpanded = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleDismiss = (id: string) => {
    // Clear the timer for this notification
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    
    onDismiss?.(id);
  };

  // Set up auto-dismiss timers for notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      // Only auto-dismiss if dismissible and not already has a timer
      if (notification.dismissible !== false && !timersRef.current.has(notification.id)) {
        const timer = setTimeout(() => {
          handleDismiss(notification.id);
        }, autoHideDuration);
        
        timersRef.current.set(notification.id, timer);
      }
    });

    // Cleanup timers for notifications that are no longer present
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    timersRef.current.forEach((timer, id) => {
      if (!currentNotificationIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });

    // Cleanup all timers on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [notifications, autoHideDuration]);

  if (notifications.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          severity={notification.type}
          sx={{ mb: 1 }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {notification.action && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(notification.action!.path)}
                >
                  {notification.action.label}
                </Button>
              )}
              {notification.message && (
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => toggleExpanded(notification.id)}
                >
                  {expanded.includes(notification.id) ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
              {notification.dismissible && onDismiss && (
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleDismiss(notification.id)}
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          }
        >
          {notification.title}
          <Collapse in={expanded.includes(notification.id)}>
            <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
              {notification.message}
            </Box>
          </Collapse>
        </Alert>
      ))}
    </Box>
  );
};