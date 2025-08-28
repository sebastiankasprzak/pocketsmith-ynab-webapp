import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLoadingState, useMultipleLoadingStates } from '../useLoadingState'

// Mock the toast notifications
const mockToast = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showLoading: vi.fn().mockReturnValue('toast-id'),
  updateToast: vi.fn(),
  hideToast: vi.fn(),
}))

vi.mock('../components/ToastNotifications', () => ({
  useToast: () => mockToast
}))

// Mock error logging service
vi.mock('../services/errorLoggingService', () => ({
  errorLoggingService: {
    logError: vi.fn()
  }
}))

// Mock error handler
vi.mock('../utils/errorHandling', () => ({
  ErrorHandler: {
    parseError: vi.fn((error) => ({
      userMessage: error.message || 'Unknown error',
      technicalMessage: error.message || 'Unknown error'
    }))
  }
}))

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with default loading state', () => {
      const { result } = renderHook(() => useLoadingState())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBeUndefined()
    })

    it('should initialize with custom loading state', () => {
      const { result } = renderHook(() => useLoadingState(true))

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBeUndefined()
    })
  })

  describe('state setters', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useLoadingState())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })

    it('should update error state', () => {
      const { result } = renderHook(() => useLoadingState())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBe(null)
    })

    it('should update progress state', () => {
      const { result } = renderHook(() => useLoadingState())

      act(() => {
        result.current.setProgress(50)
      })

      expect(result.current.progress).toBe(50)

      act(() => {
        result.current.setProgress(undefined)
      })

      expect(result.current.progress).toBeUndefined()
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useLoadingState())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('should reset all state', () => {
      const { result } = renderHook(() => useLoadingState())

      act(() => {
        result.current.setLoading(true)
        result.current.setError('Test error')
        result.current.setProgress(75)
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe('Test error')
      expect(result.current.progress).toBe(75)

      act(() => {
        result.current.reset()
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.progress).toBeUndefined()
    })
  })

  describe('executeAsync', () => {
    it('should execute successful operation', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockResolvedValue('success')

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeAsync(mockOperation)
      })

      expect(mockOperation).toHaveBeenCalled()
      expect(operationResult).toBe('success')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle operation failure', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeAsync(mockOperation)
      })

      expect(mockOperation).toHaveBeenCalled()
      expect(operationResult).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Operation failed')
    })

    it('should show success toast when requested', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockResolvedValue('success')

      await act(async () => {
        await result.current.executeAsync(mockOperation, {
          showSuccessToast: true,
          successMessage: 'Operation completed'
        })
      })

      expect(mockToast.showSuccess).toHaveBeenCalledWith('Operation completed')
    })

    it('should show error toast by default', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      await act(async () => {
        await result.current.executeAsync(mockOperation)
      })

      expect(mockToast.showError).toHaveBeenCalledWith('Operation failed', 'Operation Failed', true)
    })

    it('should track progress when requested', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockResolvedValue('success')

      await act(async () => {
        await result.current.executeAsync(mockOperation, {
          trackProgress: true
        })
      })

      expect(mockToast.showLoading).toHaveBeenCalledWith('Processing...', 'Please wait')
    })

    it('should not log errors when disabled', async () => {
      const { result } = renderHook(() => useLoadingState())
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      await act(async () => {
        await result.current.executeAsync(mockOperation, {
          logErrors: false
        })
      })

      const { errorLoggingService } = await import('../services/errorLoggingService')
      expect(errorLoggingService.logError).not.toHaveBeenCalled()
    })
  })

  describe('executeMultiple', () => {
    it('should execute multiple operations successfully', async () => {
      const { result } = renderHook(() => useLoadingState())
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3')
      ]

      let results: any
      await act(async () => {
        results = await result.current.executeMultiple(operations)
      })

      expect(results).toEqual(['result1', 'result2', 'result3'])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle partial failures when stopOnError is false', async () => {
      const { result } = renderHook(() => useLoadingState())
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new Error('Operation 2 failed')),
        vi.fn().mockResolvedValue('result3')
      ]

      let results: any
      await act(async () => {
        results = await result.current.executeMultiple(operations, {
          stopOnError: false
        })
      })

      expect(results).toEqual(['result1', null, 'result3'])
      expect(result.current.loading).toBe(false)
    })

    it('should stop on first error when stopOnError is true', async () => {
      const { result } = renderHook(() => useLoadingState())
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new Error('Operation 2 failed')),
        vi.fn().mockResolvedValue('result3')
      ]

      let results: any
      await act(async () => {
        results = await result.current.executeMultiple(operations, {
          stopOnError: true
        })
      })

      expect(results).toEqual(['result1', null])
      expect(operations[2]).not.toHaveBeenCalled()
      expect(result.current.error).toBe('Operation 2 failed')
    })

    it('should update progress during execution', async () => {
      const { result } = renderHook(() => useLoadingState())
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2')
      ]

      await act(async () => {
        await result.current.executeMultiple(operations, {
          showProgressPercentage: true
        })
      })

      expect(mockToast.updateToast).toHaveBeenCalledWith('toast-id', {
        message: 'Processing operation 1/2...',
        progress: 50
      })
      expect(mockToast.updateToast).toHaveBeenCalledWith('toast-id', {
        message: 'Processing operation 2/2...',
        progress: 100
      })
    })
  })
})

