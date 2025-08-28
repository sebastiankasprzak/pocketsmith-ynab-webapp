import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Typography,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Security,
  Warning,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { getErrorMessage, isAuthError } from '../hooks/useAuthErrorHandler';
import type { ApiError } from '../services/apiClient';

interface ApiErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  showDetails?: boolean;
  variant?: 'standard' | 'compact';
}

export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  onRetry,
  showDetails = false,
  variant = 'standard'
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) {
    return null;
  }

  const isAuth = isAuthError(error);
  const message = getErrorMessage(error);
  
  const getSeverity = () => {
    if (isAuth) return 'warning';
    if (error?.statusCode >= 500) return 'error';
    if (error?.statusCode >= 400) return 'warning';
    return 'info';
  };

  const getIcon = () => {
    if (isAuth) return <Security />;
    if (error?.statusCode >= 500) return <ErrorIcon />;
    if (error?.statusCode >= 400) return <Warning />;
    return <Info />;
  };

  const getTitle = () => {
    if (isAuth) return 'Authentication Error';
    if (error?.statusCode >= 500) return 'Server Error';
    if (error?.statusCode >= 400) return 'Request Error';
    return 'Information';
  };

  if (variant === 'compact') {
    return (
      <Alert 
        severity={getSeverity()} 
        icon={getIcon()}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    );
  }

  return (
    <Alert 
      severity={getSeverity()}
      icon={getIcon()}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showDetails && error?.details && (
            <IconButton
              aria-label="toggle error details"
              color="inherit"
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          )}
        </Box>
      }
    >
      <AlertTitle>{getTitle()}</AlertTitle>
      {message}
      
      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              <strong>Error Code:</strong> {error?.code || 'UNKNOWN'}
            </Typography>
            {error?.statusCode && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                <strong>Status Code:</strong> {error.statusCode}
              </Typography>
            )}
            {error?.timestamp && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                <strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}
              </Typography>
            )}
            {error?.details && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Details:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.75rem'
                  }}
                >
                  {typeof error.details === 'string' 
                    ? error.details 
                    : JSON.stringify(error.details, null, 2)
                  }
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

export default ApiErrorDisplay;