import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export const SimpleIOSTest = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
  const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
  
  return (
    <Box sx={{ 
      p: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        PWA Fullscreen Test
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Detection
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            iOS Detected: <strong>{isIOS ? 'YES' : 'NO'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            PWA Mode: <strong>{isStandalone ? 'YES (Standalone)' : 'NO (Browser)'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Safe Area Top: <strong>{safeAreaTop || 'Not detected'}</strong>
          </Typography>
          <Typography variant="body2">
            Safe Area Bottom: <strong>{safeAreaBottom || 'Not detected'}</strong>
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fullscreen Status
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Window Height: <strong>{window.innerHeight}px</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Screen Height: <strong>{window.screen.height}px</strong>
          </Typography>
          <Typography variant="body2">
            Viewport Height: <strong>{window.visualViewport?.height || 'Not available'}px</strong>
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expected Behavior
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • In PWA mode, the status bar area should match your theme color
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • No blue bar should be visible at the top
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Content should extend to the edges (respecting safe areas)
          </Typography>
          <Typography variant="body2">
            • Tab bar should be properly positioned at the bottom
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        backgroundColor: 'primary.main', 
        color: 'primary.contrastText',
        borderRadius: 1
      }}>
        <Typography variant="body2" align="center">
          {isStandalone && isIOS 
            ? '✅ PWA fullscreen should be working!' 
            : '⚠️ Add to Home Screen to test PWA mode'
          }
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleIOSTest;