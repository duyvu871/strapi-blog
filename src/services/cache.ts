import NodeCache from 'node-cache';

// Default cache configuration
const DEFAULT_TTL = 600; // 10 minutes in seconds

/**
 * Cache service for storing frequent API responses
 * Configurable TTL (Time To Live) for different types of data
 */
class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    // Initialize cache with standard settings
    this.cache = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // For better performance with large objects
    });
  }

  /**
   * Get singleton instance of the cache service
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache by key
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Custom TTL in seconds (optional)
   * @returns Success status
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || DEFAULT_TTL);
  }

  /**
   * Delete a key from cache
   * @param key Cache key
   * @returns Success status
   */
  public delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  public flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get stats about the cache usage
   */
  public stats() {
    return this.cache.getStats();
  }
}

export const cacheService = CacheService.getInstance();