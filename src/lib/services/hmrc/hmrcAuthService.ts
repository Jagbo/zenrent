import crypto from 'crypto';
import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { HmrcErrorHandler, OAuthErrorType, ErrorCategory } from './hmrcErrorHandler';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Types for tokens and responses
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId: string;
}

export interface OAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface HmrcApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  }
}

export class HmrcAuthService {
  private static instance: HmrcAuthService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authUrl: string;
  private tokenUrl: string;
  private revokeUrl: string;
  private errorHandler: HmrcErrorHandler;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  private constructor() {
    this.clientId = '';
    this.clientSecret = '';
    this.redirectUri = '';
    this.authUrl = 'https://test-api.service.hmrc.gov.uk/oauth/authorize';
    this.tokenUrl = 'https://test-api.service.hmrc.gov.uk/oauth/token';
    this.revokeUrl = 'https://test-api.service.hmrc.gov.uk/oauth/revoke';
    this.errorHandler = HmrcErrorHandler.getInstance();
  }

  public static getInstance(): HmrcAuthService {
    if (!HmrcAuthService.instance) {
      HmrcAuthService.instance = new HmrcAuthService();
    }
    return HmrcAuthService.instance;
  }

  /**
   * Public method to ensure the service is initialized
   */
  public async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize the service by loading settings from the database
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = (async () => {
      try {
        const supabase = createServerSupabaseClient();
        
        // Get settings from the database
        const { data: settings, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['HMRC_AUTH_URL', 'HMRC_TOKEN_URL', 'HMRC_REDIRECT_URI']);
        
        if (error) {
          console.error('Error fetching HMRC settings:', error);
          // Continue with environment variables instead of throwing
        } else {
          // Extract settings
          for (const setting of settings || []) {
            switch (setting.key) {
              case 'HMRC_AUTH_URL':
                this.authUrl = setting.value;
                break;
              case 'HMRC_TOKEN_URL':
                this.tokenUrl = setting.value;
                break;
              case 'HMRC_REDIRECT_URI':
                this.redirectUri = setting.value;
                break;
            }
          }
        }
        
        // Try to get encrypted settings using database functions
        let clientId = null;
        let clientSecret = null;
        
        try {
          const { data: dbClientId } = await supabase.rpc('get_decrypted_setting', { 
            p_key: 'HMRC_CLIENT_ID'
          });
          clientId = dbClientId;
          
          const { data: dbClientSecret } = await supabase.rpc('get_decrypted_setting', { 
            p_key: 'HMRC_CLIENT_SECRET'
          });
          clientSecret = dbClientSecret;
        } catch (e) {
          console.error('Error getting decrypted settings:', e);
          // Continue with environment variables
        }
        
        // Set credentials from database if available
        if (clientId) this.clientId = clientId;
        if (clientSecret) this.clientSecret = clientSecret;
        
        // Fallback to environment variables for any value not set
        if (!this.authUrl) this.authUrl = process.env.HMRC_AUTH_URL || 'https://test-api.service.hmrc.gov.uk/oauth/authorize';
        if (!this.tokenUrl) this.tokenUrl = process.env.HMRC_TOKEN_URL || 'https://test-api.service.hmrc.gov.uk/oauth/token';
        if (!this.redirectUri) this.redirectUri = process.env.HMRC_REDIRECT_URI || '';
        if (!this.clientId) this.clientId = process.env.HMRC_CLIENT_ID || '';
        if (!this.clientSecret) this.clientSecret = process.env.HMRC_CLIENT_SECRET || '';
        
        // Log what we're using but don't include secrets
        console.log('HMRC Auth Service initialized with:', {
          authUrl: this.authUrl,
          tokenUrl: this.tokenUrl,
          redirectUri: this.redirectUri,
          hasClientId: !!this.clientId,
          hasClientSecret: !!this.clientSecret,
          source: clientId ? 'database' : 'environment'
        });
        
        // Only throw if we don't have credentials from either source
        if (!this.clientId || !this.clientSecret) {
          console.error('Missing HMRC client credentials in both database and environment variables');
          throw new Error('HMRC client credentials not configured in database or environment variables');
        }
        
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize HmrcAuthService:', error);
        throw error;
      }
    })();

