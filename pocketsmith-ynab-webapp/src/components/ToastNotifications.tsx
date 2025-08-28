import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Stack,
  IconButton,
  Box,
  LinearProgress
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
  Sync
} from '@mui/icons-material';
import { type TransitionProps } from '@mui/material/transitions';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  progress?: number; // 0-100 for loading toasts
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'inherit';
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAllToasts: () => void;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, persistent?: boolean) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  showLoading: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Slide transition for toasts
const SlideTransition = React.forwardRef<unknown, TransitionProps>(
  function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
  }
);

// Individual toast component
interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Toast>) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose, onUpdate }) => {
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => onClose(toast.id), 150); // Wait for animation
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      case 'loading':
        return <Sync sx={{ animation: 'spin 1s linear infinite' }} />;
      default:
        return null;
    }
  };

  const getSeverity = () => {
    switch (toast.type) {
      case 'loading':
        return 'info';
      default:
        return toast.type;
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={toast.persistent ? null : (toast.duration || 6000)}
      onClose={toast.persistent ? undefined : handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        position: 'relative',
        '& .MuiSnackbar-root': {
          position: 'static',
          transform: 'none'
        }
      }}
    >
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        onClose={toast.persistent ? undefined : handleClose}
        sx={{
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          toast.persistent ? (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <Close fontSize="small" />
            </IconButton>
          ) : undefined
        }
      >
        <Box sx={{ width: '100%' }}>
          {toast.title && (
            <AlertTitle sx={{ mb: 1 }}>{toast.title}</AlertTitle>
          )}
          
          <Box sx={{ mb: toast.actions || toast.type === 'loading' ? 1 : 0 }}>
            {toast.message}
          </Box>

          {toast.type === 'loading' && typeof toast.progress === 'number' && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={toast.progress}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}

          {toast.actions && toast.actions.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {toast.actions.map((action, index) => (
                <IconButton
                  key={index}
                  size="small"
                  color={action.color || 'inherit'}
                  onClick={() => {
                    action.onClick();
                    if (!toast.persistent) {
                      handleClose();
                    }
                  }}
                  sx={{ fontSize: '0.875rem', p: 0.5 }}
                >
                  {action.label}
                </IconButton>
              ))}
            </Stack>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Toast provider component
interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 6000,
      ...toastData
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [generateId, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return showToast({ type: 'success', message, title, duration });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string, persistent?: boolean) => {
    return showToast({ 
      type: 'error', 
      message, 
      title, 
      persistent,
      duration: persistent ? undefined : 8000 
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    return showToast({ type: 'warning', message, title, duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    return showToast({ type: 'info', message, title, duration });
  }, [showToast]);

  const showLoading = useCallback((message: string, title?: string) => {
    return showToast({ 
      type: 'loading', 
      message, 
      title, 
      persistent: true,
      progress: 0
    });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    updateToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast container */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.snackbar,
          pointerEvents: 'none'
        }}
      >
        <Stack spacing={1}>
          {toasts.map(toast => (
            <Box key={toast.id} sx={{ pointerEvents: 'auto' }}>
              <ToastItem
                toast={toast}
                onClose={hideToast}
                onUpdate={updateToast}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    </ToastContext.Provider>
  );
};

// Hook to use toast notifications
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Higher-order component for automatic error handling
export const withToastErrorHandling = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const { showError } = useToast();

    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        showError(
          'An unexpected error occurred. Please try refreshing the page.',
          'Application Error',
          true
        );
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        showError(
          'A network or server error occurred. Please try again.',
          'Request Failed',
          true
        );
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [showError]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withToastErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Utility functions for common toast patterns
export const toastUtils = {
  // Show sync progress
  showSyncProgress: (toastId: string, progress: number, message: string, updateToast: ToastContextType['updateToast']) => {
    updateToast(toastId, {
      progress,
      message: `${message} (${Math.round(progress)}%)`
    });
  },

  // Convert loading toast to success
  convertToSuccess: (toastId: string, message: string, updateToast: ToastContextType['updateToast'], hideToast: ToastContextType['hideToast']) => {
    updateToast(toastId, {
      type: 'success',
      message,
      persistent: false,
      duration: 4000
    });
    
    setTimeout(() => hideToast(toastId), 4000);
  },

  // Convert loading toast to error
  convertToError: (toastId: string, message: string, updateToast: ToastContextType['updateToast']) => {
    updateToast(toastId, {
      type: 'error',
      message,
      persistent: true
    });
  }
};