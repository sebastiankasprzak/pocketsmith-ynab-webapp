import { useState, useCallback, useRef } from 'react';
import { useToast } from '../components/ToastNotifications';
import { ErrorHandler } from '../utils/errorHandling';
import { errorLoggingService } from '../services/errorLoggingService';

export interface LoadingState {
  loading: boolean;
  error: string | null;
  progress?: number; // 0-100 for progress tracking
}

export interface AsyncOperationOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  trackProgress?: boolean;
  logErrors?: boolean;
  context?: Record<string, any>;
}

export const useLoadingState = (initialLoading = false) => {
  const [state, setState] = useState<LoadingState>({
    loading: initialLoading,
    error: null,
    progress: undefined
  });
  
  const { showSuccess, showError, showLoading, updateToast, hideToast } = useToast();
  const loadingToastRef = useRef<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setProgress = useCallback((progress: number | undefined) => {
    setState(prev => ({ ...prev, progress }));
    
    // Update loading toast if it exists
    if (loadingToastRef.current && progress !== undefined) {
      updateToast(loadingToastRef.current, { progress });
    }
  }, [updateToast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, progress: undefined });
    
    // Hide loading toast if it exists
    if (loadingToastRef.current) {
      hideToast(loadingToastRef.current);
      loadingToastRef.current = null;
    }
  }, [hideToast]);

  // Execute an async operation with automatic loading state management
  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    const {
      showSuccessToast = false,
      successMessage = 'Operation completed successfully',
      showErrorToast = true,
      trackProgress = false,
      logErrors = true,
      context = {}
    } = options;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Show loading toast if tracking progress
      if (trackProgress) {
        loadingToastRef.current = showLoading('Processing...', 'Please wait');
      }

      const result = await operation();

      // Show success toast if requested
      if (showSuccessToast) {
        if (loadingToastRef.current) {
          updateToast(loadingToastRef.current, {
            type: 'success',
            message: successMessage,
            persistent: false,
            duration: 4000
          });
          setTimeout(() => {
            if (loadingToastRef.current) {
              hideToast(loadingToastRef.current);
              loadingToastRef.current = null;
            }
          }, 4000);
        } else {
          showSuccess(successMessage);
        }
      } else if (loadingToastRef.current) {
        hideToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }

      setState(prev => ({ ...prev, loading: false, progress: undefined }));
      return result;
    } catch (error) {
      // Log error if requested
      if (logErrors) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          undefined,
          {
            ...context,
            component: 'useLoadingState',
            operation: operation.name || 'anonymous'
          }
        );
      }

      // Parse error for user-friendly message
      const errorDetails = ErrorHandler.parseError(error);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorDetails.userMessage,
        progress: undefined 
      }));

      // Show error toast if requested
      if (showErrorToast) {
        if (loadingToastRef.current) {
          updateToast(loadingToastRef.current, {
            type: 'error',
            message: errorDetails.userMessage,
            persistent: true
          });
        } else {
          showError(errorDetails.userMessage, 'Operation Failed', true);
        }
      } else if (loadingToastRef.current) {
        hideToast(loadingToastRef.current);
        loadingToastRef.current = null;
      }

      return null;
    }
  }, [showSuccess, showError, showLoading, updateToast, hideToast]);

  // Execute multiple async operations with combined loading state
  const executeMultiple = useCallback(async <T>(
    operations: Array<() => Promise<T>>,
    options: AsyncOperationOptions & { 
      stopOnError?: boolean;
      showProgressPercentage?: boolean;
    } = {}
  ): Promise<Array<T | null>> => {
    const {
      stopOnError = false,
      showProgressPercentage = true,
      trackProgress = true,
      ...restOptions
    } = options;

    const results: Array<T | null> = [];
    let completedCount = 0;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (trackProgress) {
        loadingToastRef.current = showLoading(
          `Processing ${operations.length} operations...`,
          'Please wait'
        );
      }

      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]();
          results.push(result);
          completedCount++;
          
          // Update progress
          if (showProgressPercentage && loadingToastRef.current) {
            const progress = Math.round((completedCount / operations.length) * 100);
            setProgress(progress);
            updateToast(loadingToastRef.current, {
              message: `Processing operation ${completedCount}/${operations.length}...`,
              progress
            });
          }
        } catch (error) {
          results.push(null);
          
          if (stopOnError) {
            throw error;
          }
          
          // Log individual operation error
          errorLoggingService.logError(
            error instanceof Error ? error : new Error(String(error)),
            undefined,
            {
              component: 'useLoadingState',
              operation: `batch_operation_${i}`,
              batchSize: operations.length,
              completedCount
            }
          );
        }
      }

      // Show completion message
      if (loadingToastRef.current) {
        updateToast(loadingToastRef.current, {
          type: 'success',
          message: `Completed ${completedCount}/${operations.length} operations`,
          persistent: false,
          duration: 4000
        });
        setTimeout(() => {
          if (loadingToastRef.current) {
            hideToast(loadingToastRef.current);
            loadingToastRef.current = null;
          }
        }, 4000);
      }

      setState(prev => ({ ...prev, loading: false, progress: undefined }));
      return results;
    } catch (error) {
      const errorDetails = ErrorHandler.parseError(error);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorDetails.userMessage,
        progress: undefined 
      }));

      if (loadingToastRef.current) {
        updateToast(loadingToastRef.current, {
          type: 'error',
          message: `Failed after ${completedCount}/${operations.length} operations: ${errorDetails.userMessage}`,
          persistent: true
        });
      }

      return results;
    }
  }, [showLoading, updateToast, hideToast, setProgress]);

  return {
    ...state,
    setLoading,
    setError,
    setProgress,
    clearError,
    reset,
    executeAsync,
    executeMultiple
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { loading: false, error: null };
  }, [states]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], loading }
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], error }
    }));
  }, []);

  const setProgress = useCallback((key: string, progress: number | undefined) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], progress }
    }));
  }, []);

  const clearError = useCallback((key: string) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], error: null }
    }));
  }, []);

  const reset = useCallback((key: string) => {
    setStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const resetAll = useCallback(() => {
    setStates({});
  }, []);

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.loading);
  }, [states]);

  const hasAnyError = useCallback(() => {
    return Object.values(states).some(state => state.error);
  }, [states]);

  return {
    states,
    getState,
    setLoading,
    setError,
    setProgress,
    clearError,
    reset,
    resetAll,
    isAnyLoading,
    hasAnyError
  };
};