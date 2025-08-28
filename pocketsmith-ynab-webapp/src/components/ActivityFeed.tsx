import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { StatusIndicator } from './StatusIndicator';

interface Activity {
  id: string;
  type: 'sync' | 'mapping' | 'balance_check';
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  onRefresh?: () => void;
  maxHeight?: number;
  title?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading = false,
  onRefresh,
  maxHeight = 350,
  title = 'Recent Activity'
}) => {
  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'sync': return 'primary';
      case 'mapping': return 'secondary';
      case 'balance_check': return 'info';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ height: '100%', minHeight: 400 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{title}</Typography>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Box sx={{ maxHeight, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {activities.map((activity) => (
              <ListItem key={activity.id} sx={{ py: 1 }}>
                <ListItemIcon>
                  <StatusIndicator 
                    status={activity.status} 
                    showLabel={false}
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        color={activity.status === 'error' ? 'error.main' : 'text.primary'}
                      >
                        {activity.message}
                      </Typography>
                      <Chip
                        size="small"
                        label={activity.type.replace('_', ' ')}
                        color={getActivityTypeColor(activity.type) as any}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  }
                  secondary={formatTimeAgo(activity.timestamp)}
                />
              </ListItem>
            ))}
            
            {activities.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No recent activity"
                  secondary="Activity will appear here as operations are performed"
                />
              </ListItem>
            )}
          </List>
        )}
      </Box>
    </Paper>
  );
};