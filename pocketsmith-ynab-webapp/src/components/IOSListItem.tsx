import React, { ReactNode, useState, useRef } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { ChevronRight, Delete, Edit } from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  backgroundColor: string;
  onAction: () => void;
}

interface IOSListItemProps {
  children: ReactNode;
  onClick?: () => void;
  showDisclosure?: boolean;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightContent?: ReactNode;
  swipeActions?: SwipeAction[];
  className?: string;
  disabled?: boolean;
  divider?: boolean;
}

/**
 * IOSListItem component with disclosure indicators and swipe actions
 * Provides iOS-style list item with native interactions
 */
export const IOSListItem = ({
  children,
  onClick,
  showDisclosure = false,
  subtitle,
  leftIcon,
  rightContent,
  swipeActions = [],
  className = '',
  disabled = false,
  divider = true
}: IOSListItemProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { impact } = useHapticFeedback();
  
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || swipeActions.length === 0) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || swipeActions.length === 0) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - currentX;
    const deltaY = Math.abs(touchStartY.current - currentY);

    // Only start swiping if horizontal movement is greater than vertical
    if (!isDragging.current && Math.abs(deltaX) > 10 && deltaY < 30) {
      isDragging.current = true;
      impact('light');
    }

    if (isDragging.current && deltaX > 0) {
      const maxSwipe = swipeActions.length * 80; // 80px per action
      const newOffset = Math.min(deltaX, maxSwipe);
      setSwipeOffset(newOffset);
      
      if (newOffset > 60 && !showActions) {
        setShowActions(true);
        impact('medium');
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    isDragging.current = false;
    
    if (swipeOffset > 60) {
      // Keep actions visible
      setSwipeOffset(swipeActions.length * 80);
    } else {
      // Hide actions
      setSwipeOffset(0);
      setShowActions(false);
    }
  };

  const handleClick = () => {
    if (disabled || isDragging.current || swipeOffset > 0) return;
    
    impact('light');
    onClick?.();
  };

  const handleActionClick = (action: SwipeAction) => {
    impact('medium');
    action.onAction();
    setSwipeOffset(0);
    setShowActions(false);
  };

  const handleMouseDown = () => {
    if (!disabled && onClick) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Swipe Actions Background */}
      {swipeActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          {swipeActions.map((action, index) => (
            <IconButton
              key={index}
              onClick={() => handleActionClick(action)}
              sx={{
                width: 80,
                height: '100%',
                borderRadius: 0,
                backgroundColor: action.backgroundColor,
                color: action.color,
                '&:hover': {
                  backgroundColor: action.backgroundColor,
                  opacity: 0.8,
                },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {action.icon}
              <Typography variant="caption" sx={{ fontSize: '10px' }}>
                {action.label}
              </Typography>
            </IconButton>
          ))}
        </Box>
      )}

      {/* Main List Item */}
      <Box
        className={`ios-list-item ${isDark ? 'dark' : ''} ${className}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          minHeight: 44,
          padding: '12px 16px',
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          transform: `translateX(-${swipeOffset}px) ${isPressed ? 'scale(0.98)' : 'scale(1)'}`,
          opacity: disabled ? 0.5 : (isPressed ? 0.8 : 1),
          ...(divider && {
            borderBottom: `0.5px solid ${
              isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)'
            }`,
          }),
          '&:active': onClick && !disabled ? {
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.05)',
          } : {},
        }}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Box
            sx={{
              marginRight: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 24,
            }}
          >
            {leftIcon}
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {typeof children === 'string' ? (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: isDark ? '#FFFFFF' : '#000000',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {children}
              </Typography>
            ) : (
              children
            )}
          </Box>
          
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '15px',
                fontWeight: 400,
                color: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
                marginTop: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Right Content */}
        {rightContent && (
          <Box
            sx={{
              marginLeft: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightContent}
          </Box>
        )}

        {/* Disclosure Indicator */}
        {showDisclosure && (
          <ChevronRight
            sx={{
              marginLeft: 1,
              color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
              fontSize: '20px',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

// Predefined swipe actions for common use cases
export const createDeleteAction = (onDelete: () => void): SwipeAction => ({
  icon: <Delete sx={{ fontSize: '20px' }} />,
  label: 'Delete',
  color: '#FFFFFF',
  backgroundColor: '#FF3B30',
  onAction: onDelete,
});

export const createEditAction = (onEdit: () => void): SwipeAction => ({
  icon: <Edit sx={{ fontSize: '20px' }} />,
  label: 'Edit',
  color: '#FFFFFF',
  backgroundColor: '#007AFF',
  onAction: onEdit,
});

export default IOSListItem;