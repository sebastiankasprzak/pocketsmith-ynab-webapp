/**
 * Intelligent caching service for API responses
 * Implements memory-based caching with TTL and size limits
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  enablePersistence?: boolean; // Whether to persist to localStorage
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly enablePersistence: boolean;
  private readonly storageKey = 'pocketsmith-ynab-cache';

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.enablePersistence = options.enablePersistence || false;

    // Load from localStorage if persistence is enabled
    if (this.enablePersistence) {
      this.loadFromStorage();
    }

    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  /**
   * Set cached data with optional TTL override
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    };

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.saveToStorage();
    }
    
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: entries.filter(entry => now - entry.timestamp > entry.ttl).length,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length 
        : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Refresh cache entry by re-fetching data
   */
  async refresh<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Preload data into cache
   */
  async preload<T>(entries: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        this.set(key, data, ttl);
      } catch (error) {
        // Silently fail cache preload
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // Rough string size
      size += JSON.stringify(entry.data).length * 2; // Rough data size
      size += 64; // Overhead for entry metadata
    }
    
    return size;
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.enablePersistence) return;
    
    try {
      const serializable = Array.from(this.cache.entries()).map(([key, entry]) => [
        key,
        {
          ...entry,
          // Only persist if not expired and recently accessed
          persist: Date.now() - entry.timestamp < entry.ttl && 
                  Date.now() - entry.lastAccessed < 24 * 60 * 60 * 1000 // 24 hours
        }
      ]).filter(([, entry]) => (entry as any).persist);
      
      localStorage.setItem(this.storageKey, JSON.stringify(serializable));
    } catch (error) {
      // Silently fail localStorage save
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      
      const entries = JSON.parse(stored);
      const now = Date.now();
      
      for (const [key, entry] of entries) {
        // Only load if not expired
        if (now - entry.timestamp < entry.ttl) {
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      // Silently fail localStorage load
    }
  }
}

// Create cache instances for different data types
export const apiCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes for API responses
  maxSize: 50,
  enablePersistence: true
});

export const balanceCache = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for balance data (more frequent updates)
  maxSize: 20,
  enablePersistence: false // Don't persist balance data
});

export const accountCache = new CacheService({
  ttl: 15 * 60 * 1000, // 15 minutes for account data (changes less frequently)
  maxSize: 30,
  enablePersistence: true
});

export const syncStatusCache = new CacheService({
  ttl: 30 * 1000, // 30 seconds for sync status (real-time data)
  maxSize: 10,
  enablePersistence: false
});

// Cache key generators
export const CacheKeys = {
  accounts: {
    pocketsmith: () => 'accounts:pocketsmith',
    ynab: () => 'accounts:ynab',
    mappings: () => 'accounts:mappings'
  },
  balances: {
    comparison: () => 'balances:comparison',
    pocketsmith: (accountId: string) => `balances:pocketsmith:${accountId}`,
    ynab: (accountId: string) => `balances:ynab:${accountId}`
  },
  sync: {
    status: () => 'sync:status',
    history: (page: number = 1) => `sync:history:${page}`,
    progress: (syncId: string) => `sync:progress:${syncId}`
  }
};

export { CacheService };