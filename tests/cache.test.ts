import { describe, it, expect } from 'vitest';
import { getCache, setCache, hashInput } from '../src/lib/cache';

// FIRESTORE_CACHE_ENABLED is unset in the test environment, so these tests
// exercise the in-memory fallback path — the same path used in local dev
// and any single-instance deployment that hasn't opted into Firestore.

describe('hashInput', () => {
  it('produces a stable hash for the same input', () => {
    const a = hashInput({ foo: 'bar', n: 1 });
    const b = hashInput({ foo: 'bar', n: 1 });
    expect(a).toBe(b);
  });

  it('produces different hashes for different input', () => {
    const a = hashInput({ foo: 'bar' });
    const b = hashInput({ foo: 'baz' });
    expect(a).not.toBe(b);
  });

  it('returns a 20-character hex string', () => {
    const h = hashInput({ x: 1 });
    expect(h).toMatch(/^[0-9a-f]{20}$/);
  });
});

describe('getCache / setCache (in-memory fallback)', () => {
  it('returns null for a key that was never set', async () => {
    const result = await getCache(`nonexistent-${Math.random()}`);
    expect(result).toBeNull();
  });

  it('returns the stored value after setCache', async () => {
    const key = `roundtrip-${Math.random()}`;
    await setCache(key, { message: 'hello' });
    const result = await getCache<{ message: string }>(key);
    expect(result).toEqual({ message: 'hello' });
  });

  it('overwrites a previous value for the same key', async () => {
    const key = `overwrite-${Math.random()}`;
    await setCache(key, { v: 1 });
    await setCache(key, { v: 2 });
    const result = await getCache<{ v: number }>(key);
    expect(result).toEqual({ v: 2 });
  });
});
