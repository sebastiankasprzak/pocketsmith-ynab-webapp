import React from 'react';
import { Box, Typography } from '@mui/material';

export const SimpleIOSTest = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh', 
      backgroundColor: isIOS ? '#007AFF' : '#f5f5f5',
      color: isIOS ? 'white' : 'black'
    }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        iOS Test Page
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        iOS Detected: {isIOS ? 'YES' : 'NO'}
      </Typography>
      <Typography variant="body2">
        User Agent: {navigator.userAgent}
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        If you see this page with a blue background, iOS detection is working!
      </Typography>
    </Box>
  );
};

export default SimpleIOSTest;