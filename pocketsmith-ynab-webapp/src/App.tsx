import React, { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthErrorHandler } from './components/AuthErrorHandler';
import { Navigation } from './components/Navigation';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastNotifications';
import { SkipLinks } from './components/SkipLinks';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { AppInitializer } from './components/AppInitializer';
import { errorLoggingService } from './services/errorLoggingService';
import { useAuthErrorHandler } from './hooks/useAuthErrorHandler';

// Lazy load page components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AccountMappings = React.lazy(() => import('./pages/AccountMappings').then(module => ({ default: module.AccountMappings })));
const SyncStatus = React.lazy(() => import('./pages/SyncStatus').then(module => ({ default: module.SyncStatus })));
const BalanceComparison = React.lazy(() => import('./pages/BalanceComparison').then(module => ({ default: module.BalanceComparison })));

// Loading component for Suspense fallback
const PageLoadingFallback: React.FC = () => (
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
const AuthErrorHandlerWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useAuthErrorHandler();
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary 
      level="critical"
      onError={(error, errorInfo) => {
        errorLoggingService.logError(error, errorInfo, { level: 'critical', component: 'App' }, 'fatal');
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
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
