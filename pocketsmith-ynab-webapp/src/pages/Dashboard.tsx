import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

export const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to your PocketSmith-YNAB Sync Manager dashboard.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sync Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor your synchronization operations and view recent activity.
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Mappings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure how your PocketSmith accounts map to YNAB accounts.
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Balance Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compare account balances between PocketSmith and YNAB.
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Manual Sync
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trigger manual synchronization operations when needed.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};