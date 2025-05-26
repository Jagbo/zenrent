/**
 * Unit tests for HMRC API Client service
 * Tests connection handling, error recovery, and API interactions
 */

import { HmrcApiClient } from '../hmrcApiClient';

// Mock fetch globally
global.fetch = jest.fn();

// Mock HmrcAuthService
jest.mock('../hmrcAuthService', () => ({
  HmrcAuthService: {
    getInstance: jest.fn(() => ({
      executeWithRetry: jest.fn().mockResolvedValue('mock-token'),
      clearTokens: jest.fn()
    }))
  }
}));

describe('HmrcApiClient', () => {
  let client: HmrcApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new HmrcApiClient();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Self Assessment API', () => {
    it('should get self assessment data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          taxYear: '2023-24',
          totalIncome: 50000,
          totalTax: 10000
        })
      } as Response);

      const result = await client.getSelfAssessment('user123', '2023-24');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        taxYear: '2023-24',
        totalIncome: 50000,
        totalTax: 10000
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/individuals/self-assessment/api/v1.0/2023-24'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        })
      } as Response);

      const result = await client.getSelfAssessment('user123', '2023-24');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
      expect(result.retryable).toBe(true);
    });

    it('should handle rate limiting errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        })
      } as Response);

      const result = await client.getSelfAssessment('user123', '2023-24');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many requests');
      expect(result.retryable).toBe(true);
    });
  });

  describe('Income Submission API', () => {
    it('should submit income data successfully', async () => {
      const incomeData = {
        totalIncome: 50000,
        propertyIncome: 20000,
        expenses: 5000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submissionId: 'sub123',
          status: 'accepted'
        })
      } as Response);

      const result = await client.submitIncome('user123', '2023-24', incomeData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        submissionId: 'sub123',
        status: 'accepted'
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/individuals/income/api/v1.0/2023-24/submit'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(incomeData)
        })
      );
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: 'INVALID_REQUEST',
          message: 'Invalid income data format'
        })
      } as Response);

      const result = await client.submitIncome('user123', '2023-24', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data');
      expect(result.retryable).toBe(false);
    });
  });

  describe('Tax Obligations API', () => {
    it('should get tax obligations successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          obligations: [
            {
              obligationType: 'ITSA',
              dueDate: '2024-01-31',
              status: 'Open'
            }
          ]
        })
      } as Response);

      const result = await client.getTaxObligations('user123');

      expect(result.success).toBe(true);
      expect(result.data.obligations).toHaveLength(1);
      expect(result.data.obligations[0].obligationType).toBe('ITSA');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should retry on network errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response);

      const result = await client.getSelfAssessment('user123', '2023-24');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: 'INVALID_REQUEST',
          message: 'Bad request'
        })
      } as Response);

      const result = await client.getSelfAssessment('user123', '2023-24');

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should use fallback mechanisms when available', async () => {
      // Mock all requests to fail
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const result = await client.getSelfAssessment('user123', '2023-24');

      // Should still return a result (from fallback)
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('Circuit Breaker', () => {
    it('should provide circuit breaker status', () => {
      const status = client.getCircuitBreakerStatus();

      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('failureCount');
      expect(status).toHaveProperty('successCount');
    });

    it('should reset circuit breaker', () => {
      expect(() => client.resetCircuitBreaker()).not.toThrow();
    });
  });

  describe('Request Headers', () => {
    it('should include required HMRC headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      } as Response);

      await client.getSelfAssessment('user123', '2023-24');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Authorization': 'Bearer mock-token',
            'User-Agent': expect.stringContaining('ZenRent'),
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER'
          })
        })
      );
    });

    it('should include fraud prevention headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      } as Response);

      await client.getSelfAssessment('user123', '2023-24');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Gov-Client-Device-ID': expect.any(String),
            'Gov-Client-User-IDs': expect.stringContaining('user123'),
            'Gov-Client-Timezone': 'UTC+00:00'
          })
        })
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      expect(() => client.cleanup()).not.toThrow();
    });
  });
}); 