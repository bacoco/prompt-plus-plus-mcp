import type { CacheEntry } from './types.js';
import { logger } from './logger.js';

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;

  constructor(defaultTtl = 300000) { // 5 minutes default TTL
    this.defaultTtl = defaultTtl;
  }

  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    };
    
    this.cache.set(key, entry);
    logger.debug(`Cache set: ${key}`, { ttl: entry.ttl });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (entry.ttl && age > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`, { age, ttl: entry.ttl });
      return null;
    }

    logger.debug(`Cache hit: ${key}`, { age });
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (entry.ttl && age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return result;
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (entry.ttl && age > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: ${cleaned} entries removed`);
    }

    return cleaned;
  }
}