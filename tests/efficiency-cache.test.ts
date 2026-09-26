import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientLRUCache, fastHash, createCacheKey } from '@/lib/client-cache';

describe('Efficiency Suite: Client-Side LRU Cache & Hashing', () => {
  let cache: ClientLRUCache;

  beforeEach(() => {
    cache = new ClientLRUCache(3, 1000); // Max 3 items, 1 second TTL
  });

  it('computes deterministic FNV-1a fast hashes for arbitrary text', () => {
    const hash1 = fastHash('Non-Disclosure Agreement 2026');
    const hash2 = fastHash('Non-Disclosure Agreement 2026');
    const hashDiff = fastHash('Employment Agreement 2026');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
    expect(hash1.length).toBe(8);
  });

  it('generates consistent cache keys with prefix and length salt', () => {
    const key = createCacheKey('understand', { text: 'Contract text', level: 'standard' });
    expect(key).toMatch(/^understand:[a-f0-9]{8}:\d+$/);
  });

  it('stores and retrieves cached items instantly (0ms latency)', () => {
    cache.set('key1', { analysis: 'Safe Contract', riskScore: 10 });
    const cached = cache.get<{ analysis: string; riskScore: number }>('key1');

    expect(cached).toBeDefined();
    expect(cached?.analysis).toBe('Safe Contract');
    expect(cached?.riskScore).toBe(10);
  });

  it('returns null for missing or expired cache entries', async () => {
    cache.set('expiringKey', { data: 123 }, 50); // 50ms TTL

    expect(cache.get('expiringKey')).toBeDefined();

    // Wait 70ms for TTL to expire
    await new Promise(r => setTimeout(r, 70));
    expect(cache.get('expiringKey')).toBeNull();
  });

  it('evicts least recently accessed items when capacity limit is reached', () => {
    cache.set('item1', 'first');
    cache.set('item2', 'second');
    cache.set('item3', 'third');

    // Access item1 to make item2 the oldest accessed
    cache.get('item1');

    // Insert 4th item — should evict item2
    cache.set('item4', 'fourth');

    expect(cache.get('item1')).toBe('first');
    expect(cache.get('item2')).toBeNull(); // evicted
    expect(cache.get('item3')).toBe('third');
    expect(cache.get('item4')).toBe('fourth');
  });

  it('coalesces multiple concurrent identical requests into a single execution', async () => {
    const expensiveOperation = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 40));
      return { result: 'Extracted Legal Summary', timestamp: Date.now() };
    });

    // Fire 3 simultaneous concurrent calls for the same key
    const [call1, call2, call3] = await Promise.all([
      cache.coalesce<{ result: string; timestamp: number }>('sharedKey', expensiveOperation),
      cache.coalesce<{ result: string; timestamp: number }>('sharedKey', expensiveOperation),
      cache.coalesce<{ result: string; timestamp: number }>('sharedKey', expensiveOperation),
    ]);

    // Function should only have been called ONCE
    expect(expensiveOperation).toHaveBeenCalledTimes(1);

    // All callers receive the exact same resolved payload
    expect(call1).toEqual(call2);
    expect(call2).toEqual(call3);
    expect(call1.result).toBe('Extracted Legal Summary');

    // Subsequent retrieval comes directly from cache without calling operation again
    const postCall = await cache.coalesce<{ result: string; timestamp: number }>('sharedKey', expensiveOperation);
    expect(expensiveOperation).toHaveBeenCalledTimes(1);
    expect(postCall.result).toBe('Extracted Legal Summary');
  });
});
