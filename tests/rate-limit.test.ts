import { describe, it, expect } from 'vitest';
import { checkRateLimit, extractClientId, pruneStaleClients } from '../src/lib/rate-limit';

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const result = checkRateLimit('client-a');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('blocks a client after exceeding the limit within the window', () => {
    const clientId = `client-${Math.random()}`;
    let lastResult;
    for (let i = 0; i < 25; i++) {
      lastResult = checkRateLimit(clientId);
    }
    expect(lastResult?.allowed).toBe(false);
    expect(lastResult?.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate clients independently', () => {
    const clientA = `independent-a-${Math.random()}`;
    const clientB = `independent-b-${Math.random()}`;
    for (let i = 0; i < 20; i++) checkRateLimit(clientA);
    const resultA = checkRateLimit(clientA);
    const resultB = checkRateLimit(clientB);
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('decrements remaining count on each allowed request', () => {
    const clientId = `decrement-${Math.random()}`;
    const first = checkRateLimit(clientId);
    const second = checkRateLimit(clientId);
    expect(second.remaining).toBe(first.remaining - 1);
  });
});

describe('extractClientId', () => {
  it('reads x-forwarded-for header when present', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
    });
    expect(extractClientId(req)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '198.51.100.7' },
    });
    expect(extractClientId(req)).toBe('198.51.100.7');
  });

  it('returns "unknown" when no IP headers are present', () => {
    const req = new Request('https://example.com');
    expect(extractClientId(req)).toBe('unknown');
  });
});

describe('pruneStaleClients', () => {
  it('runs without throwing on an empty or populated bucket map', () => {
    checkRateLimit('prune-test-client');
    expect(() => pruneStaleClients()).not.toThrow();
  });
});
