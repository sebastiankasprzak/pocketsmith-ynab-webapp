import React, { type ReactNode, useEffect, useState, useRef } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useIOSDetection } from '../hooks/useIOSDetection';

interface IOSNavigationBarProps {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  large?: boolean;
  onBack?: () => void;
  scrollElement?: HTMLElement | null;
  collapseThreshold?: number;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export const IOSNavigationBar = ({
  title,
  leftAction,
  rightAction,
  large = false,
  onBack,
  scrollElement,
  collapseThreshold = 44,
  scrollContainerRef
}: IOSNavigationBarProps) => {
  const theme = useTheme();
  const { selection } = useHapticFeedback();
  const { capabilities } = useIOSDetection();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const isDark = theme.palette.mode === 'dark';

  // Handle scroll-based collapse for large titles
  useEffect(() => {
    if (!large) return;

    let isMounted = true;
    let scrollHandler: ((event: Event) => void) | null = null;
    let targetElement: HTMLElement | Window | null = null;

    const safeScrollHandler = (event: Event) => {
      // Early return if component is unmounted
      if (!isMounted) return;
      
      try {
        let currentScrollY = 0;
        
        // Get the current target element each time to avoid stale references
        const currentTarget = scrollContainerRef?.current || scrollElement || window;
        
        if (currentTarget === window) {
          // Use window scroll position
          try {
            currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          } catch (windowError) {
            // Fallback if window properties are not available
            currentScrollY = 0;
          }
        } else if (currentTarget) {
          // Safely check if it's an HTMLElement with scrollTop
          try {
            // Multiple layers of safety checks
            if (
              currentTarget && 
              typeof currentTarget === 'object' && 
              currentTarget !== null && 
              !currentTarget.hasOwnProperty || // Check if it's not a detached node
              (currentTarget as any).nodeType === 1 // Ensure it's an element node
            ) {
              // Check if scrollTop exists and is accessible
              const scrollTopDescriptor = Object.getOwnPropertyDescriptor(currentTarget, 'scrollTop') ||
                                        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(currentTarget), 'scrollTop');
              
              if (scrollTopDescriptor && typeof (currentTarget as any).scrollTop === 'number') {
                currentScrollY = (currentTarget as HTMLElement).scrollTop;
              } else {
                // Try alternative scroll position methods
                if ('scrollingElement' in document && document.scrollingElement) {
                  currentScrollY = document.scrollingElement.scrollTop || 0;
                } else {
                  currentScrollY = document.documentElement.scrollTop || document.body.scrollTop || 0;
                }
              }
            }
          } catch (elementError) {
            // Element might have been removed from DOM, use document scroll as fallback
            try {
              currentScrollY = document.documentElement.scrollTop || document.body.scrollTop || 0;
            } catch (docError) {
              currentScrollY = 0;
            }
          }
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setScrollY(currentScrollY);
          
          // Collapse when scrolled past threshold
          const shouldCollapse = currentScrollY > collapseThreshold;
          if (shouldCollapse !== isCollapsed) {
            setIsCollapsed(shouldCollapse);
          }
        }
      } catch (error) {
        console.warn('IOSNavigationBar scroll handler error:', error);
        // Gracefully handle the error without breaking the component
        // Disable further scroll handling if errors persist
        if (scrollHandler && targetElement) {
          try {
            if (targetElement === window) {
              window.removeEventListener('scroll', scrollHandler);
            } else if (targetElement && 'removeEventListener' in targetElement) {
              (targetElement as HTMLElement).removeEventListener('scroll', scrollHandler);
            }
          } catch (removeError) {
            // Ignore cleanup errors
          }
          scrollHandler = null;
          targetElement = null;
        }
      }
    };

    // Store the handler reference for cleanup
    scrollHandler = safeScrollHandler;
    
    // Determine the target element for scroll listening
    targetElement = scrollContainerRef?.current || scrollElement || window;
    
    // Add event listener with proper error handling
    try {
      if (targetElement === window) {
        window.addEventListener('scroll', scrollHandler, { passive: true });
      } else if (targetElement && 'addEventListener' in targetElement) {
        (targetElement as HTMLElement).addEventListener('scroll', scrollHandler, { passive: true });
      }
    } catch (error) {
      console.warn('Failed to add scroll listener:', error);
      scrollHandler = null;
      targetElement = null;
    }

    return () => {
      isMounted = false;
      if (scrollHandler && targetElement) {
        try {
          if (targetElement === window) {
            window.removeEventListener('scroll', scrollHandler);
          } else if (targetElement && 'removeEventListener' in targetElement) {
            (targetElement as HTMLElement).removeEventListener('scroll', scrollHandler);
          }
        } catch (error) {
          console.warn('Failed to remove scroll listener:', error);
        }
      }
    };
  }, [large, scrollElement, scrollContainerRef, collapseThreshold, isCollapsed]);

