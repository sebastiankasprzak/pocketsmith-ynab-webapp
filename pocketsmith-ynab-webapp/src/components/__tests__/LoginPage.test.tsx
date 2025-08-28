import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'
import type { AuthContextType } from '../../types/auth'

// Mock the auth context
const mockAuthContext = vi.hoisted(() => ({
  useAuth: vi.fn()
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockAuthContext.useAuth
}))

describe('LoginPage', () => {
  const mockSignIn = vi.fn()
  const mockClearError = vi.fn()

  const mockAuthState = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signIn: mockSignIn,
    signOut: vi.fn(),
    clearError: mockClearError,
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.useAuth.mockReturnValue(mockAuthState())
  })

  it('should render login page with sign in button', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText('Access your PocketSmith-YNAB Sync Manager')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with cognito/i })).toBeInTheDocument()
  })

  it('should call signIn when button is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const signInButton = screen.getByRole('button', { name: /sign in with cognito/i })
    await user.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith()
    })
  })

  it('should show loading state during sign in', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ isLoading: true })
    )

    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /redirecting.../i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should display auth error', () => {
    mockAuthContext.useAuth.mockReturnValue(
      mockAuthState({ error: 'Invalid credentials' })
    )

    render(<LoginPage />)

    const errorAlert = screen.getByRole('alert')
    expect(errorAlert).toHaveTextContent('Invalid credentials')
    expect(errorAlert).toHaveClass('MuiAlert-standardError')
  })

  it('should handle sign in errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const signInButton = screen.getByRole('button', { name: /sign in with cognito/i })
    await user.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })

    // Error should be handled by auth context, not thrown
    expect(consoleError).not.toHaveBeenCalled()
    
    consoleError.mockRestore()
  })
})