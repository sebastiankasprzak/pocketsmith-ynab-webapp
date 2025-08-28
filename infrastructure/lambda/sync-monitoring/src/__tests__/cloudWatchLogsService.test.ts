import { CloudWatchLogsService } from '../cloudWatchLogsService';
import { EXISTING_LOG_GROUPS } from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch-logs');

describe('CloudWatchLogsService', () => {
  let service: CloudWatchLogsService;

  beforeEach(() => {
    service = new CloudWatchLogsService('us-east-1');
  });

  describe('parseLogMessage', () => {
    it('should parse JSON log messages', () => {
      const message = '{"level":"INFO","message":"Test message","requestId":"123","transactionCount":5}';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      // Access private method for testing
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed).toEqual({
        timestamp,
        level: 'INFO',
        message: 'Test message',
        requestId: '123',
        transactionCount: 5,
        errorDetails: undefined,
        duration: undefined,
      });
    });

    it('should parse Lambda request start messages', () => {
      const message = 'START RequestId: abc-123-def Version: $LATEST';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed.requestId).toBe('abc-123-def');
      expect(parsed.level).toBe('INFO');
    });

    it('should parse Lambda report messages with duration', () => {
      const message = 'REPORT RequestId: abc-123-def Duration: 1234.56 ms Billed Duration: 1235 ms';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed.requestId).toBe('abc-123-def');
      expect(parsed.duration).toBe(1234.56);
    });

    it('should parse transaction count messages', () => {
      const message = 'Fetched 42 transactions from PocketSmith';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed.transactionCount).toBe(42);
      expect(parsed.level).toBe('INFO');
    });

    it('should parse error messages', () => {
      const message = 'ERROR: Failed to process transaction: Invalid data format';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed.level).toBe('ERROR');
      expect(parsed.errorDetails).toBe('Failed to process transaction: Invalid data format');
    });

    it('should handle malformed JSON gracefully', () => {
      const message = '{"invalid": json}';
      const timestamp = '2023-01-01T00:00:00.000Z';
      
      const parsed = (service as any).parseLogMessage(message, timestamp);
      
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('{"invalid": json}');
    });
  });

  describe('createSyncHistoryEntry', () => {
    it('should create sync history entry from log events', () => {
      const requestId = 'test-request-123';
      const events = [
        {
          timestamp: 1640995200000, // 2022-01-01 00:00:00
          message: 'START RequestId: test-request-123',
          ingestionTime: 1640995200000,
          eventId: 'event1',
        },
        {
          timestamp: 1640995210000, // 2022-01-01 00:00:10
          message: 'Fetched 10 transactions from PocketSmith',
          ingestionTime: 1640995210000,
          eventId: 'event2',
        },
        {
          timestamp: 1640995220000, // 2022-01-01 00:00:20
          message: 'Processed 8 transactions successfully',
          ingestionTime: 1640995220000,
          eventId: 'event3',
        },
        {
          timestamp: 1640995225000, // 2022-01-01 00:00:25
          message: 'REPORT RequestId: test-request-123 Duration: 25000.00 ms',
          ingestionTime: 1640995225000,
          eventId: 'event4',
        },
      ];

      const entry = (service as any).createSyncHistoryEntry(requestId, events, EXISTING_LOG_GROUPS.TRANSACTION_FETCHER);

      expect(entry).toEqual({
        timestamp: '2022-01-01T00:00:00.000Z',
        requestId: 'test-request-123',
        status: 'success',
        transactionsFetched: 10,
        transactionsProcessed: 8,
        transactionsFailed: 0,
        duplicatesSkipped: 0,
        duration: 25000,
        errorDetails: undefined,
        logGroupName: EXISTING_LOG_GROUPS.TRANSACTION_FETCHER,
        logStreamName: 'aggregated',
      });
    });

    it('should mark entry as failed when errors are present', () => {
      const requestId = 'test-request-456';
      const events = [
        {
          timestamp: 1640995200000,
          message: 'START RequestId: test-request-456',
          ingestionTime: 1640995200000,
          eventId: 'event1',
        },
        {
          timestamp: 1640995210000,
          message: 'ERROR: API rate limit exceeded',
          ingestionTime: 1640995210000,
          eventId: 'event2',
        },
      ];

      const entry = (service as any).createSyncHistoryEntry(requestId, events, EXISTING_LOG_GROUPS.TRANSACTION_FETCHER);

      expect(entry?.status).toBe('failed');
      expect(entry?.errorDetails).toEqual(['API rate limit exceeded']);
    });
  });

  describe('getCurrentSyncStatus', () => {
    it('should return idle status when no recent history', async () => {
      // Mock getSyncHistory to return empty array
      jest.spyOn(service, 'getSyncHistory').mockResolvedValue([]);

      const status = await service.getCurrentSyncStatus();

      expect(status).toEqual({
        status: 'idle',
        transactionsProcessed: 0,
        transactionsFailed: 0,
        duplicatesSkipped: 0,
      });
    });

    it('should return completed status for recent successful sync', async () => {
      const mockHistory = [{
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        requestId: 'test-123',
        status: 'success' as const,
        transactionsFetched: 10,
        transactionsProcessed: 10,
        transactionsFailed: 0,
        duplicatesSkipped: 2,
        duration: 5000,
        logGroupName: EXISTING_LOG_GROUPS.TRANSACTION_FETCHER,
        logStreamName: 'test-stream',
      }];

      jest.spyOn(service, 'getSyncHistory').mockResolvedValue(mockHistory);

      const status = await service.getCurrentSyncStatus();

      expect(status.status).toBe('completed');
      expect(status.transactionsProcessed).toBe(10);
      expect(status.duplicatesSkipped).toBe(2);
    });

    it('should return running status for very recent sync without duration', async () => {
      const mockHistory = [{
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        requestId: 'test-123',
        status: 'success' as const,
        transactionsFetched: 0,
        transactionsProcessed: 0,
        transactionsFailed: 0,
        duplicatesSkipped: 0,
        duration: 0, // No duration indicates still running
        logGroupName: EXISTING_LOG_GROUPS.TRANSACTION_FETCHER,
        logStreamName: 'test-stream',
      }];

      jest.spyOn(service, 'getSyncHistory').mockResolvedValue(mockHistory);

      const status = await service.getCurrentSyncStatus();

      expect(status.status).toBe('running');
    });
  });
});