describe('useMultipleLoadingStates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should manage multiple loading states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())

    // Initial state should be empty
    expect(result.current.states).toEqual({})
    expect(result.current.getState('key1')).toEqual({
      loading: false,
      error: null
    })

    // Set loading state for key1
    act(() => {
      result.current.setLoading('key1', true)
    })

    expect(result.current.getState('key1').loading).toBe(true)
    expect(result.current.isAnyLoading()).toBe(true)

    // Set error for key2
    act(() => {
      result.current.setError('key2', 'Error message')
    })

    expect(result.current.getState('key2').error).toBe('Error message')
    expect(result.current.hasAnyError()).toBe(true)

    // Set progress for key3
    act(() => {
      result.current.setProgress('key3', 75)
    })

    expect(result.current.getState('key3').progress).toBe(75)
  })

  it('should clear individual state', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())

    act(() => {
      result.current.setLoading('key1', true)
      result.current.setError('key1', 'Error')
      result.current.setProgress('key1', 50)
    })

    expect(result.current.getState('key1')).toEqual({
      loading: true,
      error: 'Error',
      progress: 50
    })

    act(() => {
      result.current.clearError('key1')
    })

    expect(result.current.getState('key1').error).toBe(null)

    act(() => {
      result.current.reset('key1')
    })

    expect(result.current.states.key1).toBeUndefined()
  })

  it('should reset all states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())

    act(() => {
      result.current.setLoading('key1', true)
      result.current.setError('key2', 'Error')
      result.current.setProgress('key3', 75)
    })

    expect(Object.keys(result.current.states)).toHaveLength(3)

    act(() => {
      result.current.resetAll()
    })

    expect(result.current.states).toEqual({})
    expect(result.current.isAnyLoading()).toBe(false)
    expect(result.current.hasAnyError()).toBe(false)
  })

  it('should correctly detect any loading or error states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates())

    expect(result.current.isAnyLoading()).toBe(false)
    expect(result.current.hasAnyError()).toBe(false)

    act(() => {
      result.current.setLoading('key1', true)
    })

    expect(result.current.isAnyLoading()).toBe(true)

    act(() => {
      result.current.setError('key2', 'Error')
    })

    expect(result.current.hasAnyError()).toBe(true)

    act(() => {
      result.current.setLoading('key1', false)
    })

    expect(result.current.isAnyLoading()).toBe(false)
    expect(result.current.hasAnyError()).toBe(true)
  })
})