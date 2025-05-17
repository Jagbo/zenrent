/**
 * API Rate Limiter utility to prevent hitting API rate limits
 * Implements a simple token bucket algorithm for rate limiting
 */

interface RateLimitConfig {
  tokensPerInterval: number;  // How many tokens (requests) are added per interval
  interval: number;           // Interval in milliseconds
  maxTokens?: number;         // Maximum number of tokens that can be accumulated
}

export class ApiRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: Required<RateLimitConfig>;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      maxTokens: config.tokensPerInterval,
      ...config
    };
    
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
  }
  
  /**
   * Refills tokens based on time elapsed since last refill
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.config.interval) * this.config.tokensPerInterval;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
  
  /**
   * Checks if a request can be made and consumes a token if possible
   * @returns true if request can be made, false otherwise
   */
  public canMakeRequest(): boolean {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }
  
  /**
   * Waits until a request can be made and then consumes a token
   * @returns Promise that resolves when a request can be made
   */
  public async waitForToken(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    
    // Calculate time to wait for next token
    const timeToNextToken = this.config.interval / this.config.tokensPerInterval;
    
    // Wait for the calculated time
    await new Promise(resolve => setTimeout(resolve, timeToNextToken));
    
    // Try again after waiting
    return this.waitForToken();
  }
  
  /**
   * Executes a function with rate limiting
   * @param fn Function to execute
   * @returns Promise that resolves with the result of the function
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForToken();
    return fn();
  }
}

// Create rate limiters for different APIs
export const propertyDataRateLimiter = new ApiRateLimiter({
  tokensPerInterval: 4,  // PropertyData allows 4 requests per 10 seconds
  interval: 10000,       // 10 seconds in milliseconds
  maxTokens: 4
});

export const epcRateLimiter = new ApiRateLimiter({
  tokensPerInterval: 2,  // EPC API is slower, so limit to 2 requests per 5 seconds
  interval: 5000,        // 5 seconds in milliseconds
  maxTokens: 2
});
