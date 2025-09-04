import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export const usePullToRefresh = (options: PullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    enabled = true
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const containerRef = useRef<HTMLElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    try {
      if (container.scrollTop > 0) return;
    } catch (error) {
      // Element might be detached, skip this interaction
      return;
    }

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !enabled || state.isRefreshing) return;

    const container = containerRef.current;
    if (!container) {
      isDragging.current = false;
      return;
    }
    
    try {
      if (container.scrollTop > 0) {
        isDragging.current = false;
        return;
      }
    } catch (error) {
      // Element might be detached, stop dragging
      isDragging.current = false;
      return;
    }

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const pullDistance = Math.min(deltaY / resistance, threshold * 1.5);
      const canRefresh = pullDistance >= threshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));
    }
  }, [enabled, state.isRefreshing, threshold, resistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || !enabled) return;

    isDragging.current = false;

    if (state.canRefresh && !state.isRefreshing) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        pullDistance: threshold
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
          canRefresh: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [enabled, state.canRefresh, state.isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    } catch (error) {
      console.warn('Failed to add touch listeners:', error);
      return;
    }

    return () => {
      try {
        if (container) {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
        }
      } catch (error) {
        console.warn('Failed to remove touch listeners:', error);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state
  };
};

export default usePullToRefresh;