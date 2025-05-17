import crypto from 'crypto';
import { createHash } from 'crypto';
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
  private _codeVerifiers: Map<string, {verifier: string, expires: Date}> = new Map();
  
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
        // Check if we're in a local development environment
        const isLocalDev = process.env.NODE_ENV === 'development' || 
                          process.env.NEXT_PUBLIC_BASE_URL?.includes('ngrok') || 
                          process.env.NEXT_PUBLIC_APP_URL?.includes('ngrok') || 
                          process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost') || 
                          process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
        
        // For local development, prioritize environment variables
        if (isLocalDev) {
          console.log('Local development environment detected. Using environment variables for HMRC settings.');
          this.authUrl = process.env.HMRC_AUTH_URL || 'https://test-api.service.hmrc.gov.uk/oauth/authorize';
          this.tokenUrl = process.env.HMRC_TOKEN_URL || 'https://test-api.service.hmrc.gov.uk/oauth/token';
          this.redirectUri = process.env.HMRC_REDIRECT_URI || '';
          this.clientId = process.env.HMRC_CLIENT_ID || '';
          this.clientSecret = process.env.HMRC_CLIENT_SECRET || '';
        } else {
          // In production, use database settings with environment variable fallback
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
            // Convert settings array to object for easier access
            const settingsMap = settings?.reduce((acc, setting) => {
              acc[setting.key] = setting.value;
              return acc;
            }, {} as Record<string, string>) || {};
            
            // Set properties from database with environment variable fallbacks
            this.authUrl = settingsMap['HMRC_AUTH_URL'] || process.env.HMRC_AUTH_URL || 'https://test-api.service.hmrc.gov.uk/oauth/authorize';
            this.tokenUrl = settingsMap['HMRC_TOKEN_URL'] || process.env.HMRC_TOKEN_URL || 'https://test-api.service.hmrc.gov.uk/oauth/token';
            this.redirectUri = settingsMap['HMRC_REDIRECT_URI'] || process.env.HMRC_REDIRECT_URI || '';
          }
          
          // Get credentials from the database
          const { data: credentials, error: credentialsError } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['HMRC_CLIENT_ID', 'HMRC_CLIENT_SECRET']);
          
          if (credentialsError) {
            console.error('Error fetching HMRC credentials:', credentialsError);
            // Continue with environment variables instead of throwing
          } else {
            // Convert credentials array to object for easier access
            const credentialsMap = credentials?.reduce((acc, credential) => {
              acc[credential.key] = credential.value;
              return acc;
            }, {} as Record<string, string>) || {};
            
            // Set credentials from database with environment variable fallbacks
            this.clientId = credentialsMap['HMRC_CLIENT_ID'] || process.env.HMRC_CLIENT_ID || '';
            this.clientSecret = credentialsMap['HMRC_CLIENT_SECRET'] || process.env.HMRC_CLIENT_SECRET || '';
          }
        }
        
        // Validate settings
        if (!this.redirectUri) {
          this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hmrc/oauth/callback`;
          console.log(`No HMRC redirect URI found, using default: ${this.redirectUri}`);
        }
        
        // Set initialization flag
        this.isInitialized = true;
        console.log('HMRC Auth Service initialized successfully');
      } catch (error) {
        console.error('Error initializing HMRC Auth Service:', error);
        throw error;
      }
    })();
    
    await this.initializationPromise;
  }

  /**
   * Generate a random code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    // Generate a random string of 43-128 characters
    // This should be between 43 and 128 characters long
    // per the PKCE spec (RFC 7636)
    const verifier = randomBytes(64)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return verifier;
  }

  /**
   * Generate code challenge from code verifier for PKCE
   */
  private generateCodeChallenge(codeVerifier: string): string {
    // Create a code challenge using SHA-256
    const challenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return challenge;
  }

  /**
   * Get client IP and user agent for audit logging
   */
  private async getClientInfo(): Promise<{ ipAddress: string | null, userAgent: string | null }> {
    try {
      // In a server environment, we don't have direct access to client info
      // This is a placeholder for when this is called from an API route
      return {
        ipAddress: null,
        userAgent: null
      };
    } catch (error) {
      console.error('Error getting client info:', error);
      return {
        ipAddress: null,
        userAgent: null
      };
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
      // Get client info
      const { ipAddress, userAgent } = await this.getClientInfo();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Log the operation
      const { error } = await supabase.from('hmrc_auth_logs').insert({
        user_id: userId,
        operation,
        ip_address: ipAddress,
        user_agent: userAgent,
        details
      });
      
      if (error) {
        console.error('Error logging token operation:', error);
      }
    } catch (error) {
      console.error('Error logging token operation:', error);
    }
  }

  /**
   * Start the OAuth flow by generating the authorization URL
   */
  public async initiateAuth(userId: string): Promise<{ authUrl: string, codeVerifier: string }> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Generate a code verifier for PKCE
      const codeVerifier = this.generateCodeVerifier();
      
      // Generate a code challenge from the verifier
      const codeChallenge = this.generateCodeChallenge(codeVerifier);
      
      // Create state parameter with userId for security
      const stateObj = {
        userId: userId,
        random: Math.random().toString(36).substring(2, 12),
        timestamp: Date.now()
      };
      const stateStr = JSON.stringify(stateObj);
      const stateBase64 = Buffer.from(stateStr).toString('base64');
      
      // Store the code verifier for later use
      await this.storeCodeVerifier(userId, codeVerifier);
      
      // Log the operation
      await this.logTokenOperation(userId, 'auth_initiated', {
        state: stateBase64,
        redirectUri: this.redirectUri
      });
      
      // Build the authorization URL
      const authUrl = new URL(this.authUrl);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', this.clientId);
      authUrl.searchParams.append('redirect_uri', this.redirectUri);
      authUrl.searchParams.append('scope', 'read:self-assessment write:self-assessment');
      authUrl.searchParams.append('state', stateBase64);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      
      // Only throw if we don't have credentials from either source
      if (!this.clientId || !this.clientSecret) {
        throw new Error('HMRC client credentials not configured');
      }
      
      return { authUrl: authUrl.toString(), codeVerifier };
    } catch (error) {
      console.error('Error initiating HMRC auth:', error);
      throw error;
    }
  }

  /**
   * Store code verifier temporarily in the database
   */
  public async storeCodeVerifier(userId: string, codeVerifier: string): Promise<void> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Generate a unique state for this auth request
      const stateObj = {
        userId: userId,
        random: Math.random().toString(36).substring(2, 12),
        timestamp: Date.now()
      };
      const stateStr = JSON.stringify(stateObj);
      const stateBase64 = Buffer.from(stateStr).toString('base64');
      
      // Store the code verifier in the hmrc_auth_requests table
      const { error } = await supabase
        .from('hmrc_auth_requests')
        .insert({
          user_id: userId,
          state: stateBase64,
          code_verifier: codeVerifier,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });
      
      // Also store in memory as a fallback
      if (!this._codeVerifiers) {
        this._codeVerifiers = new Map<string, {verifier: string, expires: Date}>();
      }
      
      this._codeVerifiers.set(userId, {
        verifier: codeVerifier,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      // Also store with state as key for easier retrieval
      this._codeVerifiers.set(stateBase64, {
        verifier: codeVerifier,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      // Log success for debugging
      console.log(`[HmrcAuthService] Stored code verifier for user ${userId}: ${codeVerifier.substring(0, 10)}...`);
      
      // Check for database errors
      if (error) {
        console.error('Error storing code verifier in database:', error);
        // Continue execution since we have the in-memory fallback
      }
      
      console.log(`[HmrcAuthService] Stored code verifier for user ${userId}: ${codeVerifier.substring(0, 10)}...`);
    } catch (error) {
      console.error('Error storing code verifier:', error);
      throw error;
    }
  }

  /**
   * Get the code verifier for a user or state
   * @param userIdOrState The user ID or state to get the code verifier for
   */
  public async getCodeVerifier(userIdOrState: string): Promise<string | null> {
    try {
      // First, try to decode the state if it's base64 encoded
      let userId = userIdOrState;
      let state = userIdOrState;
      let extractedUserId: string | undefined;
      
      // Try to decode as base64 if it looks like base64
      if (userIdOrState.includes('=') || userIdOrState.length % 4 === 0) {
        try {
          // Handle URL-safe base64 encoding
          const base64String = userIdOrState.replace(/-/g, '+').replace(/_/g, '/');
          const decodedState = Buffer.from(base64String, 'base64').toString('utf-8');
          console.log(`[HmrcAuthService] Decoded state: ${decodedState}`);
          
          try {
            const stateObj = JSON.parse(decodedState);
            console.log(`[HmrcAuthService] Parsed state object:`, stateObj);
            
            if (stateObj && stateObj.userId) {
              extractedUserId = stateObj.userId;
              console.log(`[HmrcAuthService] Extracted userId from state: ${extractedUserId}`);
            }
          } catch (parseError) {
            console.log(`[HmrcAuthService] Failed to parse decoded state as JSON: ${parseError}`);
          }
        } catch (e) {
          console.log(`[HmrcAuthService] Failed to decode state as base64: ${e}`);
        }
      }
      
      const supabase = createServerSupabaseClient();
      
      // Try different approaches to find the code verifier
      
      // 1. First try with the original state parameter
      let { data: stateData, error: stateError } = await supabase
        .from('hmrc_auth_requests')
        .select('code_verifier')
        .eq('state', state)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (stateData?.code_verifier) {
        const verifier = stateData.code_verifier;
        console.log(`[HmrcAuthService] Retrieved code verifier using state: ${verifier.substring(0, 10)}...`);
        return verifier;
      }
      
      // 2. Try with the extracted userId if available
      if (extractedUserId) {
        const { data: userData, error: userError } = await supabase
          .from('hmrc_auth_requests')
          .select('code_verifier')
          .eq('user_id', extractedUserId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (userData?.code_verifier) {
          const verifier = userData.code_verifier;
          console.log(`[HmrcAuthService] Retrieved code verifier for extracted user ${extractedUserId}: ${verifier.substring(0, 10)}...`);
          return verifier;
        }
      }
      
      // 3. Try with the original userId/state as a user_id
      const { data: originalUserData, error: originalUserError } = await supabase
        .from('hmrc_auth_requests')
        .select('code_verifier')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (originalUserData?.code_verifier) {
        const verifier = originalUserData.code_verifier;
        console.log(`[HmrcAuthService] Retrieved code verifier for original user ${userId}: ${verifier.substring(0, 10)}...`);
        return verifier;
      }
      
      // Fallback to in-memory storage
      console.log(`[HmrcAuthService] Checking in-memory storage as fallback`);
      
      // Try with the original userIdOrState
      const storedData = this._codeVerifiers.get(userIdOrState);
      if (storedData && storedData.expires > new Date()) {
        const verifier = storedData.verifier;
        console.log(`[HmrcAuthService] Retrieved code verifier from memory using state: ${verifier.substring(0, 10)}...`);
        return verifier;
      }
      
      // Try with extracted userId if available
      if (extractedUserId) {
        const extractedStoredData = this._codeVerifiers.get(extractedUserId);
        if (extractedStoredData && extractedStoredData.expires > new Date()) {
          const verifier = extractedStoredData.verifier;
          console.log(`[HmrcAuthService] Retrieved code verifier from memory for extracted user ${extractedUserId}: ${verifier.substring(0, 10)}...`);
          return verifier;
        }
      }
      
      // Try with raw state
      const memoryStateData = this._codeVerifiers.get(state);
      if (memoryStateData && memoryStateData.expires > new Date()) {
        const verifier = memoryStateData.verifier;
        console.log(`[HmrcAuthService] Retrieved code verifier from memory using state: ${verifier.substring(0, 10)}...`);
        return verifier;
      }
      
      console.log(`[HmrcAuthService] No code verifier found for state ${state}`);
      return null;
    } catch (error) {
      console.error('[HmrcAuthService] Error retrieving code verifier:', error);
      return null;
    }
  }

  /**
   * Handle the OAuth callback and exchange the code for tokens
   * @param code The authorization code from the callback
   * @param userId The user ID associated with the request
   * @param explicitCodeVerifier Optional code verifier to use instead of retrieving from storage
   */
  public async handleCallback(code: string, userId: string, explicitCodeVerifier?: string): Promise<TokenResponse | null> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Use explicit code verifier if provided, otherwise retrieve from storage
      let codeVerifier: string | null = null;
      
      if (explicitCodeVerifier) {
        console.log(`[HmrcAuthService] Using explicitly provided code verifier: ${explicitCodeVerifier.substring(0, 10)}...`);
        codeVerifier = explicitCodeVerifier;
      } else {
        // Get the stored code verifier
        codeVerifier = await this.getCodeVerifier(userId);
        
        if (!codeVerifier) {
          console.error(`[HmrcAuthService] No code verifier found for user ${userId}`);
          throw new Error('No code verifier found');
        }
      }
      
      console.log(`[HmrcAuthService] Retrieved code verifier for user ${userId}: ${codeVerifier.substring(0, 10)}...`);
      
      // Exchange the code for tokens
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('redirect_uri', this.redirectUri);
      params.append('code', code);
      
      // Only include code_verifier if we're using PKCE (which HMRC might not support)
      // Check if we're in development mode and log more details
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HmrcAuthService] Token exchange parameters:`);
        console.log(`- grant_type: authorization_code`);
        console.log(`- client_id: ${this.clientId}`);
        console.log(`- client_secret: ${this.clientSecret ? '[REDACTED]' : 'MISSING'}`);
        console.log(`- redirect_uri: ${this.redirectUri}`);
        console.log(`- code: ${code.substring(0, 5)}...`);
      }
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error exchanging code for tokens:', errorData);
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}`);
      }
      
      const tokenData = await response.json() as TokenResponse;
      
      // Store the tokens
      await this.storeTokens(userId, tokenData);
      
      // Log the operation
      await this.logTokenOperation(userId, 'token_received', {
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        expiresIn: tokenData.expires_in
      });
      
      return tokenData;
    } catch (error) {
      console.error('Error handling callback:', error);
      await this.logTokenOperation(userId, 'callback_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Store tokens in the database
   */
  public async storeTokens(userId: string, tokenData: TokenResponse): Promise<void> {
    try {
      console.log(`Storing hmrc token for user ${userId}`);
      
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Calculate when the token expires
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Log token details for debugging (without exposing the full token)
      console.log(`Calling store_hmrc_tokens with access_token length: ${tokenData.access_token.length}, refresh_token: ${tokenData.refresh_token ? 'present' : 'not present'}`);
      
      // Store the tokens in the hmrc_authorizations table
      const { error } = await supabase
        .from('hmrc_authorizations')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt.toISOString(),
          scope: tokenData.scope || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) {
        console.error(`Error storing HMRC tokens for user ${userId}:`, error);
        throw error;
      }
      
      console.log(`Successfully stored hmrc token for user ${userId}`);
      
      // Log the operation
      await this.logTokenOperation(userId, 'token_stored', {
        expiresAt: expiresAt.toISOString(),
        hasRefreshToken: !!tokenData.refresh_token
      });
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Clear tokens from storage (used when tokens become invalid)
   */
  public async clearTokens(userId: string): Promise<void> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Delete the tokens from hmrc_authorizations table
      const { error } = await supabase
        .from('hmrc_authorizations')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error(`Error deleting HMRC tokens for user ${userId}:`, error);
        throw error;
      }
      
      // Log the operation
      await this.logTokenOperation(userId, 'tokens_cleared', {});
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if a user is connected to HMRC
   * @param userId The user ID to check
   * @returns True if the user is connected to HMRC, false otherwise
   */
  public async isConnected(userId: string): Promise<boolean> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Check if token exists and is not expired in the hmrc_authorizations table
      const { data, error } = await supabase
        .from('hmrc_authorizations')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`Error checking HMRC connection for user ${userId}:`, error);
        return false;
      }
      
      if (!data || !data.access_token) {
        console.log(`No token found for user ${userId}. User is not connected.`);
        return false;
      }
      
      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;
      
      if (isExpired && data.refresh_token) {
        // If token is expired, try to refresh it
        console.log(`Token for user ${userId} is expired. Attempting to refresh...`);
        const refreshedToken = await this.refreshToken(userId);
        
        if (!refreshedToken) {
          console.log(`Failed to refresh token for user ${userId}. User is not connected.`);
          return false;
        }
        
        console.log(`Successfully refreshed token for user ${userId}. User is connected.`);
        return true;
      } else if (isExpired) {
        console.log(`Token for user ${userId} is expired and no refresh token available. User is not connected.`);
        return false;
      }
      
      console.log(`Valid token found for user ${userId}. User is connected.`);
      return true;
    } catch (error) {
      console.error('Error checking if user is connected:', error);
      return false;
    }
  }

  /**
   * Execute an API request with automatic token refresh
   * This is a utility function that handles token refreshing automatically
   */
  public async executeWithRetry<T>(
    userId: string, 
    apiCall: (token: string) => Promise<T>, 
    maxRetries = 2
  ): Promise<T> {
    // Ensure service is initialized
    await this.ensureInitialized();
    
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Get a valid token (will refresh if needed)
        const token = await this.getValidToken(userId);
        
        if (!token) {
          throw new Error('Failed to get a valid token');
        }
        
        // Execute the API call with the token
        return await apiCall(token);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if this is an auth error that can be fixed by refreshing the token
        const isAuthError = 
          lastError.message.includes('401') || 
          lastError.message.includes('unauthorized') || 
          lastError.message.includes('invalid_token');
        
        if (isAuthError && retryCount < maxRetries) {
          console.log(`Auth error detected, retrying (${retryCount + 1}/${maxRetries})...`);
          
          // Clear the token to force a refresh on the next attempt
          await this.clearTokens(userId);
          
          // Log the retry
          await this.logTokenOperation(userId, 'api_retry', {
            attempt: retryCount + 1,
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
   * Refresh an expired token
   */
  private async refreshToken(userId: string): Promise<TokenResponse | null> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get the current token data from the hmrc_authorizations table
      const { data: tokenData, error } = await supabase
        .from('hmrc_authorizations')
        .select('refresh_token')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`Error getting refresh token for user ${userId}:`, error);
        return null;
      }
      
      if (!tokenData || !tokenData.refresh_token) {
        console.error(`No refresh token found for user ${userId}`);
        return null;
      }
      
      // Exchange the refresh token for new tokens
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('refresh_token', tokenData.refresh_token);
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error refreshing token:', errorData);
        
        // If refresh fails, clear tokens and require re-authentication
        await this.clearTokens(userId);
        return null;
      }
      
      const newTokenData = await response.json() as TokenResponse;
      
      // Store the new tokens
      await this.storeTokens(userId, newTokenData);
      
      // Log the operation
      await this.logTokenOperation(userId, 'token_refreshed', {
        tokenType: newTokenData.token_type,
        scope: newTokenData.scope,
        expiresIn: newTokenData.expires_in
      });
      
      return newTokenData;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logTokenOperation(userId, 'refresh_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get a valid token for a user
   */
  private async getValidToken(userId: string): Promise<string | null> {
    try {
      // Ensure service is initialized
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get the latest token from the database
      const { data, error } = await supabase
        .from('hmrc_authorizations')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`Error retrieving token for user ${userId}:`, error);
        return null;
      }
      
      if (!data) {
        console.error(`No token found for user ${userId}`);
        return null;
      }
      
      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = now >= expiresAt;
      
      // If token is expired, refresh it
      if (isExpired) {
        console.log(`Token for user ${userId} is expired, refreshing...`);
        const refreshedToken = await this.refreshToken(userId);
        
        if (!refreshedToken) {
          console.error(`Failed to refresh token for user ${userId}`);
          return null;
        }
        
        return refreshedToken.access_token;
      }
      
      // If token exists and is valid, return it
      return data.access_token;
    } catch (error) {
      console.error('Error retrieving valid token:', error);
      return null;
    }
  }

  /**
   * Disconnect from HMRC (revoke tokens)
   */
  public async disconnect(userId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      // Create a Supabase client
      const supabase = createServerSupabaseClient();
      
      // Get the latest token from the database
      const { data, error } = await supabase
        .from('hmrc_authorizations')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`Error retrieving tokens for user ${userId}:`, error);
        return false;
      }
      
      if (data) {
        const tokenTypes = [];
        if (data.access_token) {
          await this.revokeToken(data.access_token, 'access_token');
          tokenTypes.push('access_token');
        }
        if (data.refresh_token) {
          await this.revokeToken(data.refresh_token, 'refresh_token');
          tokenTypes.push('refresh_token');
        }
        await this.logTokenOperation(userId, 'token_revocation', { token_types: tokenTypes });
      }
      
      // Delete the tokens from the database
      const { error: deleteError } = await supabase
        .from('hmrc_authorizations')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error(`Error deleting tokens for user ${userId}:`, deleteError);
        return false;
      }
      
      await this.logTokenOperation(userId, 'disconnect', { status: 'success' });
      return true;
    } catch (error) {
      console.error('Error disconnecting from HMRC:', error);
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
      await this.ensureInitialized();
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
      return response.ok;
    } catch (error) {
      console.error(`Error revoking ${tokenType}:`, error);
      return false;
    }
  }
}

/**
 * Create a Supabase client for server-side operations using the service role key
 * This bypasses cookie-based authentication and uses the service role directly
 */
function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[createServerSupabaseClient] Missing Supabase URL or service role key');
  }
  
  // Use createClient directly with the service role key
  // This avoids the cookie-related issues
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false // Don't persist the session as we're using service role
    }
  });
}
