import React, { ReactNode, useState, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, IconButton, useTheme, Checkbox, Portal, Backdrop } from '@mui/material';
import { ChevronRight, Delete, Edit, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import './IOSListItem.css';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  backgroundColor: string;
  onAction: () => void;
}

interface IOSContextMenuAction {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
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
  contextMenuActions?: IOSContextMenuAction[];
  className?: string;
  disabled?: boolean;
  divider?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
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
  contextMenuActions = [],
  className = '',
  disabled = false,
  divider = true,
  selectable = false,
  selected = false,
  onSelectionChange
}: IOSListItemProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { impact } = useHapticFeedback();
  
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const animationFrameRef = useRef<number>();
  const lastHapticTrigger = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const currentOffset = useRef(0);

  // Optimized touch handlers with RAF and throttling
  const updateSwipeOffset = useCallback((offset: number, animate = false) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    currentOffset.current = offset;
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (itemRef.current) {
        // Use CSS custom property for better performance
        itemRef.current.style.setProperty('--swipe-offset', `${offset}px`);
        
        // Add/remove animation class for smooth transitions
        if (animate) {
          itemRef.current.classList.add('snapping');
          setIsAnimating(true);
          // Remove animation class after transition
          setTimeout(() => {
            if (itemRef.current) {
              itemRef.current.classList.remove('snapping');
            }
            setIsAnimating(false);
          }, 300);
        } else {
          itemRef.current.classList.add('swiping');
        }
      }
      setSwipeOffset(offset);
    });
  }, []);

  const triggerHapticThrottled = useCallback((type: 'light' | 'medium') => {
    const now = Date.now();
    if (now - lastHapticTrigger.current > 100) { // Throttle haptic feedback
      lastHapticTrigger.current = now;
      // Use setTimeout to avoid blocking the main thread
      setTimeout(() => impact(type), 0);
    }
  }, [impact]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = false;

    // Set up context menu position
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }

    // Start long press timer for context menu (only if not in selection mode)
    if (contextMenuActions.length > 0 && !selectable) {
      const timer = setTimeout(() => {
        triggerHapticThrottled('medium');
        setShowContextMenu(true);
      }, 500); // 500ms long press
      setLongPressTimer(timer);
    }
  }, [disabled, contextMenuActions.length, triggerHapticThrottled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - currentX;
    const deltaY = Math.abs(touchStartY.current - currentY);

    // Cancel long press if user moves too much
    if (longPressTimer && (Math.abs(deltaX) > 10 || deltaY > 10)) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Only start swiping if horizontal movement is greater than vertical and we have swipe actions
    if (swipeActions.length > 0 && !isDragging.current && Math.abs(deltaX) > 10 && deltaY < 30) {
      isDragging.current = true;
      triggerHapticThrottled('light');
    }

    if (isDragging.current && deltaX > 0 && swipeActions.length > 0) {
      const maxSwipe = swipeActions.length * 80; // 80px per action
      const newOffset = Math.min(deltaX, maxSwipe);
      
      // Use RAF for smooth updates
      updateSwipeOffset(newOffset);
      
      if (newOffset > 60 && !showActions) {
        setShowActions(true);
        triggerHapticThrottled('medium');
      }
    }
  }, [disabled, swipeActions.length, showActions, updateSwipeOffset, triggerHapticThrottled, longPressTimer]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    isDragging.current = false;
    
    // Remove swiping class
    if (itemRef.current) {
      itemRef.current.classList.remove('swiping');
    }
    
    if (currentOffset.current > 60 && swipeActions.length > 0) {
      // Keep actions visible with smooth animation
      const targetOffset = swipeActions.length * 80;
      updateSwipeOffset(targetOffset, true);
    } else {
      // Hide actions with smooth animation
      updateSwipeOffset(0, true);
      setShowActions(false);
    }
  }, [disabled, swipeActions.length, updateSwipeOffset, longPressTimer]);

  const handleClick = useCallback(() => {
    if (disabled || isDragging.current || swipeOffset > 0) return;
    
    triggerHapticThrottled('light');
    
    // Handle selection mode
    if (selectable && onSelectionChange) {
      onSelectionChange(!selected);
    } else {
      onClick?.();
    }
  }, [disabled, swipeOffset, onClick, triggerHapticThrottled, selectable, selected, onSelectionChange]);

  const handleActionClick = useCallback((action: SwipeAction) => {
    triggerHapticThrottled('medium');
    action.onAction();
    updateSwipeOffset(0, true);
    setShowActions(false);
  }, [triggerHapticThrottled, updateSwipeOffset]);

  const handleContextMenuActionClick = useCallback((action: IOSContextMenuAction) => {
    if (action.disabled) return;
    
    triggerHapticThrottled('light');
    action.onAction();
    setShowContextMenu(false);
  }, [triggerHapticThrottled]);

  const handleContextMenuClose = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    if (onClick || selectable) {
      setIsPressed(true);
    }

    // Set up context menu position for mouse events
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    // Start long press timer for context menu (only if not in selection mode)
    if (contextMenuActions.length > 0 && !selectable) {
      const timer = setTimeout(() => {
        triggerHapticThrottled('medium');
        setShowContextMenu(true);
      }, 500);
      setLongPressTimer(timer);
    }
  }, [disabled, onClick, selectable, contextMenuActions.length, triggerHapticThrottled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Memoize styles for better performance
  const containerStyles = useMemo(() => ({
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }), []);

  const mainItemStyles = useMemo(() => ({
    position: 'relative' as const,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    minHeight: 44,
    padding: '12px 16px',
    backgroundColor: selected 
      ? (isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(10, 132, 255, 0.1)')
      : (isDark ? '#1C1C1E' : '#FFFFFF'),
    cursor: (onClick || selectable) && !disabled ? 'pointer' : 'default',
    // Optimized transitions - only animate what's necessary
    transition: isAnimating 
      ? 'opacity 0.2s ease, background-color 0.2s ease' 
      : 'opacity 0.2s ease, background-color 0.2s ease',
    // Use CSS custom property for transform (set via CSS)
    opacity: disabled ? 0.5 : (isPressed ? 0.8 : 1),
    // Scale transform for press effect
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    ...(divider && {
      borderBottom: `0.5px solid ${
        isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)'
      }`,
    }),
    '&:active': (onClick || selectable) && !disabled ? {
      backgroundColor: selected
        ? (isDark ? 'rgba(10, 132, 255, 0.25)' : 'rgba(10, 132, 255, 0.2)')
        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
    } : {},
  }), [isDark, onClick, selectable, disabled, isPressed, divider, isAnimating, selected]);

  // Cleanup animation frame and timers on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <Box sx={containerStyles}>
      {/* Swipe Actions Background */}
      {swipeActions.length > 0 && (
        <Box
          className="ios-list-item-actions"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
            // Performance optimizations
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
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
                // Performance optimizations for action buttons
                willChange: 'opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
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
        ref={itemRef}
        className={`ios-list-item ${isDark ? 'dark' : ''} ${className}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={mainItemStyles}
      >
        {/* Selection Checkbox */}
        {selectable && (
          <Box
            sx={{
              marginRight: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 24,
            }}
          >
            {selected ? (
              <CheckCircle 
                sx={{ 
                  color: '#007AFF',
                  fontSize: '24px'
                }} 
              />
            ) : (
              <RadioButtonUnchecked 
                sx={{ 
                  color: isDark ? 'rgba(235, 235, 245, 0.3)' : 'rgba(60, 60, 67, 0.3)',
                  fontSize: '24px'
                }} 
              />
            )}
          </Box>
        )}

        {/* Left Icon */}
        {leftIcon && !selectable && (
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

      {/* Context Menu */}
      {showContextMenu && contextMenuActions.length > 0 && !selectable && (
        <Portal>
          <Backdrop
            open={showContextMenu}
            onClick={handleContextMenuClose}
            sx={{
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: 'absolute',
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
                transform: 'translate(-50%, -50%)',
                backgroundColor: isDark 
                  ? 'rgba(44, 44, 46, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
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
              {contextMenuActions.map((action, index) => (
                <Box
                  key={index}
                  onClick={() => handleContextMenuActionClick(action)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 3,
                    py: 2,
                    cursor: action.disabled ? 'default' : 'pointer',
                    opacity: action.disabled ? 0.5 : 1,
                    backgroundColor: 'transparent',
                    borderBottom: index < contextMenuActions.length - 1 
                      ? `1px solid ${isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(0, 0, 0, 0.1)'}` 
                      : 'none',
                    '&:hover': action.disabled ? {} : {
                      backgroundColor: isDark 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.05)'
                    },
                    '&:active': action.disabled ? {} : {
                      backgroundColor: isDark 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {action.icon && (
                    <Box sx={{ 
                      color: action.destructive 
                        ? '#FF3B30' 
                        : (isDark ? '#FFFFFF' : '#000000'),
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {action.icon}
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: action.destructive 
                        ? '#FF3B30' 
                        : (isDark ? '#FFFFFF' : '#000000'),
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

// Context menu action helpers
export const createContextEditAction = (onEdit: () => void): IOSContextMenuAction => ({
  label: 'Edit Mapping',
  icon: <Edit sx={{ fontSize: '18px' }} />,
  onAction: onEdit,
});

export const createContextDeleteAction = (onDelete: () => void): IOSContextMenuAction => ({
  label: 'Delete Mapping',
  icon: <Delete sx={{ fontSize: '18px' }} />,
  destructive: true,
  onAction: onDelete,
});

export const createContextDuplicateAction = (onDuplicate: () => void): IOSContextMenuAction => ({
  label: 'Duplicate Mapping',
  icon: <Edit sx={{ fontSize: '18px' }} />,
  onAction: onDuplicate,
});

export default IOSListItem;