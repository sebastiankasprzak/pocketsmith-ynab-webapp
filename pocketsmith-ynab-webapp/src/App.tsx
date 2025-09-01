import React, { Suspense, lazy } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { useIOSTheme } from './hooks/useIOSTheme';
import { useIOSDetection } from './components/IOSLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthErrorHandler } from './components/AuthErrorHandler';
import { Navigation } from './components/Navigation';
import { Layout } from './components/Layout';
import { IOSLayout } from './components/IOSLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastNotifications';
import { SkipLinks } from './components/SkipLinks';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { AppInitializer } from './components/AppInitializer';
import { errorLoggingService } from './services/errorLoggingService';
import { useAuthErrorHandler } from './hooks/useAuthErrorHandler';

// Lazy load page components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AccountMappings = lazy(() => import('./pages/AccountMappings').then(module => ({ default: module.AccountMappings })));
const SyncStatus = lazy(() => import('./pages/SyncStatus').then(module => ({ default: module.SyncStatus })));
const BalanceComparison = lazy(() => import('./pages/BalanceComparison').then(module => ({ default: module.BalanceComparison })));
const IOSDemo = lazy(() => import('./pages/IOSDemo').then(module => ({ default: module.IOSDemo })));
const SimpleIOSTest = lazy(() => import('./components/SimpleIOSTest').then(module => ({ default: module.SimpleIOSTest })));

// Loading component for Suspense fallback
const PageLoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      Loading page...
    </Box>
  </Box>
);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to initialize auth error handling
const AuthErrorHandlerWrapper = ({ children }: { children: React.ReactNode }) => {
  useAuthErrorHandler();
  return <>{children}</>;
};

// Main app content component
const AppContent = () => {
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Simple iOS detection without external hook
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const shouldUseIOSLayout = isIOS && isMobile;

  if (shouldUseIOSLayout) {
    return (
      <IOSLayout>
        <ErrorBoundary 
          level="page"
          onError={(error, errorInfo) => {
            errorLoggingService.logError(error, errorInfo, { 
              level: 'page', 
              component: 'Routes',
              path: window.location.pathname 
            });
          }}
        >
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<AccountMappings />} />
              <Route path="/sync" element={<SyncStatus />} />
              <Route path="/settings" element={<BalanceComparison />} />
              <Route path="/ios-demo" element={<IOSDemo />} />
              <Route path="/ios-test" element={<SimpleIOSTest />} />
              {/* Legacy routes for compatibility */}
              <Route path="/account-mappings" element={<AccountMappings />} />
              <Route path="/sync-status" element={<SyncStatus />} />
              <Route path="/balance-comparison" element={<BalanceComparison />} />
              {/* Catch-all route to redirect to home for unknown paths */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </IOSLayout>
    );
  }

  // Default layout for non-iOS or desktop
  return (
    <Navigation>
      <Layout>
        <ErrorBoundary 
          level="page"
          onError={(error, errorInfo) => {
            errorLoggingService.logError(error, errorInfo, { 
              level: 'page', 
              component: 'Routes',
              path: window.location.pathname 
            });
          }}
        >
          <Box 
            component="main" 
            id="main-content"
            tabIndex={-1}
            sx={{ outline: 'none' }}
          >
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<AccountMappings />} />
                <Route path="/sync" element={<SyncStatus />} />
                <Route path="/settings" element={<BalanceComparison />} />
                <Route path="/ios-demo" element={<IOSDemo />} />
                <Route path="/ios-test" element={<SimpleIOSTest />} />
                {/* Legacy routes for compatibility */}
                <Route path="/account-mappings" element={<AccountMappings />} />
                <Route path="/sync-status" element={<SyncStatus />} />
                <Route path="/balance-comparison" element={<BalanceComparison />} />
                {/* Catch-all route to redirect to home for unknown paths */}
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Suspense>
          </Box>
        </ErrorBoundary>
      </Layout>
    </Navigation>
  );
};

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Simple iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Use iOS theme on iOS devices, fallback to default theme
  const appTheme = (isIOS && isMobile) ? useIOSTheme(prefersDarkMode) : theme;

  return (
    <ErrorBoundary 
      level="critical"
      onError={(error, errorInfo) => {
        errorLoggingService.logError(error, errorInfo, { level: 'critical', component: 'App' }, 'fatal');
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <ToastProvider>
            <ErrorBoundary 
              level="page"
              onError={(error, errorInfo) => {
                errorLoggingService.logError(error, errorInfo, { level: 'page', component: 'AuthProvider' });
              }}
            >
              <AppInitializer>
                <AuthProvider>
                  <AuthErrorHandlerWrapper>
                    <AuthErrorHandler>
                      <Router>
                        <SkipLinks />
                        <PWAUpdatePrompt />
                        <PWAInstallPrompt />
                        <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
                          <ProtectedRoute>
                            <AppContent />
                          </ProtectedRoute>
                        </Box>
                      </Router>
                    </AuthErrorHandler>
                  </AuthErrorHandlerWrapper>
                </AuthProvider>
              </AppInitializer>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
