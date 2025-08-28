import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);

  // Add a minimum loading time to prevent flash of login form
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 300); // Small delay to ensure smooth loading

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show loading spinner while checking authentication or during initial load
  if (loading || initialLoad) {
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
          {loading ? 'Checking authentication...' : 'Loading application...'}
        </Typography>
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;