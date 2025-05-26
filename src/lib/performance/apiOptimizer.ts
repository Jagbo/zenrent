/**
 * API Optimization Utilities
 * Provides request batching, debouncing, and intelligent caching for API calls
 */

import { apiCache } from './cacheManager';

// Request batching types
interface BatchRequest {
  id: string;
  endpoint: string;
  params: any;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  endpoint: string;
  batchProcessor: (requests: BatchRequest[]) => Promise<any[]>;
}

// Request batcher implementation
class RequestBatcher {
  private batches = new Map<string, BatchRequest[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private configs = new Map<string, BatchConfig>();

  registerBatchEndpoint(config: BatchConfig) {
    this.configs.set(config.endpoint, config);
  }

  async batchRequest<T>(endpoint: string, params: any): Promise<T> {
    const config = this.configs.get(endpoint);
    if (!config) {
      throw new Error(`No batch configuration found for endpoint: ${endpoint}`);
    }

    return new Promise<T>((resolve, reject) => {
      const request: BatchRequest = {
        id: `${endpoint}_${Date.now()}_${Math.random()}`,
        endpoint,
        params,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add to batch
      if (!this.batches.has(endpoint)) {
        this.batches.set(endpoint, []);
      }
      
      const batch = this.batches.get(endpoint)!;
      batch.push(request);

      // Process batch if it reaches max size
      if (batch.length >= config.maxBatchSize) {
        this.processBatch(endpoint);
        return;
      }

      // Set timer if not already set
      if (!this.timers.has(endpoint)) {
        const timer = setTimeout(() => {
          this.processBatch(endpoint);
        }, config.maxWaitTime);
        this.timers.set(endpoint, timer);
      }
    });
  }

  private async processBatch(endpoint: string) {
    const config = this.configs.get(endpoint);
    const batch = this.batches.get(endpoint);
    
    if (!config || !batch || batch.length === 0) {
      return;
    }

    // Clear timer and batch
    const timer = this.timers.get(endpoint);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(endpoint);
    }
    this.batches.set(endpoint, []);

    try {
      const results = await config.batchProcessor(batch);
      
      // Resolve individual requests
      batch.forEach((request, index) => {
        if (results[index]) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error('No result for request'));
        }
      });
    } catch (error) {
      // Reject all requests in batch
      batch.forEach(request => {
        request.reject(error as Error);
      });
    }
  }
}

// Global request batcher
export const requestBatcher = new RequestBatcher();

// Debounced API calls
interface DebounceConfig {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

class DebouncedFunction<T extends (...args: any[]) => Promise<any>> {
  private timeoutId: NodeJS.Timeout | null = null;
  private maxTimeoutId: NodeJS.Timeout | null = null;
  private lastCallTime = 0;
  private lastArgs: Parameters<T> | null = null;
  private pendingPromises: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    private func: T,
    private config: Required<DebounceConfig>
  ) {}

  async call(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      this.lastArgs = args;
      this.lastCallTime = Date.now();
      
      // Add to pending promises
      this.pendingPromises.push({ resolve, reject });

      // Clear existing timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Execute immediately if leading edge
      if (this.config.leading && this.pendingPromises.length === 1) {
        this.execute();
        return;
      }

      // Set up debounced execution
      this.timeoutId = setTimeout(() => {
        if (this.config.trailing) {
          this.execute();
        }
      }, this.config.delay);

      // Set up max wait timeout
      if (this.config.maxWait && !this.maxTimeoutId) {
        this.maxTimeoutId = setTimeout(() => {
          this.execute();
        }, this.config.maxWait);
      }
    });
  }

  private async execute() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.maxTimeoutId) {
      clearTimeout(this.maxTimeoutId);
      this.maxTimeoutId = null;
    }

    const promises = this.pendingPromises.splice(0);
    const args = this.lastArgs;

    if (!args || promises.length === 0) {
      return;
    }

    try {
      const result = await this.func(...args);
      promises.forEach(({ resolve }) => resolve(result));
    } catch (error) {
      promises.forEach(({ reject }) => reject(error));
    }
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.maxTimeoutId) {
      clearTimeout(this.maxTimeoutId);
      this.maxTimeoutId = null;
    }

    // Reject all pending promises
    const promises = this.pendingPromises.splice(0);
    promises.forEach(({ reject }) => reject(new Error('Debounced function cancelled')));
  }
}

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number,
  options: Partial<DebounceConfig> = {}
): DebouncedFunction<T> {
  const config: Required<DebounceConfig> = {
    delay,
    maxWait: options.maxWait ?? delay * 5,
    leading: options.leading ?? false,
    trailing: options.trailing ?? true
  };

  return new DebouncedFunction(func, config);
}

