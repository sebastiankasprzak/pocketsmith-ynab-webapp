import React from 'react';
import { Box, Typography } from '@mui/material';

export const IOSDebug = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const userAgent = navigator.userAgent;
  
  return (
    <Box sx={{ p: 2, backgroundColor: 'background.paper', m: 2, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        iOS Debug Info
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>iOS Detected:</strong> {isIOS ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>User Agent:</strong> {userAgent}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Window Width:</strong> {window.innerWidth}px
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Window Height:</strong> {window.innerHeight}px
      </Typography>
      <Typography variant="body2">
        <strong>Viewport:</strong> {window.innerWidth} x {window.innerHeight}
      </Typography>
    </Box>
  );
};

export default IOSDebug;