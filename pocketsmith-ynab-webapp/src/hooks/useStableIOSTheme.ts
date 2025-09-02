import { useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { useIOSTheme } from './useIOSTheme';
import { useIOSDetection } from './useIOSDetection';
import { theme } from '../theme';

/**
 * A stable version of iOS theme switching that prevents render loops
 * and ensures consistent theme application on iOS devices.
 * 
 * Current Implementation:
 * - iOS theme is enabled in development mode for testing
 * - iOS theme is enabled on desktop browsers for preview
 * - iOS theme is disabled on iOS production to prevent blank page issues
 * 
 * This approach ensures the app works reliably on all devices while
 * allowing developers to test and preview iOS-specific theming.
 */
export const useStableIOSTheme = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const detection = useIOSDetection();
  
  // Always create the iOS theme (hooks must be called unconditionally)
  const iosTheme = useIOSTheme(prefersDarkMode);
  
  // Memoize the theme selection with stable dependencies
  const selectedTheme = useMemo(() => {
    // Safe iOS theme switching: only enable in specific conditions
    const isDevelopment = import.meta.env.DEV;
    const isDesktop = !detection.isIOS; // Only enable on desktop for now
    
    // Enable iOS theme switching only in safe conditions
    if (detection.shouldUseIOSExperience && (isDevelopment || isDesktop)) {
      return iosTheme;
    }
    
    // Default to standard theme for iOS devices in production to prevent blank pages
    return theme;
  }, [detection.shouldUseIOSExperience, detection.isIOS, iosTheme]);
  
  return selectedTheme;
};