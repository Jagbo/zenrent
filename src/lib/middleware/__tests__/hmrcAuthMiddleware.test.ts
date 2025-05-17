import { NextRequest, NextResponse } from 'next/server';
import { hmrcAuthMiddleware, withHmrcAuth } from '../hmrcAuthMiddleware';
import { HmrcAuthService } from '../../services/hmrc/hmrcAuthService';
import { HmrcErrorHandler } from '../../services/hmrc/hmrcErrorHandler';

// Mock dependencies
jest.mock('../../services/hmrc/hmrcAuthService');
jest.mock('../../services/hmrc/hmrcErrorHandler');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockImplementation((token) => {
        if (token === 'valid-token') {
          return { data: { user: { id: 'test-user-id' } }, error: null };
        }
        return { data: { user: null }, error: { message: 'Invalid token' } };
      }),
    },
  })),
}));

// Mock NextRequest and NextResponse
const mockNextRequest = (cookies = {}, headers = {}) => {
  const cookieStore = {
    get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
  };
  
  return {
    cookies: cookieStore,
    headers: new Headers(headers),
    url: 'https://example.com/api/hmrc/test',
    method: 'GET',
    body: null,
    redirect: 'follow',
    signal: {} as AbortSignal,
    clone: jest.fn().mockReturnThis(),
  } as unknown as NextRequest;
};

// Mock HmrcAuthService
const mockHmrcAuthService = {
  getInstance: jest.fn(),
  ensureInitialized: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn(),
  getValidToken: jest.fn(),
  getAccessToken: jest.fn(),
};

// Mock HmrcErrorHandler
const mockHmrcErrorHandler = {
  getInstance: jest.fn(),
  handleError: jest.fn(),
};

describe('HMRC Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (HmrcAuthService.getInstance as jest.Mock).mockReturnValue(mockHmrcAuthService);
    (HmrcErrorHandler.getInstance as jest.Mock).mockReturnValue(mockHmrcErrorHandler);
    
    // Setup NextResponse mock
    jest.spyOn(NextResponse, 'json').mockImplementation((body, options) => {
      return { body, options } as unknown as NextResponse;
    });
    
    jest.spyOn(NextResponse, 'next').mockImplementation((options) => {
      return { ...options } as unknown as NextResponse;
    });
  });
  
  describe('hmrcAuthMiddleware', () => {
    test('should return 401 when user is not authenticated', async () => {
      const request = mockNextRequest();
      
      const response = await hmrcAuthMiddleware(request);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 }
      );
    });
    
    test('should return 401 when user is not connected to HMRC', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      mockHmrcAuthService.isConnected.mockResolvedValue(false);
      
      const response = await hmrcAuthMiddleware(request);
      
      expect(mockHmrcAuthService.isConnected).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'HMRC authorization required', code: 'HMRC_AUTH_REQUIRED' },
        { status: 401 }
      );
    });
    
    test('should continue without auth when requireAuth is false', async () => {
      const request = mockNextRequest();
      
      const response = await hmrcAuthMiddleware(request, { requireAuth: false });
      
      expect(NextResponse.json).not.toHaveBeenCalled();
      expect(response).toBeNull();
    });
    
    test('should attach token to request when user is authenticated with HMRC', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      mockHmrcAuthService.isConnected.mockResolvedValue(true);
      mockHmrcAuthService.getValidToken.mockResolvedValue('hmrc-access-token');
      
      const response = await hmrcAuthMiddleware(request);
      
      expect(mockHmrcAuthService.getValidToken).toHaveBeenCalledWith('test-user-id');
      expect(NextResponse.next).toHaveBeenCalled();
      
      // Check that the request was modified with the token
      const nextOptions = (NextResponse.next as jest.Mock).mock.calls[0][0];
      expect(nextOptions.request.headers.get('Authorization')).toBe('Bearer hmrc-access-token');
    });
    
    test('should not refresh token when refreshToken is false', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      mockHmrcAuthService.isConnected.mockResolvedValue(true);
      mockHmrcAuthService.getAccessToken.mockResolvedValue('hmrc-access-token');
      
      await hmrcAuthMiddleware(request, { refreshToken: false });
      
      expect(mockHmrcAuthService.getValidToken).not.toHaveBeenCalled();
      expect(mockHmrcAuthService.getAccessToken).toHaveBeenCalledWith('test-user-id');
    });
    
    test('should not attach token when attachToken is false', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      mockHmrcAuthService.isConnected.mockResolvedValue(true);
      
      const response = await hmrcAuthMiddleware(request, { attachToken: false });
      
      expect(mockHmrcAuthService.getValidToken).not.toHaveBeenCalled();
      expect(mockHmrcAuthService.getAccessToken).not.toHaveBeenCalled();
      expect(NextResponse.next).not.toHaveBeenCalled();
      expect(response).toBeNull();
    });
    
    test('should handle errors gracefully', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      const error = new Error('Test error');
      mockHmrcAuthService.ensureInitialized.mockRejectedValue(error);
      mockHmrcErrorHandler.handleError.mockReturnValue({
        message: 'Handled error',
        code: 'TEST_ERROR',
        status: 500
      });
      
      await hmrcAuthMiddleware(request);
      
      expect(mockHmrcErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.any(String),
        expect.any(String)
      );
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Handled error', code: 'TEST_ERROR' },
        { status: 500 }
      );
    });
  });
  
  describe('withHmrcAuth', () => {
    test('should pass through middleware response if provided', async () => {
      const request = mockNextRequest();
      
      // Mock middleware to return a response
      jest.spyOn(NextResponse, 'json').mockImplementationOnce(() => {
        return { body: { error: 'Auth error' } } as unknown as NextResponse;
      });
      
      const handler = jest.fn();
      const wrappedHandler = withHmrcAuth(handler);
      
      await wrappedHandler(request);
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    test('should call handler when middleware returns null', async () => {
      const request = mockNextRequest({ 'sb-access-token': 'valid-token' });
      
      mockHmrcAuthService.isConnected.mockResolvedValue(true);
      mockHmrcAuthService.getValidToken.mockResolvedValue('hmrc-access-token');
      
      const mockResponse = { status: 200, body: { success: true } };
      const handler = jest.fn().mockResolvedValue(mockResponse);
      
      const wrappedHandler = withHmrcAuth(handler);
      const response = await wrappedHandler(request);
      
      expect(handler).toHaveBeenCalled();
      expect(response).toBe(mockResponse);
    });
  });
});