  const handleBackPress = () => {
    selection();
    onBack?.();
  };

  const getNavigationBarHeight = () => {
    if (large && !isCollapsed) {
      return capabilities.hasNotch || capabilities.hasDynamicIsland ? 120 : 100;
    }
    return capabilities.hasNotch || capabilities.hasDynamicIsland ? 80 : 60;
  };

  const getStatusBarHeight = () => {
    if (capabilities.hasNotch) return 44; // iPhone X and newer with notch
    if (capabilities.hasDynamicIsland) return 54; // iPhone 14 Pro and newer with Dynamic Island
    return 20; // Older iPhones and fallback
  };

  const getTitleOpacity = () => {
    if (!large) return 1;
    if (isCollapsed) return 1;
    
    // Fade out large title as user scrolls
    const fadeStart = 20;
    const fadeEnd = collapseThreshold;
    if (scrollY <= fadeStart) return 1;
    if (scrollY >= fadeEnd) return 0;
    return 1 - ((scrollY - fadeStart) / (fadeEnd - fadeStart));
  };

  const getSmallTitleOpacity = () => {
    if (!large) return 1;
    if (!isCollapsed) return 0;
    
    // Fade in small title when collapsed
    const fadeStart = collapseThreshold - 10;
    const fadeEnd = collapseThreshold + 10;
    if (scrollY <= fadeStart) return 0;
    if (scrollY >= fadeEnd) return 1;
    return (scrollY - fadeStart) / (fadeEnd - fadeStart);
  };

  return (
    <Box
      ref={navRef}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        backgroundColor: isDark 
          ? 'rgba(28, 28, 30, 0.95)' 
          : 'rgba(248, 248, 248, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `0.5px solid ${isDark ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)'}`,
        height: getNavigationBarHeight(),
        transition: 'height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        // Enhanced status bar area styling
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${getStatusBarHeight()}px`,
          backgroundColor: isDark 
            ? 'rgba(28, 28, 30, 1)' 
            : 'rgba(248, 248, 248, 1)',
          zIndex: -1,
        },
        paddingTop: `${getStatusBarHeight()}px`,
      }}
    >
      {/* Standard Navigation Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
          px: 2,
          minHeight: 44,
        }}
      >
        {/* Left Action */}
        <Box sx={{ minWidth: 44, display: 'flex', justifyContent: 'flex-start' }}>
          {leftAction || (onBack && (
            <IconButton
              onClick={handleBackPress}
              size="small"
              sx={{
                color: theme.palette.primary.main,
                p: 1,
                '&:active': {
                  opacity: 0.3,
                  transform: 'scale(0.96)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          ))}
        </Box>

        {/* Center Title (for standard nav bar) */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            opacity: large ? getSmallTitleOpacity() : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '17px',
              fontWeight: 600,
              color: isDark ? '#FFFFFF' : '#000000',
              textAlign: 'center',
              maxWidth: '60%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Right Action */}
        <Box sx={{ minWidth: 44, display: 'flex', justifyContent: 'flex-end' }}>
          {rightAction}
        </Box>
      </Box>

      {/* Large Title (when enabled) */}
      {large && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            px: 2,
            pb: 1,
            opacity: getTitleOpacity(),
            transition: 'opacity 0.2s ease-in-out',
            transform: `translateY(${Math.min(scrollY * 0.5, 20)}px)`,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: '34px',
              fontWeight: 700,
              lineHeight: '41px',
              color: isDark ? '#FFFFFF' : '#000000',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              letterSpacing: '0.37px',
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IOSNavigationBar;