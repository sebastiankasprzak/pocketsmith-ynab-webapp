import { useEffect, useRef, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration?: number;
}

interface UsePerformanceMonitorOptions {
  trackPageLoad?: boolean;
  trackUserInteractions?: boolean;
  trackApiCalls?: boolean;
}

export const usePerformanceMonitor = (
  pageName: string,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    trackPageLoad = true,
    trackUserInteractions = true,
    trackApiCalls = true,
  } = options;

  const performanceEntries = useRef<Map<string, PerformanceEntry>>(new Map());
  const pageLoadStartTime = useRef<number>(Date.now());

  // Track page load performance
  useEffect(() => {
    if (!trackPageLoad) return;

    const trackPageLoadMetrics = () => {
      // Track page load time
      const loadTime = Date.now() - pageLoadStartTime.current;
      analyticsService.trackPerformance({
        name: 'PageLoadTime',
        value: loadTime,
        unit: 'Milliseconds',
        page: pageName,
      });

      // Track Web Vitals if available
      if ('performance' in window && 'getEntriesByType' in performance) {
        // Largest Contentful Paint (LCP)
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          const lcp = lcpEntries[lcpEntries.length - 1] as any;
          analyticsService.trackPerformance({
            name: 'LargestContentfulPaint',
            value: lcp.startTime,
            unit: 'Milliseconds',
            page: pageName,
          });
        }

        // First Input Delay (FID) - tracked via event listener
        const trackFID = (event: any) => {
          if (event.processingStart && event.startTime) {
            const fid = event.processingStart - event.startTime;
            analyticsService.trackPerformance({
              name: 'FirstInputDelay',
              value: fid,
              unit: 'Milliseconds',
              page: pageName,
            });
          }
        };

        // Listen for first input
        ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
          document.addEventListener(type, trackFID, { once: true, passive: true });
        });

        // Cumulative Layout Shift (CLS)
        if ('PerformanceObserver' in window) {
          try {
            const clsObserver = new PerformanceObserver((list) => {
              let clsValue = 0;
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
              if (clsValue > 0) {
                analyticsService.trackPerformance({
                  name: 'CumulativeLayoutShift',
                  value: clsValue,
                  unit: 'Count',
                  page: pageName,
                });
              }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (error) {
            console.warn('CLS observer not supported:', error);
          }
        }
      }
    };

    // Track metrics after page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoadMetrics();
    } else {
      window.addEventListener('load', trackPageLoadMetrics);
      return () => window.removeEventListener('load', trackPageLoadMetrics);
    }
  }, [pageName, trackPageLoad]);

  // Start timing an operation
  const startTiming = useCallback((operationName: string) => {
    performanceEntries.current.set(operationName, {
      name: operationName,
      startTime: performance.now(),
    });
  }, []);

  // End timing an operation and track the duration
  const endTiming = useCallback((operationName: string, category?: string) => {
    const entry = performanceEntries.current.get(operationName);
    if (!entry) {
      console.warn(`No timing entry found for operation: ${operationName}`);
      return;
    }

    const duration = performance.now() - entry.startTime;
    performanceEntries.current.delete(operationName);

    // Track the performance metric
    analyticsService.trackPerformance({
      name: category ? `${category}.${operationName}` : operationName,
      value: duration,
      unit: 'Milliseconds',
      page: pageName,
    });

    return duration;
  }, [pageName]);

  // Track user interaction performance
  const trackInteraction = useCallback((
    interactionName: string,
    callback: () => Promise<void> | void
  ) => {
    if (!trackUserInteractions) {
      return callback();
    }

    const startTime = performance.now();
    
    const result = callback();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        analyticsService.trackPerformance({
          name: `Interaction.${interactionName}`,
          value: duration,
          unit: 'Milliseconds',
          page: pageName,
        });
      });
    } else {
      const duration = performance.now() - startTime;
      analyticsService.trackPerformance({
        name: `Interaction.${interactionName}`,
        value: duration,
        unit: 'Milliseconds',
        page: pageName,
      });
      return result;
    }
  }, [pageName, trackUserInteractions]);

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    if (!trackApiCalls) {
      return apiCall();
    }

    const startTime = performance.now();
    let success = false;
    
    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      // Track API call duration
      analyticsService.trackPerformance({
        name: `ApiCall.${apiName}`,
        value: duration,
        unit: 'Milliseconds',
        page: pageName,
      });

      // Track API call success/failure
      analyticsService.trackUserAction({
        action: success ? 'success' : 'failure',
        category: 'api_call',
        label: apiName,
        value: 1,
      });
    }
  }, [pageName, trackApiCalls]);

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      analyticsService.trackPerformance({
        name: 'MemoryUsage.Used',
        value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        unit: 'Count',
        page: pageName,
      });

      analyticsService.trackPerformance({
        name: 'MemoryUsage.Total',
        value: memory.totalJSHeapSize / 1024 / 1024, // Convert to MB
        unit: 'Count',
        page: pageName,
      });

      analyticsService.trackPerformance({
        name: 'MemoryUsage.Limit',
        value: memory.jsHeapSizeLimit / 1024 / 1024, // Convert to MB
        unit: 'Count',
        page: pageName,
      });
    }
  }, [pageName]);

  // Track bundle size impact
  const trackBundleMetrics = useCallback(() => {
    if ('getEntriesByType' in performance) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalJSSize = 0;
      let totalCSSSize = 0;
      
      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js')) {
          totalJSSize += entry.transferSize || 0;
        } else if (entry.name.includes('.css')) {
          totalCSSSize += entry.transferSize || 0;
        }
      });

      if (totalJSSize > 0) {
        analyticsService.trackPerformance({
          name: 'BundleSize.JavaScript',
          value: totalJSSize / 1024, // Convert to KB
          unit: 'Count',
          page: pageName,
        });
      }

      if (totalCSSSize > 0) {
        analyticsService.trackPerformance({
          name: 'BundleSize.CSS',
          value: totalCSSSize / 1024, // Convert to KB
          unit: 'Count',
          page: pageName,
        });
      }
    }
  }, [pageName]);

  return {
    startTiming,
    endTiming,
    trackInteraction,
    trackApiCall,
    trackMemoryUsage,
    trackBundleMetrics,
  };
};