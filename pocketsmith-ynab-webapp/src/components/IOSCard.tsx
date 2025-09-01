import React, { ReactNode } from 'react';
import { Card, CardContent, CardActions, Box, useTheme } from '@mui/material';

interface IOSCardProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
}

export const IOSCard = ({
  children,
  actions,
  className = '',
  onClick,
  elevated = false
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      className={`ios-card ${isDark ? 'dark' : ''} ${className}`}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        '&:active': onClick ? {
          transform: 'scale(0.98)',
          opacity: 0.8,
        } : {},
        boxShadow: elevated 
          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ 
        padding: '16px',
        '&:last-child': { paddingBottom: '16px' }
      }}>
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ 
          padding: '8px 16px 16px 16px',
          justifyContent: 'flex-end'
        }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default IOSCard;