import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Error as ErrorIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';

interface IOSFormErrorProps {
  message: string;
  visible?: boolean;
}

export const IOSFormError: React.FC<IOSFormErrorProps> = ({ 
  message, 
  visible = true 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!visible) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: 1,
        px: 2,
        py: 1,
        backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
        borderRadius: 2,
        border: `1px solid ${isDark ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.2)'}`,
      }}
    >
      <ErrorIcon 
        sx={{ 
          fontSize: 16, 
          color: isDark ? '#FF453A' : '#FF3B30' 
        }} 
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: '13px',
          fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          color: isDark ? '#FF453A' : '#FF3B30',
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

interface IOSFormSuccessProps {
  message: string;
  visible?: boolean;
}

export const IOSFormSuccess: React.FC<IOSFormSuccessProps> = ({ 
  message, 
  visible = true 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!visible) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mt: 1,
        px: 2,
        py: 1,
        backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
        borderRadius: 2,
        border: `1px solid ${isDark ? 'rgba(52, 199, 89, 0.3)' : 'rgba(52, 199, 89, 0.2)'}`,
      }}
    >
      <SuccessIcon 
        sx={{ 
          fontSize: 16, 
          color: isDark ? '#30D158' : '#34C759' 
        }} 
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: '13px',
          fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          color: isDark ? '#30D158' : '#34C759',
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

interface IOSFormFieldProps {
  children: React.ReactNode;
  error?: string;
  success?: string;
  required?: boolean;
}

export const IOSFormField: React.FC<IOSFormFieldProps> = ({
  children,
  error,
  success,
  required = false,
}) => {
  return (
    <Box>
      {children}
      {error && <IOSFormError message={error} />}
      {!error && success && <IOSFormSuccess message={success} />}
    </Box>
  );
};

export default IOSFormField;