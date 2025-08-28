import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

// Mock AWS Amplify auth functions
vi.mock('aws-amplify/auth', () => ({
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
}))

// Mock Amplify configuration
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}))

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="user">{auth.user?.email || 'No user'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="error">{auth.error || 'No error'}</div>
      <button onClick={() => auth.signIn()}>
        Sign In
      </button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      <button onClick={() => auth.clearError()}>Clear Error</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockSignInWithRedirect = vi.mocked(signInWithRedirect)
  const mockSignOut = vi.mocked(signOut)
  const mockGetCurrentUser = vi.mocked(getCurrentUser)
  const mockFetchAuthSession = vi.mocked(fetchAuthSession)

  beforeEach(() => {
    vi.clearAllMocks()
    // Set environment to production to test real auth flow
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false')
    vi.stubEnv('DEV', false)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('AuthProvider', () => {
    it('should provide initial loading state', () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })

    it('should authenticate user on mount if valid session exists', async () => {
      const mockUser = {
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' }
      }
      const mockSession = {
        tokens: { accessToken: 'token' }
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockFetchAuthSession.mockResolvedValue(mockSession as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('error')).toHaveTextContent('No error')
    })

    it('should handle authentication check failure', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })

    it('should use mock authentication in development', async () => {
      vi.stubEnv('VITE_USE_MOCK_AUTH', 'true')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('demo@example.com')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('should successfully trigger sign in redirect', async () => {
      const user = userEvent.setup()
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))
      mockSignInWithRedirect.mockResolvedValue(undefined as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByText('Sign In'))

      await waitFor(() => {
        expect(mockSignInWithRedirect).toHaveBeenCalledWith()
      })
    })

    it('should handle sign in failure', async () => {
      const user = userEvent.setup()
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))
      mockSignInWithRedirect.mockRejectedValue(new Error('Invalid credentials'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByText('Sign In'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('should set loading state during sign in', async () => {
      const user = userEvent.setup()
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))
      
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })
      mockSignInWithRedirect.mockReturnValue(signInPromise as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByText('Sign In'))

      // Should be loading during sign in
      expect(screen.getByTestId('loading')).toHaveTextContent('true')

      // Resolve sign in
      act(() => {
        resolveSignIn!(undefined)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const user = userEvent.setup()
      
      // Start with authenticated user
      const mockUser = {
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' }
      }
      const mockSession = {
        tokens: { accessToken: 'token' }
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockFetchAuthSession.mockResolvedValue(mockSession as any)
      mockSignOut.mockResolvedValue(undefined as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      await user.click(screen.getByText('Sign Out'))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })

    it('should handle sign out failure', async () => {
      const user = userEvent.setup()
      
      // Start with authenticated user
      const mockUser = {
        userId: 'user-123',
        signInDetails: { loginId: 'test@example.com' }
      }
      const mockSession = {
        tokens: { accessToken: 'token' }
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockFetchAuthSession.mockResolvedValue(mockSession as any)
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      await user.click(screen.getByText('Sign Out'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign out failed')
      })
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const user = userEvent.setup()
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))
      mockSignInWithRedirect.mockRejectedValue(new Error('Invalid credentials'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger error
      await user.click(screen.getByText('Sign In'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })

      // Clear error
      await user.click(screen.getByText('Clear Error'))

      expect(screen.getByTestId('error')).toHaveTextContent('No error')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponentOutsideProvider = () => {
        useAuth()
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })
})