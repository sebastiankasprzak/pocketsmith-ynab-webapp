import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { IOSCard } from '../components/IOSCard';
import { IOSButton } from '../components/IOSButton';
import { IOSLayout } from '../components/IOSLayout';
import { IOSDebug } from '../components/IOSDebug';

export const IOSDemo = () => {
  return (
    <IOSLayout title="iOS Demo">
      <Box sx={{ pb: 2 }}>
        <IOSDebug />
        
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          iOS Native Components
        </Typography>

        {/* iOS Cards Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Account Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your PocketSmith and YNAB accounts are synchronized and up to date.
          </Typography>
        </IOSCard>

        <IOSCard elevated>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Sync
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last synchronized 5 minutes ago
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IOSButton variant="primary" size="small">
              Sync Now
            </IOSButton>
            <IOSButton variant="secondary" size="small">
              View Details
            </IOSButton>
          </Box>
        </IOSCard>

        {/* iOS List Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quick Actions
          </Typography>
          <List sx={{ p: 0 }}>
            <ListItem className="ios-list-item" sx={{ px: 0 }}>
              <ListItemText 
                primary="Sync All Accounts" 
                secondary="Update all account balances"
              />
            </ListItem>
            <Divider />
            <ListItem className="ios-list-item" sx={{ px: 0 }}>
              <ListItemText 
                primary="View Reports" 
                secondary="Check sync history and status"
              />
            </ListItem>
            <Divider />
            <ListItem className="ios-list-item" sx={{ px: 0 }}>
              <ListItemText 
                primary="Account Settings" 
                secondary="Manage account mappings"
              />
            </ListItem>
          </List>
        </IOSCard>

        {/* iOS Buttons Demo */}
        <IOSCard>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Button Styles
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <IOSButton variant="primary" fullWidth>
              Primary Action
            </IOSButton>
            <IOSButton variant="secondary" fullWidth>
              Secondary Action
            </IOSButton>
            <IOSButton variant="destructive" fullWidth>
              Delete Account
            </IOSButton>
            <IOSButton variant="plain" fullWidth>
              Cancel
            </IOSButton>
          </Box>
        </IOSCard>

        {/* Status Card */}
        <IOSCard>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Sync Status
              </Typography>
              <Typography variant="body2" color="success.main">
                All systems operational
              </Typography>
            </Box>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: 'success.main' 
              }} 
            />
          </Box>
        </IOSCard>
      </Box>
    </IOSLayout>
  );
};

export default IOSDemo;