    await this.initializationPromise;
  }

  /**
   * Generate a random code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(43).toString('base64url');
  }

  /**
   * Generate code challenge from code verifier for PKCE
   */
  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }
  
  /**
   * Get client IP and user agent for audit logging
   */
  private async getClientInfo(): Promise<{ ipAddress: string | null, userAgent: string | null }> {
    try {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || 
                       headersList.get('x-real-ip') || 
                       null;
      const userAgent = headersList.get('user-agent') || null;
      return { ipAddress, userAgent };
    } catch (error) {
      console.error('Failed to get client info:', error);
      return { ipAddress: null, userAgent: null };
    }
  }

  /**
   * Log token operation for audit purposes
   */
  private async logTokenOperation(
    userId: string, 
    operation: string, 
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { ipAddress, userAgent } = await this.getClientInfo();
      const supabase = createServerSupabaseClient();
      
      // Ensure we use the actual UUID part for logging
      const actualUserId = userId.includes(':') ? userId.split(':')[0] : userId;

      // Call RPC function to log operation
      await supabase.rpc('log_token_operation', {
        p_user_id: actualUserId, // Use the parsed actualUserId
        p_operation: operation,
        p_details: details,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
    } catch (error) {
      console.error(`Failed to log token operation (${operation}):`, error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Start the OAuth flow by generating the authorization URL
   */
  async initiateAuth(userId: string): Promise<{ authUrl: string, codeVerifier: string }> {
    // Ensure service is initialized
    await this.initialize();
    
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    // Store the code verifier temporarily for the callback
    await this.storeCodeVerifier(userId, codeVerifier);
    
    // Generate authorization URL with PKCE
    const queryParams = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'read:self-assessment write:self-assessment',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: userId // Use state parameter to track the user's session
    });

    // Log operation
    await this.logTokenOperation(userId, 'initiate_auth', {
      scope: 'read:self-assessment write:self-assessment'
    });
    
    return {
      authUrl: `${this.authUrl}?${queryParams.toString()}`,
      codeVerifier
    };
  }

  /**
   * Store code verifier temporarily in the database
   */
  private async storeCodeVerifier(userId: string, codeVerifier: string): Promise<void> {
    // Ensure service is initialized
    await this.initialize();
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const supabase = createServerSupabaseClient();
    // Extract the UUID part from the userId (state parameter)
    const actualUserId = userId.includes(':') ? userId.split(':')[0] : userId;

    await supabase
      .from('hmrc_auth_requests')
      .upsert({
        user_id: actualUserId, // Use the parsed actualUserId
        code_verifier: codeVerifier,
        expires_at: expiresAt.toISOString()
      });
  }

  /**
   * Retrieve the code verifier for a user from the database
   */
  private async getCodeVerifier(userId: string): Promise<string | null> {
    // Ensure service is initialized
    await this.initialize();
    
    const supabase = createServerSupabaseClient();
    // Extract the UUID part from the userId (state parameter)
    const actualUserId = userId.includes(':') ? userId.split(':')[0] : userId;

    const { data, error } = await supabase
      .from('hmrc_auth_requests')
      .select('code_verifier')
      .eq('user_id', actualUserId) // Use the parsed actualUserId
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      console.error('Failed to retrieve code verifier:', error);
      return null;
    }
    
    return data.code_verifier;
  }

  /**
   * Handle OAuth callback, exchange code for tokens
   */
  async handleCallback(code: string, userId: string): Promise<TokenResponse | null> {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const codeVerifier = await this.getCodeVerifier(userId);
      
      if (!codeVerifier) {
        throw new Error('Code verifier not found or expired');
      }
      
      // Exchange authorization code for tokens
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier
      });
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
      }
      
      const tokenData = await response.json() as TokenResponse;
      
      // Use the actual UUID part of userId (state) for storing tokens and logging
      const actualUserId = userId.includes(':') ? userId.split(':')[0] : userId;

      // Store tokens in the database
      await this.storeTokens(actualUserId, tokenData);
      
      // Clean up the code verifier
      await this.cleanupAuthRequest(actualUserId);
      
      // Log token operation
      await this.logTokenOperation(actualUserId, 'token_exchange', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope || 'read:self-assessment write:self-assessment'
      });
      
      return tokenData;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      
      // Use the actual UUID part of userId (state) for logging the failed operation
      const actualUserIdForErrorLog = userId.includes(':') ? userId.split(':')[0] : userId;
      await this.logTokenOperation(actualUserIdForErrorLog, 'token_exchange_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return null;
    }
  }

  /**
   * Store tokens in the database using the function that handles encryption
   */
  private async storeTokens(userId: string, tokenData: TokenResponse): Promise<void> {
    // Ensure service is initialized
    await this.initialize();
    
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const supabase = createServerSupabaseClient();
    await supabase.rpc('store_hmrc_tokens', {
      p_user_id: userId,
      p_access_token: tokenData.access_token,
      p_refresh_token: tokenData.refresh_token,
      p_expires_at: expiresAt.toISOString(),
      p_scope: tokenData.scope || 'read:self-assessment write:self-assessment'
    });
  }

  /**
   * Clean up auth request record after use
   */
  private async cleanupAuthRequest(userId: string): Promise<void> {
    // Ensure service is initialized
    await this.initialize();
    
    const supabase = createServerSupabaseClient();
    await supabase
      .from('hmrc_auth_requests')
      .delete()
      .eq('user_id', userId);
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(userId: string, retryCount = 0): Promise<TokenResponse | null> {
    // Ensure service is initialized
    await this.initialize();
    
    const maxRetries = 3;
    const backoffTime = Math.min(2000 * Math.pow(2, retryCount), 16000); // Exponential backoff: 2s, 4s, 8s, 16s max
    
    try {
      const supabase = createServerSupabaseClient();
      // Get the refresh token from the database
      const { data: refreshTokenData, error: refreshTokenError } = await supabase
        .rpc('get_decrypted_refresh_token', {
          p_user_id: userId
        });
      
      if (refreshTokenError || !refreshTokenData) {
        await this.logTokenOperation(userId, 'token_refresh_failed', {
          error: 'Refresh token not found or corrupted',
          retriesRemaining: 0
        });
        throw new Error('Refresh token not found');
      }
      
      const refreshToken = refreshTokenData;
      
      // Exchange refresh token for new access token
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = errorData.error || 'unknown_error';
        
        // Handle specific OAuth error types
        switch (errorCode) {
          case 'invalid_grant':
            // Refresh token is invalid or expired
            await this.logTokenOperation(userId, 'token_refresh_failed', {
              error: 'Refresh token expired or revoked',
              errorDetails: errorData,
              recommendation: 'User needs to reauthorize'
            });
            
            // Clear the invalid token from storage
            await this.clearTokens(userId);
            throw new Error('Refresh token expired or revoked - user needs to reauthorize');
            
          case 'invalid_client':
            // Client authentication failed
            await this.logTokenOperation(userId, 'token_refresh_failed', {
              error: 'Client authentication failed',
              errorDetails: errorData,
              recommendation: 'Check client credentials configuration'
            });
            throw new Error('Client authentication failed - check credentials');
            
          case 'server_error':
          case 'temporarily_unavailable':
            // Temporary server issues - candidate for retry
            if (retryCount < maxRetries) {
              await this.logTokenOperation(userId, 'token_refresh_retry', {
                error: errorData,
                retryCount: retryCount + 1,
                backoffTime,
                maxRetries
              });
              
              // Wait using exponential backoff
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              
              // Recursive retry with incremented counter
              return this.refreshToken(userId, retryCount + 1);
            }
            
            // Max retries reached
            await this.logTokenOperation(userId, 'token_refresh_failed', {
              error: 'Max retries reached',
              errorDetails: errorData
            });
            throw new Error(`Token refresh failed after ${maxRetries} retries: ${JSON.stringify(errorData)}`);
            
          default:
            // Other errors
            await this.logTokenOperation(userId, 'token_refresh_failed', {
              error: `Token refresh failed: ${errorCode}`,
              errorDetails: errorData
            });
            throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
        }
      }
      
      const tokenData = await response.json() as TokenResponse;
      
      // Store the new tokens
      await this.storeTokens(userId, tokenData);
      
      // Log token refresh
      await this.logTokenOperation(userId, 'token_refresh', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope || 'read:self-assessment write:self-assessment',
        retriesUsed: retryCount
      });
      
      return tokenData;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Only log if not already logged in specific error handlers above
      if (
        error instanceof Error && 
        !error.message.includes('Refresh token expired') && 
        !error.message.includes('Client authentication failed') &&
        !error.message.includes('Token refresh failed')
      ) {
        await this.logTokenOperation(userId, 'token_refresh_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount
        });
      }
      
      return null;
    }
  }

  /**
   * Clear tokens from storage (used when tokens become invalid)
   */
  private async clearTokens(userId: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();
      const { error } = await supabase
        .from('hmrc_authorizations')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error clearing tokens:', error);
      }
    } catch (error) {
      console.error('Exception clearing tokens:', error);
    }
  }

  /**
   * Execute an API request with automatic token refresh
   * This is a utility function that handles token refreshing automatically
   */
  async executeWithRetry<T>(
    userId: string, 
    apiCall: (token: string) => Promise<T>, 
    maxRetries = 2
  ): Promise<T> {
    // Ensure service is initialized
    await this.initialize();
    
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Get a valid token (will refresh if needed)
        const token = await this.getValidToken(userId);
        
        if (!token) {
          throw new Error('No valid token available - user may need to reauthorize');
        }
        
        // Execute the API call with the token
        return await apiCall(token);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if the error is due to an invalid token
        const isAuthError = 
          lastError.message.includes('401') || 
          lastError.message.includes('unauthorized') ||
          lastError.message.includes('invalid_token');
        
        if (isAuthError && retryCount < maxRetries) {
          // Force token refresh
          const refreshResult = await this.refreshToken(userId);
          
          if (!refreshResult) {
            // If refresh fails, break the loop
            break;
          }
          
          // Log retry attempt
          await this.logTokenOperation(userId, 'api_call_retry', {
            retryCount: retryCount + 1,
            reason: 'Auth error detected, token refreshed',
            error: lastError.message
          });
          
          retryCount++;
          
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Not an auth error or max retries reached
          break;
        }
      }
    }
    
    // If we got here, all retries failed
    await this.logTokenOperation(userId, 'api_call_failed', {
      maxRetries,
      retriesAttempted: retryCount,
      finalError: lastError?.message || 'Unknown error'
    });
    
    throw lastError || new Error('API call failed after retries');
  }
  
  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(userId: string): Promise<string | null> {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const supabase = createServerSupabaseClient();
      // Check if we have a valid token
      const { data, error } = await supabase
        .from('hmrc_authorizations')
        .select('expires_at')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        throw new Error('Failed to retrieve token');
      }
      
      if (!data) {
        // No token found, user needs to authorize
        return null;
      }
      
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      // Add a 5-minute buffer to ensure the token doesn't expire during usage
      const bufferTime = 5 * 60 * 1000;
      const isExpired = now.getTime() + bufferTime > expiresAt.getTime();
      
      if (isExpired) {
        // Token is expired or expiring soon, refresh it
        const newTokens = await this.refreshToken(userId);
        if (!newTokens) {
          throw new Error('Failed to refresh token');
        }
        
        // Log token access
        await this.logTokenOperation(userId, 'token_access', {
          status: 'refreshed'
        });
        
        return newTokens.access_token;
      }
      
      // Get the decrypted access token
      const { data: accessTokenData, error: accessTokenError } = await supabase
        .rpc('get_decrypted_access_token', {
          p_user_id: userId
        });
      
      if (accessTokenError || !accessTokenData) {
        throw new Error('Failed to retrieve decrypted access token');
      }
      
      // Log token access
      await this.logTokenOperation(userId, 'token_access', {
        status: 'valid'
      });
      
      // Return the valid access token
      return accessTokenData;
    } catch (error) {
      console.error('Error getting valid token:', error);
      
      // Log token access failure
      await this.logTokenOperation(userId, 'token_access_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return null;
    }
  }

  /**
   * Get the access token for a user
   */
  public async getAccessToken(userId: string): Promise<string | null> {
    try {
      await this.initialize();
      const supabase = createServerSupabaseClient();
      // Get the decrypted access token
      const { data: accessToken, error } = await supabase.rpc('get_decrypted_access_token', {
        p_user_id: userId
      });
      
      if (error || !accessToken) {
        console.error('Failed to get access token:', error);
        return null;
      }
      
      return accessToken;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  /**
   * Check if a user is connected to HMRC
   */
  public async isConnected(userId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      const accessToken = await this.getAccessToken(userId);
      return !!accessToken;
    } catch (error) {
      console.error('Error checking HMRC connection:', error);
      return false;
    }
  }

  /**
   * Disconnect from HMRC (revoke tokens)
   */
  async disconnect(userId: string): Promise<boolean> {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      const supabase = createServerSupabaseClient();
      // Get the tokens to revoke
      const { data: accessToken, error: accessTokenError } = await supabase
        .rpc('get_decrypted_access_token', {
          p_user_id: userId
        });
      
      const { data: refreshToken, error: refreshTokenError } = await supabase
        .rpc('get_decrypted_refresh_token', {
          p_user_id: userId
        });
      
      // Call HMRC's token revocation endpoint if tokens exist
      // HMRC implements OAuth 2.0 token revocation (RFC 7009)
      if (accessToken || refreshToken) {
        const tokenTypes = [];
        
        // Revoke access token
        if (accessToken && !accessTokenError) {
          await this.revokeToken(accessToken, 'access_token');
          tokenTypes.push('access_token');
        }
        
        // Revoke refresh token
        if (refreshToken && !refreshTokenError) {
          await this.revokeToken(refreshToken, 'refresh_token');
          tokenTypes.push('refresh_token');
        }
        
        // Log revocation attempts
        await this.logTokenOperation(userId, 'token_revocation', {
          token_types: tokenTypes
        });
      }
      
      // Delete tokens from our database
      const { error } = await supabase
        .from('hmrc_authorizations')
        .delete()
        .eq('user_id', userId);
      
      // Log disconnection
      if (!error) {
        await this.logTokenOperation(userId, 'disconnect', {
          status: 'success'
        });
      }
      
      return !error;
    } catch (error) {
      console.error('Error disconnecting from HMRC:', error);
      
      // Log disconnection failure
      await this.logTokenOperation(userId, 'disconnect_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }
  
  /**
   * Revoke a token with HMRC's revocation endpoint
   */
  private async revokeToken(token: string, tokenType: 'access_token' | 'refresh_token'): Promise<boolean> {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      // HMRC revocation endpoint - usually /oauth/revoke or similar
      // Note: Update with correct URL if different
      const revocationUrl = `${this.tokenUrl.replace('/token', '/revoke')}`;
      
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        token: token,
        token_type_hint: tokenType
      });
      
      const response = await fetch(revocationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      // RFC 7009 defines that revocation endpoint should return 200 OK even if the token was invalid
      // No error if the revocation endpoint call fails - we're deleting from our side anyway
      return response.ok;
    } catch (error) {
      console.error(`Error revoking ${tokenType}:`, error);
      return false;
    }
  }
}

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
} 