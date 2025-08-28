import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '../ProtectedRoute'
import { AuthProvider } from '../../contexts/AuthContext'
import type { AuthContextType } from '../../types/auth'

// Mock the auth context
const mockAuthContext = vi.hoisted(() => ({
  useAuth: vi.fn()
}))

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext')
  return {
    ...actual,
    useAuth: mockAuthContext.useAuth
  }
})

// Mock LoginPage component
vi.mock('../LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">Login Page</div>
}))

describe('ProtectedRoute', () => {
  const mockAuthState = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    ...overrides
  })

  it('should show loading spinner when authentication is loading', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ isLoading: true })
    )

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('should show login page when user is not authenticated', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ 
        isAuthenticated: false,
        isLoading: false 
      })
    )

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should show protected content when user is authenticated', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ 
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      })
    )

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should render multiple children when authenticated', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ 
        isAuthenticated: true,
        isLoading: false 
      })
    )

    render(
      <ProtectedRoute>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('should have proper loading state accessibility', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ isLoading: true })
    )

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    const loadingContainer = screen.getByRole('progressbar').closest('div')
    expect(loadingContainer).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      'min-height': '100vh'
    })
  })

  it('should transition from loading to login page', () => {
    const { rerender } = render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    // Start with loading
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ isLoading: true })
    )
    rerender(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    // Transition to not authenticated
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ 
        isAuthenticated: false,
        isLoading: false 
      })
    )
    rerender(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should transition from loading to protected content', () => {
    const { rerender } = render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    // Start with loading
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ isLoading: true })
    )
    rerender(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    // Transition to authenticated
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ 
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      })
    )
    rerender(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})