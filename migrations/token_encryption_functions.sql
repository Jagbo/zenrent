-- Purpose: Create database functions for secure token handling with encryption
-- These functions will be used by the hmrcAuthService for secure token operations

-- Function to insert or update encryption key (admin only)
CREATE OR REPLACE FUNCTION manage_encryption_key(
  p_key_name TEXT,
  p_key_value TEXT
) RETURNS VOID AS $$
BEGIN
  -- This will insert a new key or update an existing one
  INSERT INTO encryption_keys (key_name, key_value)
  VALUES (p_key_name, p_key_value)
  ON CONFLICT (key_name)
  DO UPDATE SET 
    key_value = p_key_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get encryption key by name (system use only)
CREATE OR REPLACE FUNCTION get_encryption_key(
  p_key_name TEXT
) RETURNS TEXT AS $$
DECLARE
  v_key_value TEXT;
BEGIN
  SELECT key_value INTO v_key_value
  FROM encryption_keys
  WHERE key_name = p_key_name;
  
  IF v_key_value IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found: %', p_key_name;
  END IF;
  
  RETURN v_key_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely store HMRC tokens with encryption
CREATE OR REPLACE FUNCTION store_hmrc_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMPTZ,
  p_scope TEXT DEFAULT 'read:self-assessment write:self-assessment'
) RETURNS VOID AS $$
DECLARE
  v_encryption_key TEXT;
  v_access_token_iv BYTEA;
  v_refresh_token_iv BYTEA;
BEGIN
  -- Set search path to prevent SQL injection
  SET LOCAL search_path TO public, pg_temp;
  
  -- Get the encryption key
  v_encryption_key := get_encryption_key('hmrc_token_key');
  
  -- Generate IVs for encryption
  v_access_token_iv := gen_random_bytes(16);
  v_refresh_token_iv := gen_random_bytes(16);
  
  -- Encrypt tokens using pgcrypto and store with their IVs
  INSERT INTO hmrc_authorizations (
    user_id,
    access_token,
    access_token_iv,
    refresh_token,
    refresh_token_iv,
    expires_at,
    scope,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    ENCODE(ENCRYPT_IV(p_access_token::bytea, v_encryption_key::bytea, v_access_token_iv), 'base64'),
    v_access_token_iv,
    ENCODE(ENCRYPT_IV(p_refresh_token::bytea, v_encryption_key::bytea, v_refresh_token_iv), 'base64'),
    v_refresh_token_iv,
    p_expires_at,
    p_scope,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id)
  DO UPDATE SET
    access_token = ENCODE(ENCRYPT_IV(p_access_token::bytea, v_encryption_key::bytea, v_access_token_iv), 'base64'),
    access_token_iv = v_access_token_iv,
    refresh_token = ENCODE(ENCRYPT_IV(p_refresh_token::bytea, v_encryption_key::bytea, v_refresh_token_iv), 'base64'),
    refresh_token_iv = v_refresh_token_iv,
    expires_at = p_expires_at,
    scope = p_scope,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted access token
CREATE OR REPLACE FUNCTION get_decrypted_access_token(
  p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_encrypted_token TEXT;
  v_token_iv BYTEA;
  v_encryption_key TEXT;
BEGIN
  -- Set search path to prevent SQL injection
  SET LOCAL search_path TO public, pg_temp;
  
  -- Get the encryption key
  v_encryption_key := get_encryption_key('hmrc_token_key');
  
  -- Get the encrypted token and IV
  SELECT access_token, access_token_iv INTO v_encrypted_token, v_token_iv
  FROM hmrc_authorizations
  WHERE user_id = p_user_id;
  
  IF v_encrypted_token IS NULL OR v_token_iv IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return decrypted token using the stored IV
  RETURN CONVERT_FROM(
    DECRYPT_IV(
      DECODE(v_encrypted_token, 'base64'),
      v_encryption_key::bytea,
      v_token_iv
    ),
    'UTF8'
  );
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't expose details
    RAISE NOTICE 'Error decrypting access token: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get decrypted refresh token
CREATE OR REPLACE FUNCTION get_decrypted_refresh_token(
  p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_encrypted_token TEXT;
  v_token_iv BYTEA;
  v_encryption_key TEXT;
BEGIN
  -- Set search path to prevent SQL injection
  SET LOCAL search_path TO public, pg_temp;
  
  -- Get the encryption key
  v_encryption_key := get_encryption_key('hmrc_token_key');
  
  -- Get the encrypted token and IV
  SELECT refresh_token, refresh_token_iv INTO v_encrypted_token, v_token_iv
  FROM hmrc_authorizations
  WHERE user_id = p_user_id;
  
  IF v_encrypted_token IS NULL OR v_token_iv IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return decrypted token using the stored IV
  RETURN CONVERT_FROM(
    DECRYPT_IV(
      DECODE(v_encrypted_token, 'base64'),
      v_encryption_key::bytea,
      v_token_iv
    ),
    'UTF8'
  );
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't expose details
    RAISE NOTICE 'Error decrypting refresh token: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log token operations for audit
CREATE OR REPLACE FUNCTION log_token_operation(
  p_user_id UUID,
  p_operation TEXT,
  p_details JSONB DEFAULT '{}'::JSONB,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Set search path to prevent SQL injection
  SET LOCAL search_path TO public, pg_temp;
  
  INSERT INTO hmrc_auth_audit_logs (
    user_id,
    operation,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_user_id,
    p_operation,
    p_details,
    p_ip_address,
    p_user_agent,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 