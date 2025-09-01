import React, { ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface IOSPullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  resistance?: number;
}

export const IOSPullToRefresh = ({
  children,
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 2.5
}: IOSPullToRefreshProps) => {
  const {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    canRefresh
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled
  });

  const getRefreshIndicatorOpacity = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / threshold, 1);
  };

  const getRefreshIndicatorRotation = () => {
    if (isRefreshing) return 0;
    return (pullDistance / threshold) * 180;
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull to refresh indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: `translateX(-50%) translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: getRefreshIndicatorOpacity(),
          transition: isRefreshing ? 'transform 0.3s ease' : 'none',
          zIndex: 1000,
        }}
      >
        {isRefreshing ? (
          <CircularProgress
            size={24}
            sx={{
              color: '#007AFF',
            }}
          />
        ) : (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid #007AFF',
              borderTopColor: 'transparent',
              transform: `rotate(${getRefreshIndicatorRotation()}deg)`,
              transition: 'transform 0.1s ease',
            }}
          />
        )}
      </Box>

      {/* Pull to refresh text */}
      {(isPulling || isRefreshing) && (
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: `translateX(-50%) translateY(${pullDistance}px)`,
            opacity: getRefreshIndicatorOpacity(),
            zIndex: 1000,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#007AFF',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {isRefreshing 
              ? 'Refreshing...' 
              : canRefresh 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)`,
          transition: isRefreshing ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default IOSPullToRefresh;