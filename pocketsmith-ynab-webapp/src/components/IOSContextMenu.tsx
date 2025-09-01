import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Box, Portal, Backdrop, Typography } from '@mui/material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface IOSContextMenuAction {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onAction: () => void;
}

interface IOSContextMenuProps {
  children: ReactNode;
  actions: IOSContextMenuAction[];
  disabled?: boolean;
}

export const IOSContextMenu = ({ children, actions, disabled = false }: IOSContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    
    if (rect) {
      setPosition({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }

    const timer = setTimeout(() => {
      triggerHaptic('medium');
      setIsOpen(true);
    }, 500); // 500ms long press

    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    
    if (rect) {
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    const timer = setTimeout(() => {
      triggerHaptic('medium');
      setIsOpen(true);
    }, 500);

    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleActionClick = (action: IOSContextMenuAction) => {
    if (action.disabled) return;
    
    triggerHaptic('light');
    action.onAction();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <>
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: disabled ? 'default' : 'pointer'
        }}
      >
        {children}
      </Box>

      {isOpen && (
        <Portal>
          <Backdrop
            open={isOpen}
            onClick={handleClose}
            sx={{
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                minWidth: '200px',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                animation: 'contextMenuAppear 0.2s ease-out',
                '@keyframes contextMenuAppear': {
                  '0%': {
                    opacity: 0,
                    transform: 'translate(-50%, -50%) scale(0.8)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translate(-50%, -50%) scale(1)'
                  }
                }
              }}
            >
              {actions.map((action, index) => (
                <Box
                  key={index}
                  onClick={() => handleActionClick(action)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 3,
                    py: 2,
                    cursor: action.disabled ? 'default' : 'pointer',
                    opacity: action.disabled ? 0.5 : 1,
                    backgroundColor: 'transparent',
                    borderBottom: index < actions.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                    '&:hover': action.disabled ? {} : {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    },
                    '&:active': action.disabled ? {} : {
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {action.icon && (
                    <Box sx={{ 
                      color: action.destructive ? 'error.main' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {action.icon}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: action.destructive ? 'error.main' : 'text.primary',
                      fontWeight: 500
                    }}
                  >
                    {action.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Backdrop>
        </Portal>
      )}
    </>
  );
};

export default IOSContextMenu;