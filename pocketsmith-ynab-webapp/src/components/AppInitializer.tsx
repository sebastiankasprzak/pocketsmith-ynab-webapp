import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { authService } from '../services/authService';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const initializeApp = async () => {
    try {
      setInitError(null);
      
      // Ensure auth service is properly initialized
      if (authService.isAuthEnabled()) {
        // Pre-warm the auth session to avoid race conditions
        await authService.isAuthenticated();
      }
      
      // Add a small delay to ensure all services are ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
    }
  };

  useEffect(() => {
    initializeApp();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsInitialized(false);
  };

  if (initError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          p: 3,
          bgcolor: 'background.default'
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Application Error
          </Typography>
          <Typography variant="body2" paragraph>
            {initError}
          </Typography>
          <Button variant="contained" onClick={handleRetry} size="small">
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Initializing application...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;