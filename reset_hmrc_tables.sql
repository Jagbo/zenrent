CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS hmrc_auth_requests CASCADE;
DROP TABLE IF EXISTS hmrc_authorizations CASCADE;
DROP TABLE IF EXISTS hmrc_auth_audit_logs CASCADE;
DROP TABLE IF EXISTS hmrc_error_logs CASCADE;
DROP TABLE IF EXISTS encryption_keys CASCADE;
DROP TABLE IF EXISTS hmrc_authorizations_backup CASCADE;

DROP FUNCTION IF EXISTS store_hmrc_tokens;
DROP FUNCTION IF EXISTS get_decrypted_access_token;
DROP FUNCTION IF EXISTS get_decrypted_refresh_token;
DROP FUNCTION IF EXISTS log_token_operation;
DROP FUNCTION IF EXISTS manage_encryption_key;
DROP FUNCTION IF EXISTS get_encryption_key;
DROP FUNCTION IF EXISTS cleanup_expired_hmrc_auth_requests;

