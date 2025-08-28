import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';

interface DebugInfo {
  environment: {
    NODE_ENV: string;
    VITE_ENVIRONMENT: string;
    VITE_USE_MOCK_API: string;
    VITE_API_BASE_URL: string;
    VITE_COGNITO_USER_POOL_ID: string;
    VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  };
  auth: {
    isEnabled: boolean;
    isAuthenticated: boolean | null;
    user: any;
    error: string | null;
  };
  api: {
    healthCheck: {
      status: number | null;
      response: any;
      error: string | null;
    };
    balanceCheck: {
      status: number | null;
      response: any;
      error: string | null;
    };
  };
}

export const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'unknown',
      VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API || 'undefined',
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'undefined',
      VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'undefined',
      VITE_COGNITO_USER_POOL_CLIENT_ID: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || 'undefined'
    },
    auth: {
      isEnabled: false,
      isAuthenticated: null,
      user: null,
      error: null
    },
    api: {
      healthCheck: {
        status: null,
        response: null,
        error: null
      },
      balanceCheck: {
        status: null,
        response: null,
        error: null
      }
    }
  });

  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    
    const newDebugInfo = { ...debugInfo };

    // Test authentication
    try {
      newDebugInfo.auth.isEnabled = authService.isAuthEnabled();
      if (newDebugInfo.auth.isEnabled) {
        newDebugInfo.auth.isAuthenticated = await authService.isAuthenticated();
        if (newDebugInfo.auth.isAuthenticated) {
          newDebugInfo.auth.user = await authService.getCurrentUser();
        }
      } else {
        newDebugInfo.auth.isAuthenticated = true; // Mock API doesn't require auth
      }
    } catch (error) {
      newDebugInfo.auth.error = error instanceof Error ? error.message : String(error);
    }

    // Test API endpoints
    try {
      const healthResponse = await apiClient.get('/health');
      newDebugInfo.api.healthCheck.status = healthResponse.status;
      newDebugInfo.api.healthCheck.response = healthResponse.data;
    } catch (error: any) {
      newDebugInfo.api.healthCheck.error = error.message;
      newDebugInfo.api.healthCheck.status = error.statusCode || 0;
    }

    try {
      const balanceResponse = await apiClient.get('/balances/compare');
      newDebugInfo.api.balanceCheck.status = balanceResponse.status;
      newDebugInfo.api.balanceCheck.response = balanceResponse.data;
    } catch (error: any) {
      newDebugInfo.api.balanceCheck.error = error.message;
      newDebugInfo.api.balanceCheck.status = error.statusCode || 0;
    }

    setDebugInfo(newDebugInfo);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: number | null) => {
    if (status === null) return 'default';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    return 'error';
  };

  const getStatusText = (status: number | null) => {
    if (status === null) return 'Not tested';
    return `${status}`;
  };

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BugReportIcon color="warning" />
          <Typography variant="h6" color="warning.main">
            Debug Panel - Balance Comparison Troubleshooting
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          This debug panel helps identify issues with the balance comparison page. 
          It will be removed once the issue is resolved.
        </Alert>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={runDiagnostics}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <ApiIcon />}
          >
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        </Stack>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Environment Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {Object.entries(debugInfo.environment).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontFamily="monospace">{key}:</Typography>
                  <Chip 
                    label={value} 
                    size="small" 
                    color={value === 'undefined' ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              <Typography variant="subtitle1">Authentication Status</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Auth Enabled:</Typography>
                <Chip 
                  label={debugInfo.auth.isEnabled ? 'Yes' : 'No'} 
                  size="small" 
                  color={debugInfo.auth.isEnabled ? 'success' : 'warning'}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Is Authenticated:</Typography>
                <Chip 
                  label={debugInfo.auth.isAuthenticated === null ? 'Unknown' : (debugInfo.auth.isAuthenticated ? 'Yes' : 'No')} 
                  size="small" 
                  color={debugInfo.auth.isAuthenticated ? 'success' : 'error'}
                />
              </Box>
              {debugInfo.auth.user && (
                <Box>
                  <Typography variant="body2" gutterBottom>User Info:</Typography>
                  <Box component="pre" sx={{ fontSize: '0.75rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {JSON.stringify(debugInfo.auth.user, null, 2)}
                  </Box>
                </Box>
              )}
              {debugInfo.auth.error && (
                <Alert severity="error">
                  <Typography variant="body2">{debugInfo.auth.error}</Typography>
                </Alert>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApiIcon />
              <Typography variant="subtitle1">API Endpoint Tests</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Health Check (/health):</Typography>
                  <Chip 
                    label={getStatusText(debugInfo.api.healthCheck.status)} 
                    size="small" 
                    color={getStatusColor(debugInfo.api.healthCheck.status)}
                  />
                </Box>
                {debugInfo.api.healthCheck.response && (
                  <Box component="pre" sx={{ fontSize: '0.75rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {JSON.stringify(debugInfo.api.healthCheck.response, null, 2)}
                  </Box>
                )}
                {debugInfo.api.healthCheck.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2">{debugInfo.api.healthCheck.error}</Typography>
                  </Alert>
                )}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Balance Comparison (/balances/compare):</Typography>
                  <Chip 
                    label={getStatusText(debugInfo.api.balanceCheck.status)} 
                    size="small" 
                    color={getStatusColor(debugInfo.api.balanceCheck.status)}
                  />
                </Box>
                {debugInfo.api.balanceCheck.response && (
                  <Box component="pre" sx={{ fontSize: '0.75rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {JSON.stringify(debugInfo.api.balanceCheck.response, null, 2)}
                  </Box>
                )}
                {debugInfo.api.balanceCheck.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2">{debugInfo.api.balanceCheck.error}</Typography>
                  </Alert>
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Expected behavior:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Health check should return 200 OK<br/>
            • Balance comparison should return 401 (if not authenticated) or 200 (if authenticated)<br/>
            • If using mock API, both should return 200 OK
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};