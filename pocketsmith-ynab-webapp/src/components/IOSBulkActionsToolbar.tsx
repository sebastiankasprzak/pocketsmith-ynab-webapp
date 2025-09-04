import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { IOSButton } from './IOSButton';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onAction: () => void;
}

interface IOSBulkActionsToolbarProps {
  selectedCount: number;
  actions: BulkAction[];
  onCancel: () => void;
  visible: boolean;
}

/**
 * iOS-style bulk actions toolbar that appears when items are selected
 */
export const IOSBulkActionsToolbar: React.FC<IOSBulkActionsToolbarProps> = ({
  selectedCount,
  actions,
  onCancel,
  visible
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: isDark 
          ? 'rgba(28, 28, 30, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${
          isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)'
        }`,
        padding: 2,
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
        animation: visible ? 'slideUp 0.3s ease-out' : undefined,
        '@keyframes slideUp': {
          '0%': {
            transform: 'translateY(100%)'
          },
          '100%': {
            transform: 'translateY(0)'
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: isDark ? '#FFFFFF' : '#000000'
          }}
        >
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </Typography>
        
        <IOSButton
          variant="plain"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </IOSButton>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        {actions.map((action, index) => (
          <IOSButton
            key={index}
            variant={action.destructive ? 'destructive' : 'secondary'}
            size="medium"
            onClick={action.onAction}
            disabled={action.disabled}
            startIcon={action.icon}
            sx={{
              flex: actions.length <= 2 ? 1 : undefined,
              minWidth: actions.length > 2 ? '120px' : undefined
            }}
          >
            {action.label}
          </IOSButton>
        ))}
      </Box>
    </Box>
  );
};

export default IOSBulkActionsToolbar;