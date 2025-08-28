import React from 'react';
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
}

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({
  notifications,
  onDismiss
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

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
                  onClick={() => onDismiss(notification.id)}
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