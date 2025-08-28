import axios, { AxiosInstance, AxiosError, type AxiosResponse } from 'axios';
import { authService } from './authService';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  timestamp?: string;
  details?: any;
}

export interface ApiErrorResponse {
  error: ApiError;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add authentication token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Only add auth token if authentication is enabled and user is authenticated
          if (authService.isAuthEnabled()) {
            const isAuthenticated = await authService.isAuthenticated();
            
            if (isAuthenticated) {
              try {
                // Use ID token for API Gateway Cognito authorizer compatibility
                const token = await authService.getIdToken();
                
                // Validate token before using it
                if (!token || typeof token !== 'string' || token.trim() === '') {
                  throw new Error('Invalid token: empty or not a string');
                }
                
                // Validate JWT format
                if (token.split('.').length !== 3) {
                  throw new Error('Invalid JWT format');
                }
                
                config.headers.Authorization = `Bearer ${token}`;
                
                // Enhanced debugging to troubleshoot authorization header issue
                console.log('🔐 Token debugging:', {
                  url: config.url,
                  method: config.method?.toUpperCase(),
                  hasToken: !!token,
                  tokenType: typeof token,
                  tokenLength: token?.length,
                  tokenPrefix: token?.substring(0, 50) + '...',
                  tokenSuffix: '...' + token?.substring(token.length - 20),
                  isJWT: token?.split('.').length === 3,
                  authHeaderLength: `Bearer ${token}`.length,
                  authHeaderPrefix: `Bearer ${token}`.substring(0, 100) + '...'
                });
              } catch (tokenError) {
                console.error('❌ Token validation failed:', tokenError);
                // Continue without token rather than failing the request
                console.warn('⚠️ Proceeding with request without authentication token');
              }
            } else if (import.meta.env.DEV) {
              console.warn('⚠️ User not authenticated, making request without token');
            }
          } else if (import.meta.env.DEV) {
            console.log('🔧 Auth not enabled, making request without token');
          }
        } catch (error) {
          // Authentication not available or failed - continue without token
          if (import.meta.env.DEV) {
            console.error('❌ Authentication error for API request:', error);
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle authentication errors and standardize error format
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle authentication errors
        if (error.response?.status === 401) {
          const errorData = error.response.data as ApiErrorResponse;
          
          // Check if it's a token-related error
          if (errorData?.error?.code && [
            'TOKEN_EXPIRED',
            'INVALID_TOKEN',
            'INVALID_SIGNATURE',
            'INVALID_CLAIMS'
          ].includes(errorData.error.code)) {
            
            try {
              // Try to refresh the session
              await authService.refreshSession();
              
              // Retry the original request once
              if (originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                
                // Get new ID token and retry
                const token = await authService.getIdToken();
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                return this.client(originalRequest);
              }
            } catch (refreshError) {
              console.error('Failed to refresh authentication session:', refreshError);
              
              // If refresh fails, redirect to sign in
              // This could be handled by the auth context or a global error handler
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }
          }
        }

        // Standardize error format
        const apiError = this.formatError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private formatError(error: AxiosError): ApiError {
    // If the error response has our standard format, use it
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as any;
      
      if (errorData.error) {
        return {
          code: errorData.error.code || 'API_ERROR',
          message: errorData.error.message || 'An API error occurred',
          statusCode: error.response.status,
          timestamp: errorData.error.timestamp,
          details: errorData.error.details
        };
      }
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        statusCode: 408
      };
    }

    if (error.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
        statusCode: 0
      };
    }

    // Handle HTTP status codes
    const statusCode = error.response?.status || 0;
    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN_ERROR';

    switch (statusCode) {
      case 400:
        code = 'BAD_REQUEST';
        message = 'Invalid request. Please check your input and try again.';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        message = 'Authentication required. Please sign in and try again.';
        break;
      case 403:
        code = 'FORBIDDEN';
        message = 'Access denied. You do not have permission to perform this action.';
        break;
      case 404:
        code = 'NOT_FOUND';
        message = 'The requested resource was not found.';
        break;
      case 409:
        code = 'CONFLICT';
        message = 'Conflict detected. The resource may have been modified by another user.';
        break;
      case 429:
        code = 'RATE_LIMIT';
        message = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        code = 'INTERNAL_ERROR';
        message = 'Internal server error. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        code = 'SERVICE_UNAVAILABLE';
        message = 'Service temporarily unavailable. Please try again later.';
        break;
    }

    return {
      code,
      message,
      statusCode
    };
  }

  // Expose axios methods with proper typing
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  // Get the underlying axios instance if needed
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;