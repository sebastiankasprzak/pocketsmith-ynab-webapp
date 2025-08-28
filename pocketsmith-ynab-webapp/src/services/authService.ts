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
    console.warn('Cognito configuration not found. Authentication will be disabled.');
    return;
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
        }
      }
    });
    console.log('AWS Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure AWS Amplify:', error);
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
      console.error('Sign in error:', error);
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
      console.error('Sign out error:', error);
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
      console.error('Get current user error:', error);
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
      console.error('Get tokens error:', error);
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
      
      // Enhanced debugging
      console.log('🔐 Token validation:', {
        hasIdToken: !!tokens.idToken,
        hasAccessToken: !!tokens.accessToken,
        idTokenLength: tokens.idToken?.length,
        accessTokenLength: tokens.accessToken?.length,
        idTokenParts: tokenParts.length,
        idTokenHeader: tokenParts[0]?.substring(0, 20) + '...',
        idTokenPayload: tokenParts[1]?.substring(0, 20) + '...',
        idTokenSignature: tokenParts[2]?.substring(0, 20) + '...',
        fullIdToken: tokens.idToken
      });
      
      return tokens.idToken;
    } catch (error) {
      console.error('Get ID token error:', error);
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
      await this.getCurrentUser();
      return true;
    } catch {
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
      console.error('Refresh session error:', error);
      throw new Error('Failed to refresh authentication session');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();