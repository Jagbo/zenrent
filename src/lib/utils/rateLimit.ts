/**
 * Simple in-memory rate limiter for API and authentication requests
 * This helps prevent brute-force attacks and abuse of the API
 */

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
}

interface RateLimitRecord {
  count: number;       // Number of requests made
  lastRequest: number; // Timestamp of the last request
  windowStart: number; // Timestamp when the current window started
}

/**
 * Creates a rate limiter with specified configuration
 */
export function rateLimit(config: RateLimitConfig) {
  // Store rate limit records in memory, keyed by identifier (IP, user ID, etc.)
  const records = new Map<string, RateLimitRecord>();
  
  // Clean up old records periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    records.forEach((record, key) => {
      if (now - record.windowStart > config.windowMs * 2) {
        records.delete(key);
      }
    });
  }, config.windowMs * 2); // Clean up every 2 windows
  
  // Ensure cleanup interval doesn't prevent Node from exiting
  cleanupInterval.unref();
  
  return {
    /**
     * Check if a request is allowed based on rate limits
     * @param identifier - Unique identifier for the requestor (IP, user ID, etc.)
     * @returns Object indicating if request is allowed and retry-after time if not
     */
    async check(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
      const now = Date.now();
      
      // Get or create record for this identifier
      let record = records.get(identifier);
      if (!record) {
        record = {
          count: 0,
          lastRequest: now,
          windowStart: now
        };
        records.set(identifier, record);
      }
      
      // Check if window has expired and reset if needed
      if (now - record.windowStart > config.windowMs) {
        record.count = 0;
        record.windowStart = now;
      }
      
      // Increment request count and update last request time
      record.count++;
      record.lastRequest = now;
      
      // Check if over limit
      if (record.count <= config.maxRequests) {
        return { allowed: true };
      }
      
      // Calculate time until next window
      const retryAfter = Math.ceil((record.windowStart + config.windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter
      };
    },
    
    /**
     * Reset rate limit counter for an identifier
     * @param identifier - Unique identifier to reset
     */
    reset(identifier: string): void {
      records.delete(identifier);
    },
    
    /**
     * Get current rate limit state for an identifier
     * @param identifier - Unique identifier to check
     * @returns Current rate limit information or null if no records exist
     */
    getState(identifier: string): { remaining: number; resetAt: Date } | null {
      const record = records.get(identifier);
      if (!record) return null;
      
      const now = Date.now();
      
      // If window has expired, return fresh state
      if (now - record.windowStart > config.windowMs) {
        return {
          remaining: config.maxRequests,
          resetAt: new Date(now + config.windowMs)
        };
      }
      
      // Calculate remaining requests and reset time
      const remaining = Math.max(0, config.maxRequests - record.count);
      const resetAt = new Date(record.windowStart + config.windowMs);
      
      return { remaining, resetAt };
    }
  };
} 