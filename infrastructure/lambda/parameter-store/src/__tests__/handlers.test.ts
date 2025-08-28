import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler, getMappingsHandler, updateMappingsHandler, validateCredentialsHandler, getCredentialsInfoHandler } from '../handlers';

// Mock the ParameterStoreServiceImpl
jest.mock('../parameterStoreService');

const mockParameterStoreService = {
  getAccountMapping: jest.fn(),
  updateAccountMapping: jest.fn(),
  getCredentials: jest.fn(),
  validateCredentials: jest.fn()
};

// Mock the module
jest.doMock('../parameterStoreService', () => ({
  ParameterStoreServiceImpl: jest.fn(() => mockParameterStoreService)
}));

describe('Parameter Store Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (path: string, method: string, body?: string): APIGatewayProxyEvent => ({
    path,
    httpMethod: method,
    body: body || null,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    isBase64Encoded: false
  });

  describe('getMappingsHandler', () => {
    it('should return account mappings successfully', async () => {
      const mockMapping = {
        mappings: { '123': '456' },
        strict_mode: true,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockParameterStoreService.getAccountMapping.mockResolvedValueOnce(mockMapping);

      const event = createMockEvent('/mappings', 'GET');
      const result = await getMappingsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        data: mockMapping
      });
    });

    it('should handle errors gracefully', async () => {
      mockParameterStoreService.getAccountMapping.mockRejectedValueOnce(new Error('Test error'));

      const event = createMockEvent('/mappings', 'GET');
      const result = await getMappingsHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Failed to retrieve account mappings',
        details: 'Test error'
      });
    });
  });

  describe('updateMappingsHandler', () => {
    it('should update account mappings successfully', async () => {
      const requestBody = {
        mappings: { '123': '456' },
        strict_mode: true
      };

      mockParameterStoreService.updateAccountMapping.mockResolvedValueOnce(undefined);

      const event = createMockEvent('/mappings', 'POST', JSON.stringify(requestBody));
      const result = await updateMappingsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        message: 'Account mappings updated successfully',
        data: expect.objectContaining({
          mappings: { '123': '456' },
          strict_mode: true
        })
      });
    });

    it('should return 400 for missing request body', async () => {
      const event = createMockEvent('/mappings', 'POST');
      const result = await updateMappingsHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Request body is required'
      });
    });

    it('should return 400 for invalid request body', async () => {
      const event = createMockEvent('/mappings', 'POST', JSON.stringify({ invalid: 'data' }));
      const result = await updateMappingsHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Invalid request body: mappings object is required'
      });
    });
  });

  describe('validateCredentialsHandler', () => {
    it('should return validation results successfully', async () => {
      const mockValidation = {
        isValid: true,
        errors: []
      };

      mockParameterStoreService.validateCredentials.mockResolvedValueOnce(mockValidation);

      const event = createMockEvent('/credentials/validate', 'GET');
      const result = await validateCredentialsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        data: mockValidation
      });
    });
  });

  describe('getCredentialsInfoHandler', () => {
    it('should return credentials info without exposing actual values', async () => {
      const mockCredentials = {
        pocketsmithApiKey: 'secret-key',
        ynabApiKey: 'secret-key',
        ynabBudgetId: 'budget-id'
      };

      mockParameterStoreService.getCredentials.mockResolvedValueOnce(mockCredentials);

      const event = createMockEvent('/credentials', 'GET');
      const result = await getCredentialsInfoHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        data: {
          pocketsmithApiKey: '***configured***',
          ynabApiKey: '***configured***',
          ynabBudgetId: '***configured***'
        }
      });
    });
  });

  describe('main handler routing', () => {
    it('should route GET /mappings correctly', async () => {
      mockParameterStoreService.getAccountMapping.mockResolvedValueOnce({
        mappings: {},
        strict_mode: false
      });

      const event = createMockEvent('/mappings', 'GET');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockParameterStoreService.getAccountMapping).toHaveBeenCalled();
    });

    it('should route POST /mappings correctly', async () => {
      mockParameterStoreService.updateAccountMapping.mockResolvedValueOnce(undefined);

      const event = createMockEvent('/mappings', 'POST', JSON.stringify({
        mappings: { '123': '456' },
        strict_mode: true
      }));
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockParameterStoreService.updateAccountMapping).toHaveBeenCalled();
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const event = createMockEvent('/mappings', 'OPTIONS');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ message: 'CORS preflight' });
    });

    it('should return 404 for unknown endpoints', async () => {
      const event = createMockEvent('/unknown', 'GET');
      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Endpoint not found',
        path: '/unknown',
        method: 'GET'
      });
    });
  });
});