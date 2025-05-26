import { supabase as supabaseClient } from '@/lib/supabase';
import { encryptSensitiveData, decryptSensitiveData } from '@/utils/crypto';

const HMRC_API_BASE = process.env.HMRC_API_BASE || 'https://api.service.hmrc.gov.uk';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface HMRCTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

export class HMRCAuthService {
  private supabase = supabaseClient;

  /**
   * Refresh access token with retry logic and exponential backoff
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${HMRC_API_BASE}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.HMRC_CLIENT_ID!,
            client_secret: process.env.HMRC_CLIENT_SECRET!,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Token refresh failed: ${response.status} - ${errorData.error_description || errorData.error || 'Unknown error'}`);
        }
        
        const tokenData = await response.json();
        console.log('[HMRC Auth] Token refreshed successfully');
        return tokenData;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[HMRC Auth] Token refresh attempt ${attempt + 1} failed:`, error);
        
        // Exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[HMRC Auth] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Token refresh failed after retries');
  }

  /**
   * Store HMRC tokens securely with encryption
   */
  async storeTokens(userId: string, tokens: TokenResponse): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      // Encrypt sensitive token data
      const encryptedAccessToken = encryptSensitiveData(tokens.access_token);
      const encryptedRefreshToken = encryptSensitiveData(tokens.refresh_token);
      
      const { error } = await this.supabase
        .from('hmrc_tokens')
        .upsert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
          token_type: tokens.token_type,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`);
      }
      
      console.log('[HMRC Auth] Tokens stored securely');
    } catch (error) {
      console.error('[HMRC Auth] Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string> {
    try {
      // Get stored tokens
      const { data: tokenData, error } = await this.supabase
        .from('hmrc_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !tokenData) {
        throw new Error('No HMRC tokens found. Please reconnect to HMRC.');
      }
      
      // Decrypt tokens
      const accessToken = decryptSensitiveData(tokenData.access_token);
      const refreshToken = decryptSensitiveData(tokenData.refresh_token);
      const expiresAt = new Date(tokenData.expires_at);
      
      // Check if token is still valid (with 5 minute buffer)
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      
      if (expiresAt.getTime() > now.getTime() + bufferTime) {
        console.log('[HMRC Auth] Using existing valid token');
        return accessToken;
      }
      
      // Token is expired or about to expire, refresh it
      console.log('[HMRC Auth] Token expired, refreshing...');
      const newTokens = await this.refreshAccessToken(refreshToken);
      
      // Store new tokens
      await this.storeTokens(userId, newTokens);
      
      return newTokens.access_token;
    } catch (error) {
      console.error('[HMRC Auth] Error getting valid access token:', error);
      throw error;
    }
  }

  /**
   * Check if user has valid HMRC connection
   */
  async hasValidConnection(userId: string): Promise<boolean> {
    try {
      const { data: tokenData, error } = await this.supabase
        .from('hmrc_tokens')
        .select('expires_at, refresh_token')
        .eq('user_id', userId)
        .single();
        
      if (error || !tokenData) {
        return false;
      }
      
      // Check if we have a refresh token (even if access token is expired)
      return !!tokenData.refresh_token;
    } catch (error) {
      console.error('[HMRC Auth] Error checking connection:', error);
      return false;
    }
  }

  /**
   * Revoke HMRC tokens and clear stored data
   */
  async revokeConnection(userId: string): Promise<void> {
    try {
      // Get refresh token to revoke
      const { data: tokenData } = await this.supabase
        .from('hmrc_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .single();
        
      if (tokenData?.refresh_token) {
        try {
          const refreshToken = decryptSensitiveData(tokenData.refresh_token);
          
          // Revoke token with HMRC
          await fetch(`${HMRC_API_BASE}/oauth/revoke`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: refreshToken,
              client_id: process.env.HMRC_CLIENT_ID!,
              client_secret: process.env.HMRC_CLIENT_SECRET!,
            }),
          });
        } catch (error) {
          console.warn('[HMRC Auth] Failed to revoke token with HMRC:', error);
          // Continue with local cleanup even if revocation fails
        }
      }
      
      // Clear stored tokens
      const { error } = await this.supabase
        .from('hmrc_tokens')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        throw new Error(`Failed to clear tokens: ${error.message}`);
      }
      
      console.log('[HMRC Auth] Connection revoked successfully');
    } catch (error) {
      console.error('[HMRC Auth] Error revoking connection:', error);
      throw error;
    }
  }
}

export const hmrcAuth = new HMRCAuthService(); 