import React, { ReactNode } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface IOSSectionProps {
  title?: string;
  children: ReactNode;
  grouped?: boolean;
  className?: string;
  headerAction?: ReactNode;
  footer?: string;
}

/**
 * IOSSection component for grouped content layout
 * Provides iOS-style section grouping with optional headers and footers
 */
export const IOSSection = ({
  title,
  children,
  grouped = true,
  className = '',
  headerAction,
  footer
}: IOSSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      className={`ios-section ${isDark ? 'dark' : ''} ${className}`}
      sx={{
        marginBottom: grouped ? 3 : 2.5,
      }}
    >
      {/* Section Header */}
      {title && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingX: 2,
            paddingY: 1,
            marginBottom: grouped ? 0.5 : 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '13px',
              fontWeight: 400,
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          {headerAction && (
            <Box sx={{ marginLeft: 'auto' }}>
              {headerAction}
            </Box>
          )}
        </Box>
      )}

      {/* Section Content */}
      <Box
        sx={{
          backgroundColor: grouped 
            ? (isDark ? '#1C1C1E' : '#FFFFFF')
            : 'transparent',
          borderRadius: grouped ? '12px' : 0,
          marginX: grouped ? 2 : 0,
          overflow: 'hidden',
          ...(grouped && {
            border: isDark 
              ? '1px solid rgba(84, 84, 88, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
          }),
        }}
      >
        {children}
      </Box>

      {/* Section Footer */}
      {footer && (
        <Box
          sx={{
            paddingX: 2,
            paddingTop: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '13px',
              fontWeight: 400,
              color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
              lineHeight: 1.4,
            }}
          >
            {footer}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IOSSection;