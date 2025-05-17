import { HmrcAuthService, TokenResponse } from '../hmrcAuthService';
import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockImplementation((funcName, params) => {
      if (funcName === 'get_decrypted_refresh_token') {
        return { data: 'mock-refresh-token', error: null };
      } else if (funcName === 'get_decrypted_access_token') {
        return { data: 'mock-access-token', error: null };
      }
      return { data: null, error: new Error('Unknown RPC function') };
    })
  }
}));

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

describe('HmrcAuthService', () => {
  let service: HmrcAuthService;
  let mockSuccessTokenResponse: TokenResponse;
  let mockErrorTokenResponse: any;
  
  beforeEach(() => {
    // Reset fetch mocks
    mockFetch.mockReset();
    
    // Create instance of service
    service = new HmrcAuthService();
    
    // Set up mock responses
    mockSuccessTokenResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read:self-assessment write:self-assessment'
    };
    
    mockErrorTokenResponse = {
      error: 'invalid_grant',
      error_description: 'Refresh token expired or revoked'
    };
    
    // Mock environment variables
    vi.stubEnv('HMRC_CLIENT_ID', 'test-client-id');
    vi.stubEnv('HMRC_CLIENT_SECRET', 'test-client-secret');
    vi.stubEnv('HMRC_REDIRECT_URI', 'http://localhost:3000/callback');
    vi.stubEnv('HMRC_TOKEN_URL', 'https://test-api.service.hmrc.gov.uk/oauth/token');
  });
  
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  
  describe('refreshToken', () => {
    it('should successfully refresh a token', async () => {
      // Mock successful token refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessTokenResponse
      });
      
      // Call the method
      const result = await service.refreshToken(mockUserId);
      
      // Verify the result
      expect(result).toEqual(mockSuccessTokenResponse);
      
      // Verify correct parameters were sent to token endpoint
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('/oauth/token');
      
      const body = mockFetch.mock.calls[0][1].body;
      expect(body).toContain('grant_type=refresh_token');
      expect(body).toContain('refresh_token=mock-refresh-token');
    });
    
    it('should handle refresh token not found error', async () => {
      // Mock error from database
      vi.mocked(supabase.rpc).mockReturnValueOnce({ data: null, error: new Error('Token not found') });
      
      // Call the method
      const result = await service.refreshToken(mockUserId);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify no fetch call was made
      expect(mockFetch).not.toHaveBeenCalled();
    });
    
    it('should handle invalid_grant error from HMRC', async () => {
      // Mock invalid_grant error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'invalid_grant', error_description: 'Refresh token expired' })
      });
      
      // Mock clearTokens function
      const clearTokensSpy = vi.spyOn(service as any, 'clearTokens').mockResolvedValueOnce(undefined);
      
      // Call the method
      const result = await service.refreshToken(mockUserId);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify clearTokens was called
      expect(clearTokensSpy).toHaveBeenCalledWith(mockUserId);
    });
    
    it('should retry on server_error with exponential backoff', async () => {
      // Mock setTimeout to avoid actual waiting
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((cb) => {
        cb();
        return 1;
      });
      
      try {
        // Mock server_error first, then success
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'server_error', error_description: 'Service unavailable' })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockSuccessTokenResponse
          });
        
        // Call the method
        const result = await service.refreshToken(mockUserId);
        
        // Verify the result
        expect(result).toEqual(mockSuccessTokenResponse);
        
        // Verify fetch was called twice
        expect(mockFetch).toHaveBeenCalledTimes(2);
        
        // Verify setTimeout was called with backoff
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
    
    it('should give up after max retries', async () => {
      // Mock setTimeout to avoid actual waiting
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((cb) => {
        cb();
        return 1;
      });
      
      try {
        // Mock server_error for all calls
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'server_error', error_description: 'Service unavailable' })
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'server_error', error_description: 'Service unavailable' })
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'server_error', error_description: 'Service unavailable' })
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'server_error', error_description: 'Service unavailable' })
          });
        
        // Call the method
        const result = await service.refreshToken(mockUserId);
        
        // Verify the result
        expect(result).toBeNull();
        
        // Verify fetch was called the max number of times (3 retries + initial attempt = 4)
        expect(mockFetch).toHaveBeenCalledTimes(4);
        
        // Verify setTimeout was called with exponential backoff
        expect(global.setTimeout).toHaveBeenCalledTimes(3);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute API call successfully on first try', async () => {
      // Mock getValidToken to return a valid token
      vi.spyOn(service, 'getValidToken').mockResolvedValueOnce('valid-token');
      
      // Create a mock API call function
      const mockApiCall = vi.fn().mockResolvedValueOnce({ data: 'success' });
      
      // Call executeWithRetry
      const result = await service.executeWithRetry(mockUserId, mockApiCall);
      
      // Verify result
      expect(result).toEqual({ data: 'success' });
      
      // Verify the API call was made with the right token
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('valid-token');
    });
    
    it('should refresh token and retry on auth error', async () => {
      // Mock getValidToken to return a valid token
      vi.spyOn(service, 'getValidToken')
        .mockResolvedValueOnce('expired-token')
        .mockResolvedValueOnce('new-token');
      
      // Mock refreshToken to succeed
      vi.spyOn(service, 'refreshToken').mockResolvedValueOnce(mockSuccessTokenResponse);
      
      // Create a mock API call function that fails with auth error first, then succeeds
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce(new Error('401 Unauthorized'))
        .mockResolvedValueOnce({ data: 'success after retry' });
      
      // Call executeWithRetry
      const result = await service.executeWithRetry(mockUserId, mockApiCall);
      
      // Verify result
      expect(result).toEqual({ data: 'success after retry' });
      
      // Verify the API call was made twice with different tokens
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(mockApiCall).toHaveBeenNthCalledWith(1, 'expired-token');
      expect(mockApiCall).toHaveBeenNthCalledWith(2, 'new-token');
      
      // Verify refreshToken was called
      expect(service.refreshToken).toHaveBeenCalledTimes(1);
    });
    
    it('should not retry non-auth errors', async () => {
      // Mock getValidToken to return a valid token
      vi.spyOn(service, 'getValidToken').mockResolvedValueOnce('valid-token');
      
      // Create a mock API call function that fails with non-auth error
      const mockApiCall = vi.fn().mockRejectedValueOnce(new Error('400 Bad Request'));
      
      // Call executeWithRetry and expect it to throw
      await expect(service.executeWithRetry(mockUserId, mockApiCall)).rejects.toThrow('400 Bad Request');
      
      // Verify the API call was made only once
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });
    
    it('should respect maxRetries parameter', async () => {
      // Mock getValidToken to always return a valid token
      vi.spyOn(service, 'getValidToken').mockResolvedValue('token');
      
      // Mock refreshToken to succeed
      vi.spyOn(service, 'refreshToken').mockResolvedValue(mockSuccessTokenResponse);
      
      // Create a mock API call function that always fails with auth error
      const mockApiCall = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));
      
      // Set maxRetries to 2
      const maxRetries = 2;
      
      // Call executeWithRetry and expect it to throw after maxRetries
      await expect(service.executeWithRetry(mockUserId, mockApiCall, maxRetries)).rejects.toThrow('401 Unauthorized');
      
      // Verify the API call was made maxRetries + 1 times (initial try + retries)
      expect(mockApiCall).toHaveBeenCalledTimes(maxRetries + 1);
      
      // Verify refreshToken was called maxRetries times
      expect(service.refreshToken).toHaveBeenCalledTimes(maxRetries);
    });
  });
  
  describe('getValidToken', () => {
    it('should return a valid token without refreshing', async () => {
      // Mock database response for checking expiration
      vi.mocked(supabase.from().select().eq().single).mockResolvedValueOnce({
        data: { expires_at: new Date(Date.now() + 3600000).toISOString() }, // expires in 1 hour
        error: null
      });
      
      // Call the method
      const token = await service.getValidToken(mockUserId);
      
      // Verify token was returned
      expect(token).toBe('mock-access-token');
      
      // Verify refreshToken was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });
    
    it('should refresh an expired token', async () => {
      // Mock database response for checking expiration
      vi.mocked(supabase.from().select().eq().single).mockResolvedValueOnce({
        data: { expires_at: new Date(Date.now() - 3600000).toISOString() }, // expired 1 hour ago
        error: null
      });
      
      // Mock refreshToken method to return new tokens
      vi.spyOn(service, 'refreshToken').mockResolvedValueOnce(mockSuccessTokenResponse);
      
      // Call the method
      const token = await service.getValidToken(mockUserId);
      
      // Verify new token was returned
      expect(token).toBe(mockSuccessTokenResponse.access_token);
      
      // Verify refreshToken was called
      expect(service.refreshToken).toHaveBeenCalledWith(mockUserId);
    });
    
    it('should handle no token found', async () => {
      // Mock database response for no token
      vi.mocked(supabase.from().select().eq().single).mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      // Call the method
      const token = await service.getValidToken(mockUserId);
      
      // Verify null was returned
      expect(token).toBeNull();
    });
  });
});

// Restore global fetch after tests
afterEach(() => {
  global.fetch = originalFetch;
}); 