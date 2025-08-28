import { ParameterStoreService } from '../parameterStoreService';
import { SSM } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockSSM = {
  getParameter: jest.fn()
};

(SSM as jest.MockedClass<typeof SSM>).mockImplementation(() => mockSSM as any);

describe('ParameterStoreService', () => {
  let service: ParameterStoreService;

  beforeEach(() => {
    service = new ParameterStoreService();
    jest.clearAllMocks();
  });

  describe('getParameter', () => {
    it('should return parameter value when parameter exists', async () => {
      const mockValue = 'test-value';
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.resolve({
          Parameter: {
            Value: mockValue
          }
        })
      });

      const result = await service.getParameter('/test/parameter');

      expect(result).toBe(mockValue);
      expect(mockSSM.getParameter).toHaveBeenCalledWith({
        Name: '/test/parameter',
        WithDecryption: true
      });
    });

    it('should throw error when parameter not found', async () => {
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.resolve({
          Parameter: {}
        })
      });

      await expect(service.getParameter('/test/parameter')).rejects.toThrow(
        'Parameter /test/parameter not found or has no value'
      );
    });

    it('should throw error when SSM call fails', async () => {
      const error = new Error('SSM error');
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.reject(error)
      });

      await expect(service.getParameter('/test/parameter')).rejects.toThrow(
        'Failed to fetch parameter /test/parameter: SSM error'
      );
    });
  });

  describe('getPocketSmithApiKey', () => {
    it('should call getParameter with correct path', async () => {
      const mockValue = 'ps-api-key';
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.resolve({
          Parameter: {
            Value: mockValue
          }
        })
      });

      const result = await service.getPocketSmithApiKey();

      expect(result).toBe(mockValue);
      expect(mockSSM.getParameter).toHaveBeenCalledWith({
        Name: '/pocketsmith-ynab-sync/pocketsmith-api-key',
        WithDecryption: true
      });
    });
  });

  describe('getYNABApiKey', () => {
    it('should call getParameter with correct path', async () => {
      const mockValue = 'ynab-api-key';
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.resolve({
          Parameter: {
            Value: mockValue
          }
        })
      });

      const result = await service.getYNABApiKey();

      expect(result).toBe(mockValue);
      expect(mockSSM.getParameter).toHaveBeenCalledWith({
        Name: '/pocketsmith-ynab-sync/ynab-api-key',
        WithDecryption: true
      });
    });
  });

  describe('getYNABBudgetId', () => {
    it('should call getParameter with correct path', async () => {
      const mockValue = 'ynab-budget-id';
      mockSSM.getParameter.mockReturnValue({
        promise: () => Promise.resolve({
          Parameter: {
            Value: mockValue
          }
        })
      });

      const result = await service.getYNABBudgetId();

      expect(result).toBe(mockValue);
      expect(mockSSM.getParameter).toHaveBeenCalledWith({
        Name: '/pocketsmith-ynab-sync/ynab-budget-id',
        WithDecryption: true
      });
    });
  });
});