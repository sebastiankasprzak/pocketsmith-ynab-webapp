import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { useIOSDetection, useHapticFeedback } from '../hooks/useIOSDetection';

/**
 * Demo component to showcase the enhanced iOS detection capabilities
 */
export const IOSDetectionDemo: React.FC = () => {
  try {
    const { capabilities, shouldUseIOSExperience, deviceClass } = useIOSDetection();
    const { supportsHaptics, triggerFeedback } = useHapticFeedback();

  const handleHapticTest = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification') => {
    triggerFeedback(type);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Enhanced iOS Detection Demo
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Capabilities
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`iOS: ${capabilities.isIOS ? 'Yes' : 'No'}`}
              color={capabilities.isIOS ? 'success' : 'default'}
            />
            <Chip 
              label={`iPad: ${capabilities.isIPad ? 'Yes' : 'No'}`}
              color={capabilities.isIPad ? 'success' : 'default'}
            />
            <Chip 
              label={`Notch: ${capabilities.hasNotch ? 'Yes' : 'No'}`}
              color={capabilities.hasNotch ? 'warning' : 'default'}
            />
            <Chip 
              label={`Dynamic Island: ${capabilities.hasDynamicIsland ? 'Yes' : 'No'}`}
              color={capabilities.hasDynamicIsland ? 'secondary' : 'default'}
            />
            <Chip 
              label={`Haptics: ${capabilities.supportsHaptics ? 'Yes' : 'No'}`}
              color={capabilities.supportsHaptics ? 'success' : 'default'}
            />
            <Chip 
              label={`Standalone: ${capabilities.supportsStandalone ? 'Yes' : 'No'}`}
              color={capabilities.supportsStandalone ? 'info' : 'default'}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            iOS Version: {capabilities.version || 'Unknown'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Device Class: {deviceClass}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Should Use iOS Experience: {shouldUseIOSExperience ? 'Yes' : 'No'}
          </Typography>
        </CardContent>
      </Card>

      {supportsHaptics && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Haptic Feedback Test
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Test different haptic feedback patterns (iOS only):
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('light')}
              >
                Light
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('medium')}
              >
                Medium
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('heavy')}
              >
                Heavy
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('selection')}
              >
                Selection
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('impact')}
              >
                Impact
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleHapticTest('notification')}
              >
                Notification
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Technical Details
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            fontSize: '0.75rem', 
            backgroundColor: 'grey.100',
            p: 1,
            borderRadius: 1,
            overflow: 'auto'
          }}>
            {JSON.stringify({
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              maxTouchPoints: navigator.maxTouchPoints,
              screenDimensions: {
                width: window.screen.width,
                height: window.screen.height,
                pixelRatio: window.devicePixelRatio
              },
              capabilities
            }, null, 2)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
  } catch (error) {
    console.error('IOSDetectionDemo error:', error);
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" color="error">
          Error in iOS Detection Demo
        </Typography>
        <Typography variant="body2">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Check the browser console for more details.
        </Typography>
      </Box>
    );
  }
};

export default IOSDetectionDemo;