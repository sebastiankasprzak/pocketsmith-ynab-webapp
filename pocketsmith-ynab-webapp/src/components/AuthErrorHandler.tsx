import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Snackbar } from '@mui/material';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ children }) => {
  const { signOut } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = React.useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowSessionExpired(true);
      // Auto sign out after showing the message
      setTimeout(() => {
        signOut().catch(console.error);
      }, 3000);
    };

    // Listen for session expiration events from the API client
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [signOut]);

  const handleCloseSnackbar = () => {
    setShowSessionExpired(false);
  };

  return (
    <>
      {children}
      <Snackbar
        open={showSessionExpired}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="warning" 
          sx={{ width: '100%' }}
        >
          Your session has expired. You will be signed out automatically.
        </Alert>
      </Snackbar>
    </>
  );
};

export default AuthErrorHandler;