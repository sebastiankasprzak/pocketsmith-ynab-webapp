import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  tokenUse: string;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}

class AuthenticationService {
  private jwtVerifier: any;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID;

    if (!userPoolId || !clientId) {
      console.warn('Cognito configuration not found. JWT validation will be disabled.');
      return;
    }

    try {
      this.jwtVerifier = CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: 'id', // Changed from 'access' to 'id' to match what frontend sends
        clientId
      });
      this.initialized = true;
      console.log('JWT verifier initialized successfully');
    } catch (error) {
      console.error('Failed to initialize JWT verifier:', error);
    }
  }

  /**
   * Extract and validate JWT token from API Gateway event
   */
  async validateToken(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
    if (!this.initialized || !this.jwtVerifier) {
      throw {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'Authentication is not properly configured',
        statusCode: 500
      } as AuthError;
    }

    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader) {
      throw {
        code: 'MISSING_AUTH_HEADER',
        message: 'Authorization header is required',
        statusCode: 401
      } as AuthError;
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw {
        code: 'INVALID_AUTH_FORMAT',
        message: 'Authorization header must be in format: Bearer <token>',
        statusCode: 401
      } as AuthError;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw {
        code: 'MISSING_TOKEN',
        message: 'JWT token is required',
        statusCode: 401
      } as AuthError;
    }

    try {
      // Verify the JWT token
      const payload = await this.jwtVerifier.verify(token);
      
      return {
        userId: payload.sub,
        email: payload.email || '',
        username: payload.username || payload['cognito:username'] || '',
        tokenUse: payload.token_use
      };
    } catch (error: any) {
      console.error('JWT verification failed:', error);
      
      if (error.name === 'JwtExpiredError') {
        throw {
          code: 'TOKEN_EXPIRED',
          message: 'JWT token has expired',
          statusCode: 401
        } as AuthError;
      } else if (error.name === 'JwtInvalidSignatureError') {
        throw {
          code: 'INVALID_SIGNATURE',
          message: 'JWT token has invalid signature',
          statusCode: 401
        } as AuthError;
      } else if (error.name === 'JwtInvalidClaimError') {
        throw {
          code: 'INVALID_CLAIMS',
          message: 'JWT token has invalid claims',
          statusCode: 401
        } as AuthError;
      } else {
        throw {
          code: 'INVALID_TOKEN',
          message: 'JWT token is invalid',
          statusCode: 401
        } as AuthError;
      }
    }
  }

  /**
   * Check if authentication is enabled
   */
  isAuthEnabled(): boolean {
    return this.initialized && !!this.jwtVerifier;
  }

  /**
   * Get user ID from validated token (convenience method)
   */
  async getUserId(event: APIGatewayProxyEvent): Promise<string> {
    const user = await this.validateToken(event);
    return user.userId;
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

/**
 * Middleware function to validate authentication for Lambda handlers
 * When using API Gateway Cognito authorizers, user info is in the request context
 */
export async function requireAuth(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  // If using API Gateway Cognito authorizer, user info is in request context
  if (event.requestContext?.authorizer?.claims) {
    const claims = event.requestContext.authorizer.claims;
    return {
      userId: claims.sub,
      email: claims.email || '',
      username: claims['cognito:username'] || claims.username || '',
      tokenUse: claims.token_use || 'id'
    };
  }
  
  // Fallback to JWT validation for direct Lambda invocation
  return await authService.validateToken(event);
}

/**
 * Optional authentication - returns user if authenticated, null if not
 */
export async function optionalAuth(event: APIGatewayProxyEvent): Promise<AuthenticatedUser | null> {
  try {
    return await authService.validateToken(event);
  } catch (error) {
    return null;
  }
}

/**
 * Create standardized auth error response
 */
export function createAuthErrorResponse(error: AuthError) {
  return {
    statusCode: error.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    })
  };
}