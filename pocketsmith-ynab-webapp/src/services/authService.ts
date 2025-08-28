import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Check if authentication is configured
const isAuthConfigured = () => {
  return !!(
    import.meta.env.VITE_COGNITO_USER_POOL_ID &&
    import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID &&
    import.meta.env.VITE_COGNITO_USER_POOL_DOMAIN
  );
};

// Configure Amplify with Cognito settings
const configureAuth = () => {
  if (!isAuthConfigured()) {
    return;
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
          // Add additional configuration for better session management
          cookieStorage: {
            domain: window.location.hostname,
            path: '/',
            expires: 365,
            sameSite: 'strict',
            secure: window.location.protocol === 'https:'
          }
        }
      }
    });
  } catch (error) {
    console.warn('Failed to configure Amplify Auth:', error);
  }
};

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

class AuthService {
  private initialized = false;
  private authEnabled = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!this.initialized) {
      this.authEnabled = isAuthConfigured();
      if (this.authEnabled) {
        configureAuth();
      }
      this.initialized = true;
    }
  }

  /**
   * Check if authentication is enabled and configured
   */
  isAuthEnabled(): boolean {
    return this.authEnabled;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (!this.authEnabled) {
      throw new Error('Authentication is not configured');
    }

    try {
      const result = await signIn({
        username: email,
        password: password
      });

      if (result.isSignedIn) {
        return await this.getCurrentUser();
      } else {
        throw new Error('Sign in incomplete - additional steps required');
      }
    } catch (error) {
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!this.authEnabled) {
      return; // No-op if auth is not enabled
    }

    try {
      await signOut();
    } catch (error) {
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser> {
    if (!this.authEnabled) {
      throw new Error('Authentication is not configured');
    }

    try {
      const user = await getCurrentUser();
      return {
        userId: user.userId,
        email: user.signInDetails?.loginId || '',
        name: user.username
      };
    } catch (error) {
      throw new Error('No authenticated user found');
    }
  }

  /**
   * Get current auth tokens
   */
  async getTokens(): Promise<AuthTokens> {
    if (!this.authEnabled) {
      throw new Error('Authentication is not configured');
    }

    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        throw new Error('No tokens available');
      }

      return {
        accessToken: session.tokens.accessToken.toString(),
        idToken: session.tokens.idToken?.toString() || '',
        refreshToken: session.tokens.refreshToken?.toString() || ''
      };
    } catch (error) {
      throw new Error('Failed to retrieve auth tokens');
    }
  }

  /**
   * Get ID token for API requests
   * API Gateway Cognito authorizers expect ID tokens, not access tokens
   */
  async getIdToken(): Promise<string> {
    if (!this.authEnabled) {
      throw new Error('Authentication is not configured');
    }

    try {
      const tokens = await this.getTokens();
      
      // Validate that we have a proper ID token
      if (!tokens.idToken) {
        throw new Error('ID token is missing from auth session');
      }
      
      // Validate JWT format (should have 3 parts separated by dots)
      const tokenParts = tokens.idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error(`Invalid JWT format: expected 3 parts, got ${tokenParts.length}`);
      }
      
      return tokens.idToken;
    } catch (error) {
      throw new Error(`Failed to retrieve ID token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get access token for API requests
   * Note: For this application, API Gateway expects ID tokens, so this method returns the ID token
   * @deprecated Use getIdToken() for clarity - this method returns ID token for API Gateway compatibility
   */
  async getAccessToken(): Promise<string> {
    return this.getIdToken();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.authEnabled) {
      return true; // If auth is not configured, consider user as "authenticated"
    }

    try {
      // First try to get the session to check if tokens exist
      const session = await fetchAuthSession();
      
      // Check if we have valid tokens
      if (!session.tokens || !session.tokens.accessToken) {
        return false;
      }
      
      // Verify we can get the current user
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.warn('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<void> {
    if (!this.authEnabled) {
      return; // No-op if auth is not enabled
    }

    try {
      await fetchAuthSession({ forceRefresh: true });
    } catch (error) {
      throw new Error('Failed to refresh authentication session');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();