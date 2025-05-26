/**
 * Cache Manager
 * Provides comprehensive caching strategies for API calls, data, and assets
 */

import React from 'react';

// Cache configuration types
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
  persistent?: boolean; // Use localStorage/sessionStorage
  compression?: boolean; // Compress cached data
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

// In-memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100,
      strategy: config.strategy || 'lru',
      persistent: config.persistent || false,
      compression: config.compression || false
    };
  }

  set(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.config.ttl;
    const size = this.calculateSize(data);

    // Remove expired items first
    this.cleanup();

    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      size
    };

    this.cache.set(key, item);

    // Persist to storage if configured
    if (this.config.persistent) {
      this.persistItem(key, item);
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      // Try to load from persistent storage
      if (this.config.persistent) {
        const persistedItem = this.loadPersistedItem(key);
        if (persistedItem && !this.isExpired(persistedItem)) {
          this.cache.set(key, persistedItem);
          return this.updateAccessStats(persistedItem).data;
        }
      }
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.removePersistedItem(key);
      return null;
    }

    return this.updateAccessStats(item).data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (this.config.persistent) {
      this.removePersistedItem(key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    if (this.config.persistent) {
      this.clearPersistentStorage();
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  getStats() {
    const items = Array.from(this.cache.values());
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const avgAccessCount = items.reduce((sum, item) => sum + item.accessCount, 0) / items.length || 0;

    return {
      itemCount: this.cache.size,
      totalSize,
      avgAccessCount,
      hitRate: this.calculateHitRate(),
      oldestItem: Math.min(...items.map(item => item.timestamp)),
      newestItem: Math.max(...items.map(item => item.timestamp))
    };
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private updateAccessStats(item: CacheItem<T>): CacheItem<T> {
    item.accessCount++;
    item.lastAccessed = Date.now();
    return item;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.removePersistedItem(key);
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;
    const entries = Array.from(this.cache.entries());

    switch (this.config.strategy) {
      case 'lru':
        // Least Recently Used
        keyToEvict = entries.reduce((oldest, [key, item]) => {
          const [oldestKey, oldestItem] = oldest;
          return item.lastAccessed < oldestItem.lastAccessed ? [key, item] : oldest;
        })[0];
        break;

      case 'lfu':
        // Least Frequently Used
        keyToEvict = entries.reduce((least, [key, item]) => {
          const [leastKey, leastItem] = least;
          return item.accessCount < leastItem.accessCount ? [key, item] : least;
        })[0];
        break;

      case 'fifo':
      default:
        // First In, First Out
        keyToEvict = entries.reduce((oldest, [key, item]) => {
          const [oldestKey, oldestItem] = oldest;
          return item.timestamp < oldestItem.timestamp ? [key, item] : oldest;
        })[0];
        break;
    }

    this.delete(keyToEvict);
  }

  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1; // Fallback size
    }
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0;
  }

  private persistItem(key: string, item: CacheItem<T>): void {
    try {
      const storage = this.config.persistent ? localStorage : sessionStorage;
      const cacheKey = `cache_${key}`;
      const serialized = JSON.stringify(item);
      storage.setItem(cacheKey, serialized);
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  private loadPersistedItem(key: string): CacheItem<T> | null {
    try {
      const storage = this.config.persistent ? localStorage : sessionStorage;
      const cacheKey = `cache_${key}`;
      const serialized = storage.getItem(cacheKey);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.warn('Failed to load persisted cache item:', error);
      return null;
    }
  }

  private removePersistedItem(key: string): void {
    try {
      const storage = this.config.persistent ? localStorage : sessionStorage;
      const cacheKey = `cache_${key}`;
      storage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove persisted cache item:', error);
    }
  }

  private clearPersistentStorage(): void {
    try {
      const storage = this.config.persistent ? localStorage : sessionStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }
}

// Cache manager with multiple cache instances
export class CacheManager {
  private caches = new Map<string, MemoryCache<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'lru',
    persistent: false,
    compression: false
  };

  createCache<T>(name: string, config?: CacheConfig): MemoryCache<T> {
    const cache = new MemoryCache<T>({ ...this.defaultConfig, ...config });
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): MemoryCache<T> | null {
    return this.caches.get(name) || null;
  }

  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      return this.caches.delete(name);
    }
    return false;
  }

  clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    this.caches.clear();
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Predefined caches for common use cases
export const apiCache = cacheManager.createCache('api', {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  strategy: 'lru'
});

export const userDataCache = cacheManager.createCache('userData', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 20,
  strategy: 'lru',
  persistent: true
});

export const taxCalculationCache = cacheManager.createCache('taxCalculations', {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 10,
  strategy: 'lru',
  persistent: true
});

export const hmrcDataCache = cacheManager.createCache('hmrcData', {
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 30,
  strategy: 'lru'
});

// Cache decorators and utilities
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    cache?: MemoryCache<any>;
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
  } = {}
): T {
  const cache = options.cache || apiCache;
  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      cache.set(key, result, options.ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}

// React hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cache?: MemoryCache<T>;
    ttl?: number;
    dependencies?: any[];
  } = {}
) {
  const cache = options.cache || apiCache;
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = cache.get(key);
        if (cached !== null && !cancelled) {
          setData(cached as T);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const result = await fetcher();
        if (!cancelled) {
          cache.set(key, result, options.ttl);
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [key, ...(options.dependencies || [])]);

  const invalidate = () => {
    cache.delete(key);
  };

  const refresh = () => {
    cache.delete(key);
    setLoading(true);
  };

  return { data, loading, error, invalidate, refresh };
}

// Cache warming utilities
export const cacheWarmer = {
  warmApiCache: async (endpoints: Array<{ key: string; fetcher: () => Promise<any> }>) => {
    const promises = endpoints.map(async ({ key, fetcher }) => {
      try {
        if (!apiCache.has(key)) {
          const data = await fetcher();
          apiCache.set(key, data);
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  },

  warmUserData: async (userId: string, fetchers: Record<string, () => Promise<any>>) => {
    const promises = Object.entries(fetchers).map(async ([dataType, fetcher]) => {
      try {
        const key = `${userId}_${dataType}`;
        if (!userDataCache.has(key)) {
          const data = await fetcher();
          userDataCache.set(key, data);
        }
      } catch (error) {
        console.warn(`Failed to warm user data cache for ${dataType}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
};

 