// Intelligent request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 1000
  ): Promise<T> {
    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after completion
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, ttl);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  cancel(key: string) {
    this.pendingRequests.delete(key);
  }

  cancelAll() {
    this.pendingRequests.clear();
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Smart retry mechanism
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
    onRetry
  } = config;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if condition fails
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      onRetry?.(attempt, error);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Optimized fetch wrapper
interface OptimizedFetchConfig {
  useCache?: boolean; // Renamed to avoid conflict with RequestInit.cache
  cacheTtl?: number;
  deduplicate?: boolean;
  retry?: Partial<RetryConfig>;
  timeout?: number;
  batch?: string; // Batch endpoint name
}

export async function optimizedFetch<T>(
  url: string,
  options: RequestInit & OptimizedFetchConfig = {}
): Promise<T> {
  const {
    useCache = true,
    cacheTtl = 5 * 60 * 1000,
    deduplicate = true,
    retry,
    timeout = 30000,
    batch,
    ...fetchOptions
  } = options;

  const cacheKey = `fetch_${url}_${JSON.stringify(fetchOptions)}`;

  // Check cache first
  if (useCache && fetchOptions.method !== 'POST') {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached as T;
    }
  }

  // Create fetch function
  const fetchFn = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      if (useCache && fetchOptions.method !== 'POST') {
        apiCache.set(cacheKey, data, cacheTtl);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Apply optimizations
  let finalFetchFn = fetchFn;

  // Add retry logic
  if (retry) {
    finalFetchFn = () => retryWithBackoff(fetchFn, retry);
  }

  // Add deduplication
  if (deduplicate) {
    return requestDeduplicator.deduplicate(cacheKey, finalFetchFn);
  }

  return finalFetchFn();
}

// Performance monitoring
interface PerformanceMetrics {
  requestCount: number;
  totalTime: number;
  averageTime: number;
  cacheHits: number;
  cacheHitRate: number;
  errors: number;
  errorRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalTime: 0,
    averageTime: 0,
    cacheHits: 0,
    cacheHitRate: 0,
    errors: 0,
    errorRate: 0
  };

  recordRequest(duration: number, fromCache: boolean = false, error: boolean = false) {
    this.metrics.requestCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.requestCount;

    if (fromCache) {
      this.metrics.cacheHits++;
    }

    if (error) {
      this.metrics.errors++;
    }

    this.metrics.cacheHitRate = this.metrics.cacheHits / this.metrics.requestCount;
    this.metrics.errorRate = this.metrics.errors / this.metrics.requestCount;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      requestCount: 0,
      totalTime: 0,
      averageTime: 0,
      cacheHits: 0,
      cacheHitRate: 0,
      errors: 0,
      errorRate: 0
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hooks for optimized API calls
export function useOptimizedFetch<T>(
  url: string | null,
  options: OptimizedFetchConfig = {},
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!url) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    optimizedFetch<T>(url, options)
      .then(result => {
        if (!cancelled) {
          setData(result);
          performanceMonitor.recordRequest(
            performance.now() - startTime,
            false, // We don't track cache hits here
            false
          );
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          performanceMonitor.recordRequest(
            performance.now() - startTime,
            false,
            true
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, ...dependencies]);

  return { data, loading, error };
}

// Batch configuration for common endpoints
requestBatcher.registerBatchEndpoint({
  endpoint: '/api/properties/batch',
  maxBatchSize: 10,
  maxWaitTime: 100,
  batchProcessor: async (requests) => {
    const propertyIds = requests.map(req => req.params.id);
    const response = await fetch('/api/properties/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: propertyIds })
    });
    return response.json();
  }
});

requestBatcher.registerBatchEndpoint({
  endpoint: '/api/transactions/batch',
  maxBatchSize: 20,
  maxWaitTime: 150,
  batchProcessor: async (requests) => {
    const transactionIds = requests.map(req => req.params.id);
    const response = await fetch('/api/transactions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: transactionIds })
    });
    return response.json();
  }
});

// Import React for hooks
import React from 'react'; 