import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
  Slide,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface IOSActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: IOSActionSheetAction[];
  cancelLabel?: string;
}

const SlideUpTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const IOSActionSheet = ({
  open,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel'
}: IOSActionSheetProps) => {
  const theme = useTheme();
  const { selection } = useHapticFeedback();
  const isDark = theme.palette.mode === 'dark';

  const handleActionPress = (action: IOSActionSheetAction) => {
    selection();
    action.onPress();
    onClose();
  };

  const handleCancel = () => {
    selection();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={SlideUpTransition}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
        },
        '& .MuiDialog-paper': {
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          borderRadius: '16px 16px 0 0',
          backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        {(title || message) && (
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            {title && (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isDark ? '#EBEBF5' : '#8E8E93',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>
            )}
            {message && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: title ? 1 : 0,
                  fontSize: '13px',
                  color: isDark ? '#EBEBF5' : '#8E8E93',
                  lineHeight: 1.4
                }}
              >
                {message}
              </Typography>
            )}
          </Box>
        )}

        {/* Actions */}
        <List sx={{ p: 0 }}>
          {actions.map((action, index) => (
            <ListItem
              key={index}
              sx={{
                p: 0,
                borderBottom: index < actions.length - 1 ? `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
              }}
            >
              <Button
                fullWidth
                onClick={() => handleActionPress(action)}
                disabled={action.disabled}
                sx={{
                  minHeight: 56,
                  borderRadius: 0,
                  fontSize: '20px',
                  fontWeight: action.destructive ? 600 : 400,
                  color: action.destructive 
                    ? '#FF3B30' 
                    : action.disabled 
                      ? (isDark ? '#48484A' : '#C7C7CC')
                      : '#007AFF',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  },
                  '&:active': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  },
                }}
              >
                {action.label}
              </Button>
            </ListItem>
          ))}
        </List>

        {/* Cancel Button */}
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            onClick={handleCancel}
            sx={{
              minHeight: 56,
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#007AFF',
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              '&:hover': {
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
              },
              '&:active': {
                backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
              },
            }}
          >
            {cancelLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default IOSActionSheet;