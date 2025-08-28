import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type { ApiError } from '../services/apiClient';

/**
 * Hook to handle authentication errors in React Query
 */
export const useAuthErrorHandler = () => {
  const queryClient = useQueryClient();
  const { signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleQueryError = (error: any) => {
      // Check if it's an authentication error
      if (error?.code && [
        'UNAUTHORIZED',
        'TOKEN_EXPIRED',
        'INVALID_TOKEN',
        'INVALID_SIGNATURE',
        'INVALID_CLAIMS',
        'MISSING_AUTH_HEADER'
      ].includes(error.code)) {
        
        // Only sign out if user was previously authenticated
        if (isAuthenticated) {
          // Clear all queries to prevent stale data
          queryClient.clear();
          
          // Trigger session expired event
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
    };

    // Set up global error handler for React Query
    queryClient.setMutationDefaults(['*'], {
      onError: handleQueryError
    });

    // Also handle query errors
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'queryUpdated' && event.query.state.error) {
        handleQueryError(event.query.state.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, signOut, isAuthenticated]);
};

/**
 * Custom error boundary for authentication errors
 */
export const isAuthError = (error: any): error is ApiError => {
  return error?.code && [
    'UNAUTHORIZED',
    'TOKEN_EXPIRED',
    'INVALID_TOKEN',
    'INVALID_SIGNATURE',
    'INVALID_CLAIMS',
    'MISSING_AUTH_HEADER'
  ].includes(error.code);
};

/**
 * Get user-friendly error message for API errors
 */
export const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }

  if (error?.code) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Authentication required. Please sign in and try again.';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please sign in again.';
      case 'INVALID_TOKEN':
      case 'INVALID_SIGNATURE':
      case 'INVALID_CLAIMS':
        return 'Authentication failed. Please sign in again.';
      case 'MISSING_AUTH_HEADER':
        return 'Authentication required. Please sign in.';
      case 'FORBIDDEN':
        return 'Access denied. You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'CONFLICT':
        return 'Conflict detected. The resource may have been modified.';
      case 'RATE_LIMIT':
        return 'Too many requests. Please wait a moment and try again.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'SERVICE_UNAVAILABLE':
        return 'Service temporarily unavailable. Please try again later.';
      case 'INTERNAL_ERROR':
        return 'Internal server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};