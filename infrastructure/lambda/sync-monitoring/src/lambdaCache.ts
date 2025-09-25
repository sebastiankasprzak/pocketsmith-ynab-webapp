/**
 * In-memory cache for Lambda functions
 * Persists across invocations within the same execution context
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
  hits: number;
}

export class LambdaCache {
  private static instance: LambdaCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 50; // Prevent memory bloat

  static getInstance(): LambdaCache {
    if (!LambdaCache.instance) {
      LambdaCache.instance = new LambdaCache();
    }
    return LambdaCache.instance;
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached data if valid
    if (cached && now < cached.expiry) {
      cached.hits++;
      console.log(`Cache HIT for key: ${key} (hits: ${cached.hits})`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`Cache MISS for key: ${key}, fetching fresh data`);
    const data = await fetcher();

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
      console.log(`Evicted cache entry: ${oldestKey}`);
    }

    // Store in cache
    this.cache.set(key, {
      data,
      expiry: now + (ttlSeconds * 1000),
      hits: 0
    });

    return data;
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      console.log('Cache cleared completely');
      return;
    }

    const regex = new RegExp(keyPattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        console.log(`Invalidated cache entry: ${key}`);
      }
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.expiry)) : null
    };
  }
}

// Cache key generators for consistency
export const CacheKeys = {
  pocketsmithAccounts: (userId: string) => `ps_accounts:${userId}`,
  ynabAccounts: (userId: string, budgetId: string) => `ynab_accounts:${userId}:${budgetId}`,
  accountMappings: (userId: string) => `mappings:${userId}`,
  balanceComparison: (userId: string) => `balances:${userId}`,
  syncState: (userId: string) => `sync_state:${userId}`,
  accountNames: (userId: string) => `account_names:${userId}`,
};