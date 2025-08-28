import { ParameterStoreServiceImpl } from '../parameterStoreService';
import { SSMClient } from '@aws-sdk/client-ssm';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-ssm');

const mockSend = jest.fn();
const mockSSMClient = SSMClient as jest.MockedClass<typeof SSMClient>;

mockSSMClient.prototype.send = mockSend;

describe('ParameterStoreServiceImpl', () => {
  let service: ParameterStoreServiceImpl;

  beforeEach(() => {
    service = new ParameterStoreServiceImpl();
    jest.clearAllMocks();
  });

  describe('getAccountMapping', () => {
    it('should return parsed account mapping when parameter exists', async () => {
      const mockMapping = {
        mappings: { '123': '456' },
        strict_mode: true,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: JSON.stringify(mockMapping)
        }
      });

      const result = await service.getAccountMapping();

      expect(result).toEqual(mockMapping);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return default configuration when parameter does not exist', async () => {
      const error = new Error('Parameter not found');
      (error as any).name = 'ParameterNotFound';
      mockSend.mockRejectedValueOnce(error);

      const result = await service.getAccountMapping();

      expect(result).toEqual({
        mappings: {},
        strict_mode: false,
        created_at: expect.any(String),
        auto_generated: true
      });
    });

    it('should return default configuration when parameter value is empty', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: ''
        }
      });

      const result = await service.getAccountMapping();

      expect(result).toEqual({
        mappings: {},
        strict_mode: false,
        created_at: expect.any(String),
        auto_generated: true
      });
    });
  });

  describe('updateAccountMapping', () => {
    it('should update account mapping with timestamp', async () => {
      const config = {
        mappings: { '123': '456' },
        strict_mode: true
      };

      mockSend.mockResolvedValueOnce({});

      await service.updateAccountMapping(config);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCredentials', () => {
    it('should return all credentials when they exist', async () => {
      mockSend
        .mockResolvedValueOnce({ Parameter: { Value: 'pocketsmith-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'ynab-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'budget-id' } });

      const result = await service.getCredentials();

      expect(result).toEqual({
        pocketsmithApiKey: 'pocketsmith-key',
        ynabApiKey: 'ynab-key',
        ynabBudgetId: 'budget-id'
      });
    });

    it('should throw error when credentials are missing', async () => {
      mockSend
        .mockResolvedValueOnce({ Parameter: { Value: 'pocketsmith-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: '' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'budget-id' } });

      await expect(service.getCredentials()).rejects.toThrow('Missing required API credentials');
    });
  });

  describe('validateCredentials', () => {
    it('should return valid result when all credentials are present and valid', async () => {
      mockSend
        .mockResolvedValueOnce({ Parameter: { Value: 'valid-pocketsmith-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'valid-ynab-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: '12345678-1234-1234-1234-123456789abc' } });

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result when credentials are missing', async () => {
      mockSend
        .mockResolvedValueOnce({ Parameter: { Value: '' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'ynab-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'budget-id' } });

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to retrieve credentials: Missing required API credentials in Parameter Store');
    });

    it('should return invalid result when credential formats are invalid', async () => {
      mockSend
        .mockResolvedValueOnce({ Parameter: { Value: 'valid-key' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'invalid key with spaces!' } })
        .mockResolvedValueOnce({ Parameter: { Value: 'not-a-uuid' } });

      const result = await service.validateCredentials();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('YNAB API key format appears invalid');
      expect(result.errors).toContain('YNAB Budget ID format appears invalid (should be UUID format)');
    });
  });
});