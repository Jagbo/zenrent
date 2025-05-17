import { supabase } from '@/lib/supabase';
import { EncryptionService } from './encryptionService';
import { TokenData, TokenAuditAction } from './types';

/**
 * Token Storage Service
 * Handles secure storage, retrieval, and management of OAuth tokens
 */
export class TokenStorageService {
  private static instance: TokenStorageService;
  private encryptionService: EncryptionService;
  private isInitialized: boolean = false;
  
  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): TokenStorageService {
    if (!TokenStorageService.instance) {
      TokenStorageService.instance = new TokenStorageService();
    }
    return TokenStorageService.instance;
  }
  
  /**
   * Initialize the token storage service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize the encryption service
    await this.encryptionService.initialize();
    
    this.isInitialized = true;
  }
  
  /**
   * Store a token in the database
   * @param userId - User ID
   * @param tokenData - Token data to store
   * @param provider - Token provider (e.g., 'hmrc', 'google')
   */
  public async storeToken(
    userId: string, 
    tokenData: TokenData, 
    provider: string = 'hmrc'
  ): Promise<void> {
    await this.initialize();
    
    // Add validation checks
    if (!userId) {
      console.error('User ID is required to store token');
      throw new Error('User ID is required to store token');
    }

    if (!tokenData || !tokenData.access_token) {
      console.error('Invalid token data: access_token is required');
      throw new Error('Invalid token data: access_token is required');
    }
    
    // Log token storage operation
    console.log(`Storing ${provider} token for user ${userId}`);
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Store in database using RPC function
    // Use the existing supabase client
    try {
      console.log(`Calling store_hmrc_tokens with access_token length: ${tokenData.access_token.length}, refresh_token: ${tokenData.refresh_token ? 'present' : 'not present'}`);
      
      // Use store_hmrc_tokens with the correct parameter names from the error message
      // public.store_hmrc_tokens(p_access_token, p_expires_at, p_refresh_token, p_scope, p_user_id)
      const { data, error } = await supabase.rpc('store_hmrc_tokens', {
        p_user_id: userId,
        p_access_token: tokenData.access_token,
        p_refresh_token: tokenData.refresh_token || null,
        p_expires_at: expiresAt.toISOString(),
        p_scope: tokenData.scope || ''
      });
      
      if (error) {
        console.error(`Error storing token in database:`, error);
        throw new Error(`Failed to store token: ${error.message}`);
      }
      
      console.log(`Successfully stored ${provider} token for user ${userId}`);
      
      // Also store the encrypted full token data as a backup
      try {
        // Encrypt the full token data for backup purposes
        const encryptedToken = await this.encryptionService.encrypt(
          JSON.stringify(tokenData)
        );
        
        // Store the encrypted token in a separate table for backup
        await supabase.from('hmrc_token_backups').upsert({
          user_id: userId,
          encrypted_token: encryptedToken,
          created_at: new Date().toISOString(),
          provider: provider
        });
      } catch (backupError) {
        // Non-critical error, just log it
        console.warn('Failed to store encrypted token backup:', backupError);
      }
    } catch (err) {
      console.error('Error in store_hmrc_tokens RPC call:', err);
      throw err;
    }
    
    // Log the token operation
    await this.logTokenOperation(userId, provider, 'store');
  }
  
  /**
   * Retrieve a token from the database
   * @param userId - User ID
   * @param provider - Token provider (e.g., 'hmrc', 'google')
   * @returns Decrypted token data or null if not found
   */
  public async getToken(
    userId: string, 
    provider: string = 'hmrc'
  ): Promise<TokenData | null> {
    await this.initialize();
    
    // Get the encrypted token from the database
    // Use the existing supabase client - trying both direct query and RPC approach
    let data, error;
    try {
      // First attempt: direct table query
      const result = await supabase
        .from('user_tokens')
        .select('encrypted_token, expires_at')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();
      
      data = result.data;
      error = result.error;
      
      // If no data found, try the RPC function as fallback
      if (!data && !error) {
        console.log(`Trying to get token via get_hmrc_token RPC for user ${userId} with provider ${provider}`);
        const rpcResult = await supabase.rpc('get_hmrc_token', {
          p_user_id: userId,
          p_provider: provider
        });
        
        if (rpcResult.data) {
          data = rpcResult.data;
        } else if (rpcResult.error) {
          error = rpcResult.error;
        }
      }
    } catch (err) {
      console.error('Error retrieving token:', err);
      error = err;
    }
    
    if (error || !data) {
      return null;
    }
    
    try {
      // Decrypt the token
      const decryptedToken = await this.encryptionService.decrypt(data.encrypted_token);
      
      // Log the token operation
      await this.logTokenOperation(userId, provider, 'retrieve');
      
      return JSON.parse(decryptedToken) as TokenData;
    } catch (error) {
      console.error('Error decrypting token:', error);
      return null;
    }
  }
  
  /**
   * Check if a token is expired
   * @param userId - User ID
   * @param provider - Token provider
   * @returns Whether the token is expired
   */
  public async isTokenExpired(
    userId: string, 
    provider: string = 'hmrc'
  ): Promise<boolean> {
    await this.initialize();
    
    // Use the existing supabase client
    const { data, error } = await supabase
      .from('user_tokens')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (error || !data) {
      return true; // If no token exists, consider it expired
    }
    
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    
    // Add a buffer of 5 minutes to avoid edge cases
    const bufferMs = 5 * 60 * 1000;
    return expiresAt.getTime() - bufferMs < now.getTime();
  }
  
  /**
   * Delete a token from the database
   * @param userId - User ID
   * @param provider - Token provider
   */
  public async deleteToken(
    userId: string, 
    provider: string = 'hmrc'
  ): Promise<void> {
    await this.initialize();
    
    try {
      console.log(`Deleting ${provider} token for user ${userId}`);
      
      // First try using the RPC function if available
      try {
        const { error } = await supabase.rpc('delete_hmrc_token', {
          p_user_id: userId,
          p_provider: provider
        });
        
        if (error) {
          console.warn(`RPC delete_hmrc_token failed, falling back to direct delete: ${error.message}`);
          // Fall back to direct deletion if RPC fails
          await supabase
            .from('user_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('provider', provider);
        } else {
          console.log(`Successfully deleted ${provider} token for user ${userId} via RPC`);
        }
      } catch (err) {
        console.warn('RPC not available, using direct delete:', err);
        // Fall back to direct deletion if RPC doesn't exist
        await supabase
          .from('user_tokens')
          .delete()
          .eq('user_id', userId)
          .eq('provider', provider);
      }
      
      // Log the token operation
      await this.logTokenOperation(userId, provider, 'delete');
    } catch (error) {
      console.error(`Error deleting ${provider} token for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Rotate a token's encryption
   * This is useful for key rotation policies
   * @param userId - User ID
   * @param provider - Token provider
   */
  public async rotateTokenEncryption(
    userId: string, 
    provider: string = 'hmrc'
  ): Promise<void> {
    await this.initialize();
    
    // Get the current token
    const token = await this.getToken(userId, provider);
    
    if (!token) {
      return; // No token to rotate
    }
    
    // Re-encrypt and store the token
    await this.storeToken(userId, token, provider);
    
    // Log the token operation
    await this.logTokenOperation(userId, provider, 'rotate');
  }
  
  /**
   * Log a token operation for audit purposes
   * @param userId - User ID
   * @param provider - Token provider
   * @param action - Action performed
   * @param metadata - Additional metadata
   */
  private async logTokenOperation(
    userId: string,
    provider: string,
    action: TokenAuditAction,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Get client IP if available
    let ipAddress = 'unknown';
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.error('Error getting IP address:', error);
      }
    }
    
    // Create audit log entry
    await supabase.from('token_audit_logs').insert({
      user_id: userId,
      provider,
      action,
      ip_address: ipAddress,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    });
  }
  
  /**
   * Get token audit logs for a user
   * @param userId - User ID
   * @param provider - Token provider
   * @param limit - Maximum number of logs to return
   * @returns Audit logs
   */
  public async getTokenAuditLogs(
    userId: string,
    provider: string = 'hmrc',
    limit: number = 50
  ): Promise<any[]> {
    await this.initialize();
    
    // Use the existing supabase client
    const { data, error } = await supabase
      .from('token_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      return [];
    }
    
    return data;
  }
}
