import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import SyncStatusCard from '../SyncStatusCard'

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('SyncStatusCard', () => {
  const mockSyncStatus = {
    lastSyncTime: '2024-01-01T12:00:00Z',
    status: 'completed' as const,
    transactionsProcessed: 150,
    transactionsFailed: 2,
    duplicatesSkipped: 10,
    nextScheduledSync: '2024-01-02T12:00:00Z',
    queueDepth: 0
  }

  const mockQueueMetrics = [
    {
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/transactions-queue',
      queueName: 'transactions-queue',
      approximateNumberOfMessages: 5,
      approximateNumberOfMessagesNotVisible: 2,
      approximateAgeOfOldestMessage: 300, // 5 minutes
      lastModified: '2024-01-01T12:00:00Z'
    },
    {
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/transactions-dlq',
      queueName: 'transactions-dlq',
      approximateNumberOfMessages: 0,
      approximateNumberOfMessagesNotVisible: 0,
      lastModified: '2024-01-01T12:00:00Z'
    }
  ]

  const mockDeadLetterQueue = {
    hasMessages: false,
    messageCount: 0
  }

  const mockProcessingProgress = {
    totalMessages: 100,
    processingMessages: 10,
    queuedMessages: 20,
    estimatedCompletionTime: '2024-01-01T12:30:00Z',
    processingRate: 5.5
  }

  const mockOnRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current time for consistent relative time calculations
    vi.setSystemTime(new Date('2024-01-01T13:00:00Z'))
  })

  describe('rendering', () => {
    it('should render sync status with completed state', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Sync Status')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Last Sync: 1 hour ago')).toBeInTheDocument()
    })

    it('should render different status states correctly', () => {
      const runningStatus = { ...mockSyncStatus, status: 'running' as const }
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={runningStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Running')).toBeInTheDocument()
    })

    it('should render failed status with error message', () => {
      const failedStatus = {
        ...mockSyncStatus,
        status: 'failed' as const,
        errorMessage: 'API connection timeout'
      }
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={failedStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Failed')).toBeInTheDocument()
      expect(screen.getByText('API connection timeout')).toBeInTheDocument()
    })

    it('should render idle status', () => {
      const idleStatus = { ...mockSyncStatus, status: 'idle' as const }
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={idleStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Idle')).toBeInTheDocument()
    })
  })

  describe('progress tracking', () => {
    it('should show progress bar when sync is running', () => {
      const runningStatus = { ...mockSyncStatus, status: 'running' as const }
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={runningStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          processingProgress={mockProcessingProgress}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Processing Progress')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText('80 / 100 processed')).toBeInTheDocument()
      expect(screen.getByText(/ETA:/)).toBeInTheDocument()
    })

    it('should calculate progress percentage correctly', () => {
      const runningStatus = { ...mockSyncStatus, status: 'running' as const }
      const progress = {
        totalMessages: 50,
        processingMessages: 5,
        queuedMessages: 10, // 40 processed out of 50 total = 80%
        processingRate: 2.0
      }
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={runningStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          processingProgress={progress}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('40 / 50 processed')).toBeInTheDocument()
    })

    it('should not show progress bar when not running', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          processingProgress={mockProcessingProgress}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.queryByText('Processing Progress')).not.toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('queue metrics', () => {
    it('should display queue status information', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Queue Status')).toBeInTheDocument()
      expect(screen.getByText('Queued Messages')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // approximateNumberOfMessages
      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // approximateNumberOfMessagesNotVisible
    })

    it('should display oldest message age when available', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Oldest Message Age')).toBeInTheDocument()
      expect(screen.getByText('5m 0s')).toBeInTheDocument() // 300 seconds = 5 minutes
    })

    it('should display processing rate when available', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          processingProgress={mockProcessingProgress}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Processing Rate')).toBeInTheDocument()
      expect(screen.getByText('5.5 msg/min')).toBeInTheDocument()
    })

    it('should handle missing queue metrics gracefully', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={[]}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      // Should not show queue status section
      expect(screen.queryByText('Queue Status')).not.toBeInTheDocument()
    })
  })

  describe('transaction statistics', () => {
    it('should display transaction statistics', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Last Sync Statistics')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument() // transactionsProcessed
      expect(screen.getByText('Processed')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // duplicatesSkipped
      expect(screen.getByText('Skipped')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // transactionsFailed
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should use appropriate colors for statistics', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      // Find the processed count (should be green/success color)
      const processedElement = screen.getByText('150')
      expect(processedElement).toHaveClass('MuiTypography-root')
      
      // Find the failed count (should be red/error color)
      const failedElement = screen.getByText('2')
      expect(failedElement).toHaveClass('MuiTypography-root')
    })
  })

  describe('dead letter queue alerts', () => {
    it('should show alert when dead letter queue has messages', () => {
      const dlqWithMessages = {
        hasMessages: true,
        messageCount: 3,
        oldestMessageAge: 3600,
        sampleMessages: [
          {
            messageId: 'msg-1',
            body: 'Failed transaction',
            timestamp: '2024-01-01T11:00:00Z',
            errorReason: 'Invalid account ID'
          }
        ]
      }

      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={dlqWithMessages}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('3 failed messages in dead letter queue')).toBeInTheDocument()
      expect(screen.getByText('Latest error: Invalid account ID')).toBeInTheDocument()
    })

    it('should handle singular vs plural message count', () => {
      const dlqWithOneMessage = {
        hasMessages: true,
        messageCount: 1,
        sampleMessages: []
      }

      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={dlqWithOneMessage}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('1 failed message in dead letter queue')).toBeInTheDocument()
    })

    it('should not show alert when no dead letter queue messages', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.queryByText(/failed message.*in dead letter queue/)).not.toBeInTheDocument()
    })
  })

  describe('refresh functionality', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      const refreshButton = screen.getByRole('button', { name: /refresh status/i })
      await user.click(refreshButton)

      expect(mockOnRefresh).toHaveBeenCalledTimes(1)
    })

    it('should disable refresh button when loading', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
          loading={true}
        />
      )

      const refreshButton = screen.getByRole('button', { name: /refresh status/i })
      expect(refreshButton).toBeDisabled()
    })

    it('should handle missing onRefresh prop', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
        />
      )

      const refreshButton = screen.getByRole('button', { name: /refresh status/i })
      expect(refreshButton).toBeInTheDocument()
      // Should not throw when clicked without onRefresh
    })
  })

  describe('time formatting', () => {
    it('should format duration correctly', () => {
      const metricsWithLongAge = [{
        ...mockQueueMetrics[0],
        approximateAgeOfOldestMessage: 7265 // 2h 1m 5s
      }]

      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={metricsWithLongAge}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('2h 1m 5s')).toBeInTheDocument()
    })

    it('should format short durations correctly', () => {
      const metricsWithShortAge = [{
        ...mockQueueMetrics[0],
        approximateAgeOfOldestMessage: 45 // 45 seconds
      }]

      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={metricsWithShortAge}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('45s')).toBeInTheDocument()
    })

    it('should handle relative timestamps correctly', () => {
      // Test with different time differences
      const recentSyncStatus = {
        ...mockSyncStatus,
        lastSyncTime: '2024-01-01T12:55:00Z' // 5 minutes ago
      }

      renderWithTheme(
        <SyncStatusCard
          syncStatus={recentSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Last Sync: 5 minutes ago')).toBeInTheDocument()
    })

    it('should handle never synced state', () => {
      const neverSyncedStatus = {
        ...mockSyncStatus,
        lastSyncTime: undefined
      }

      renderWithTheme(
        <SyncStatusCard
          syncStatus={neverSyncedStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByText('Last Sync: Never')).toBeInTheDocument()
    })
  })

  describe('status icons', () => {
    it('should show correct icon for each status', () => {
      const statuses = [
        { status: 'completed' as const, iconTestId: 'CheckCircleIcon' },
        { status: 'failed' as const, iconTestId: 'ErrorIcon' },
        { status: 'running' as const, iconTestId: 'PlayArrowIcon' },
        { status: 'idle' as const, iconTestId: 'PauseIcon' }
      ]

      statuses.forEach(({ status, iconTestId }) => {
        const { unmount } = renderWithTheme(
          <SyncStatusCard
            syncStatus={{ ...mockSyncStatus, status }}
            queueMetrics={mockQueueMetrics}
            deadLetterQueue={mockDeadLetterQueue}
            onRefresh={mockOnRefresh}
          />
        )

        expect(screen.getByTestId(iconTestId)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByRole('heading', { name: 'Sync Status' })).toBeInTheDocument()
    })

    it('should have accessible button labels', () => {
      renderWithTheme(
        <SyncStatusCard
          syncStatus={mockSyncStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByRole('button', { name: /refresh status/i })).toBeInTheDocument()
    })

    it('should have proper alert roles for errors', () => {
      const failedStatus = {
        ...mockSyncStatus,
        status: 'failed' as const,
        errorMessage: 'Sync failed'
      }

      renderWithTheme(
        <SyncStatusCard
          syncStatus={failedStatus}
          queueMetrics={mockQueueMetrics}
          deadLetterQueue={mockDeadLetterQueue}
          onRefresh={mockOnRefresh}
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})