import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { NotificationPanel } from './NotificationPanel';

const demoNotifications = [
  {
    id: '1',
    type: 'error' as const,
    title: 'Synchronization Failed',
    message: 'Unable to sync data with YNAB. Check your API connection.',
    action: {
      label: 'View Status',
      path: '/sync-status'
    },
    dismissible: true
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Balance Discrepancies Found',
    message: 'Found 3 balance discrepancies totaling $125.50',
    action: {
      label: 'Review Balances',
      path: '/balance-comparison'
    },
    dismissible: true
  },
  {
    id: '3',
    type: 'info' as const,
    title: 'Accounts Need Mapping',
    message: '2 accounts require configuration for synchronization',
    action: {
      label: 'Configure Mappings',
      path: '/account-mappings'
    },
    dismissible: true
  },
  {
    id: '4',
    type: 'success' as const,
    title: 'Sync Completed',
    message: 'Successfully synchronized 15 accounts with YNAB',
    dismissible: true
  }
];

export const NotificationPanelDemo: React.FC = () => {
  const [notifications, setNotifications] = useState(demoNotifications);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const resetNotifications = () => {
    setNotifications(demoNotifications);
  };

  const addRandomNotification = () => {
    const types = ['error', 'warning', 'info', 'success'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newNotification = {
      id: `demo-${Date.now()}`,
      type: randomType,
      title: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Notification`,
      message: `This is a demo ${randomType} notification created at ${new Date().toLocaleTimeString()}`,
      dismissible: true
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Notification Panel Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This demo shows the new notification panel in action. The notification button 
        appears in the upper right corner with a badge showing the count.
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Typography variant="h6">
          Dashboard Header
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationPanel
            notifications={notifications}
            onDismiss={handleDismiss}
          />
          <Typography variant="body2" color="text.secondary">
            ← Notification Panel
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          onClick={addRandomNotification}
          size="small"
        >
          Add Notification
        </Button>
        <Button 
          variant="outlined" 
          onClick={resetNotifications}
          size="small"
        >
          Reset Demo
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Current count: {notifications.length}
        </Typography>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Features Demonstrated:
        </Typography>
        <ul>
          <li>Notification button with badge count</li>
          <li>Dropdown panel with all notifications</li>
          <li>Different notification types (error, warning, info, success)</li>
          <li>Action buttons for navigation</li>
          <li>Dismiss functionality</li>
          <li>iOS and Material-UI styling support</li>
          <li>Responsive design</li>
          <li>Keyboard navigation (Escape to close)</li>
          <li>Click outside to close</li>
        </ul>
      </Box>
    </Paper>
  );
};

export default NotificationPanelDemo;