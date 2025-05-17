import { TokenStorageService } from '../tokenStorageService';
import { EncryptionService } from '../encryptionService';
import { TokenData } from '../types';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    rpc: jest.fn().mockImplementation((functionName, params) => {
      if (functionName === 'store_encrypted_token') {
        return { error: null };
      } else if (functionName === 'get_encrypted_token') {
        return { 
          data: [{ 
            encrypted_token: 'mock_encrypted_token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            scope: 'read:test write:test'
          }],
          error: null 
        };
      }
      return { error: null };
    }),
    from: jest.fn().mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => {
        if (table === 'user_tokens') {
          return callback({
            data: {
              encrypted_token: 'mock_encrypted_token',
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              scope: 'read:test write:test'
            },
            error: null
          });
        } else if (table === 'token_audit_logs') {
          return callback({
            data: [
              {
                id: 'mock-id-1',
                user_id: 'user123',
                provider: 'hmrc',
                action: 'store',
                created_at: new Date().toISOString()
              }
            ],
            error: null
          });
        }
        return callback({ data: null, error: null });
      })
    }))
  }))
}));

// Mock the EncryptionService
jest.mock('../encryptionService', () => {
  return {
    EncryptionService: {
      getInstance: jest.fn(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        encrypt: jest.fn().mockResolvedValue('mock_encrypted_data'),
        decrypt: jest.fn().mockImplementation(async (data) => {
          return JSON.stringify({
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'read:test write:test'
          });
        })
      }))
    }
  };
});

describe('TokenStorageService', () => {
  let tokenStorageService: TokenStorageService;
  
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get singleton instance
    tokenStorageService = TokenStorageService.getInstance();
    await tokenStorageService.initialize();
  });
  
  describe('storeToken', () => {
    it('should encrypt and store a token', async () => {
      // Mock token data
      const tokenData: TokenData = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read:test write:test'
      };
      
      // Store the token
      await tokenStorageService.storeToken('user123', tokenData, 'hmrc');
      
      // Verify the encryption service was called
      expect(EncryptionService.getInstance().encrypt).toHaveBeenCalledWith(
        expect.stringContaining('test_access_token')
      );
      
      // Verify the RPC function was called
      expect(createServerSupabaseClient().rpc).toHaveBeenCalledWith(
        'store_encrypted_token',
        expect.objectContaining({
          p_user_id: 'user123',
          p_provider: 'hmrc',
          p_encrypted_token: 'mock_encrypted_data'
        })
      );
    });
  });
  
  describe('getToken', () => {
    it('should retrieve and decrypt a token', async () => {
      // Get the token
      const token = await tokenStorageService.getToken('user123', 'hmrc');
      
      // Verify the token was retrieved and decrypted
      expect(token).toEqual({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read:test write:test'
      });
      
      // Verify the decryption service was called
      expect(EncryptionService.getInstance().decrypt).toHaveBeenCalledWith(
        'mock_encrypted_token'
      );
    });
    
    it('should return null if no token is found', async () => {
      // Mock the Supabase response for this test only
      const mockFrom = createServerSupabaseClient().from as jest.Mock;
      mockFrom.mockImplementationOnce((table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(callback => {
          return callback({ data: null, error: null });
        })
      }));
      
      // Get the token
      const token = await tokenStorageService.getToken('user123', 'hmrc');
      
      // Verify null was returned
      expect(token).toBeNull();
    });
  });
  
  describe('isTokenExpired', () => {
    it('should return true for expired tokens', async () => {
      // Mock the Supabase response for this test only
      const mockFrom = createServerSupabaseClient().from as jest.Mock;
      mockFrom.mockImplementationOnce((table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(callback => {
          return callback({
            data: {
              expires_at: new Date(Date.now() - 1000).toISOString() // Expired
            },
            error: null
          });
        })
      }));
      
      // Check if token is expired
      const isExpired = await tokenStorageService.isTokenExpired('user123', 'hmrc');
      
      // Verify token is reported as expired
      expect(isExpired).toBe(true);
    });
    
    it('should return false for valid tokens', async () => {
      // Mock the Supabase response for this test only
      const mockFrom = createServerSupabaseClient().from as jest.Mock;
      mockFrom.mockImplementationOnce((table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(callback => {
          return callback({
            data: {
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // Valid for 1 hour
            },
            error: null
          });
        })
      }));
      
      // Check if token is expired
      const isExpired = await tokenStorageService.isTokenExpired('user123', 'hmrc');
      
      // Verify token is reported as not expired
      expect(isExpired).toBe(false);
    });
  });
  
  describe('deleteToken', () => {
    it('should delete a token', async () => {
      // Delete the token
      await tokenStorageService.deleteToken('user123', 'hmrc');
      
      // Verify the delete function was called
      expect(createServerSupabaseClient().from).toHaveBeenCalledWith('user_tokens');
      expect(createServerSupabaseClient().from('user_tokens').delete).toHaveBeenCalled();
      expect(createServerSupabaseClient().from('user_tokens').delete().eq).toHaveBeenCalledWith('user_id', 'user123');
      expect(createServerSupabaseClient().from('user_tokens').delete().eq().eq).toHaveBeenCalledWith('provider', 'hmrc');
    });
  });
  
  describe('getTokenAuditLogs', () => {
    it('should retrieve token audit logs', async () => {
      // Get audit logs
      const logs = await tokenStorageService.getTokenAuditLogs('user123', 'hmrc');
      
      // Verify logs were retrieved
      expect(logs).toEqual([
        {
          id: 'mock-id-1',
          user_id: 'user123',
          provider: 'hmrc',
          action: 'store',
          created_at: expect.any(String)
        }
      ]);
      
      // Verify the select function was called
      expect(createServerSupabaseClient().from).toHaveBeenCalledWith('token_audit_logs');
      expect(createServerSupabaseClient().from('token_audit_logs').select).toHaveBeenCalledWith('*');
    });
  });
});

// Helper to make TypeScript happy with our mocks
function createServerSupabaseClient() {
  return require('@/lib/supabase/server').createServerSupabaseClient();
}
