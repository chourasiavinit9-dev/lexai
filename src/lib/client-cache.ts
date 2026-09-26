/**
 * client-cache.ts — High-Efficiency In-Memory LRU Cache & Request Coalescer
 *
 * Designed for client-side static deployments:
 * 1. 0ms instant retrieval for previously analyzed documents and clauses.
 * 2. In-flight request coalescing (prevents duplicate simultaneous calls).
 * 3. LRU eviction with automatic TTL expiration to prevent memory bloat.
 * 4. Lightweight, zero-dependency hashing (works in all browser/node environments).
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  lastAccessed: number;
}

/** 32-bit FNV-1a fast string hash */
export function fastHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // 32-bit FNV prime multiplication
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Generate a deterministic cache key from arbitrary input */
export function createCacheKey(prefix: string, payload: unknown): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${prefix}:${fastHash(serialized)}:${serialized.length}`;
}

export class ClientLRUCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inflight = new Map<string, Promise<unknown>>();
  private accessCounter = 0;

  constructor(
    private readonly maxEntries = 64,
    private readonly defaultTtlMs = 30 * 60 * 1000 // 30 minutes
  ) {}

  /** Retrieve an item from cache if present and unexpired */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh monotonically increasing access counter for strict LRU ordering
    entry.lastAccessed = ++this.accessCounter;
    return entry.data;
  }

  /** Store an item in the cache with LRU eviction if full */
  set<T>(key: string, data: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: ++this.accessCounter,
    });
  }

  /** Request coalescing: reuse an ongoing promise for the same key */
  async coalesce<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // 1. Check memory cache first
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    // 2. Check if identical request is already in flight
    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    // 3. Initiate and track the in-flight request
    const promise = fetchFn()
      .then((result) => {
        this.set(key, result);
        return result;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return promise;
  }

  /** Evict the least recently accessed entry */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.store.forEach((v, k) => {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    });

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /** Current number of active entries */
  size(): number {
    return this.store.size;
  }

  /** Clear all cached entries and in-flight promises */
  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }
}

/** Global singleton client cache instance */
export const clientCache = new ClientLRUCache(64, 30 * 60 * 1000);
