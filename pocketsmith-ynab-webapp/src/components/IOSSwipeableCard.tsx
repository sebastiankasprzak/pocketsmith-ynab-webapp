import React, { ReactNode, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface IOSSwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const IOSSwipeableCard = ({
  children,
  leftActions = [],
  rightActions = [
    {
      icon: <DeleteIcon />,
      label: 'Delete',
      color: 'white',
      backgroundColor: '#FF3B30',
      onPress: () => console.log('Delete pressed')
    }
  ],
  onSwipeLeft,
  onSwipeRight
}: IOSSwipeableCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { impact } = useHapticFeedback();

  const resetPosition = () => {
    setIsAnimating(true);
    setSwipeOffset(0);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSwipeLeft = () => {
    impact('light');
    if (rightActions.length > 0) {
      setSwipeOffset(-120);
    }
    onSwipeLeft?.();
  };

  const handleSwipeRight = () => {
    impact('light');
    if (leftActions.length > 0) {
      setSwipeOffset(120);
    }
    onSwipeRight?.();
  };

  const swipeRef = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 30,
    preventDefaultTouchmove: false
  });

  const handleActionPress = (action: SwipeAction) => {
    impact('medium');
    action.onPress();
    resetPosition();
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        margin: '8px 16px',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 120,
            display: 'flex',
            transform: `translateX(${swipeOffset > 0 ? 0 : -120}px)`,
            transition: isAnimating ? 'transform 0.3s ease' : 'none',
          }}
        >
          {leftActions.map((action, index) => (
            <Box
              key={index}
              onClick={() => handleActionPress(action)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: action.backgroundColor,
                color: action.color,
                cursor: 'pointer',
                '&:active': {
                  opacity: 0.8,
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  color: action.color,
                  mb: 0.5,
                }}
              >
                {action.icon}
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                {action.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 120,
            display: 'flex',
            transform: `translateX(${swipeOffset < 0 ? 0 : 120}px)`,
            transition: isAnimating ? 'transform 0.3s ease' : 'none',
          }}
        >
          {rightActions.map((action, index) => (
            <Box
              key={index}
              onClick={() => handleActionPress(action)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: action.backgroundColor,
                color: action.color,
                cursor: 'pointer',
                '&:active': {
                  opacity: 0.8,
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  color: action.color,
                  mb: 0.5,
                }}
              >
                {action.icon}
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                {action.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Main Content */}
      <Box
        ref={swipeRef}
        onClick={swipeOffset !== 0 ? resetPosition : undefined}
        sx={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.3s ease' : 'none',
          backgroundColor: 'background.paper',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default IOSSwipeableCard;