/**
 * Token data structure
 */
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * Token audit action types
 */
export type TokenAuditAction = 
  | 'store'
  | 'retrieve'
  | 'refresh'
  | 'delete'
  | 'rotate'
  | 'token_exchange_failed'
  | 'token_refresh_failed'
  | 'token_validation_failed';

/**
 * Token audit log entry
 */
export interface TokenAuditLog {
  id: string;
  user_id: string;
  provider: string;
  action: TokenAuditAction;
  ip_address: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Token access control policy
 */
export interface TokenAccessPolicy {
  role: string;
  actions: TokenAuditAction[];
}

/**
 * Token rotation policy
 */
export interface TokenRotationPolicy {
  provider: string;
  rotationIntervalDays: number;
  lastRotatedAt?: string;
}
