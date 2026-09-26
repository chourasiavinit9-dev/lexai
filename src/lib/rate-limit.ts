import 'server-only';
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from './constants';

/** Simple in-memory sliding-window rate limiter, keyed by client IP.
 *  Protects the Gemini API budget from abuse (a single client hammering
 *  /api/understand with large documents is the realistic threat model for
 *  a public, unauthenticated demo). Not a substitute for infrastructure-level
 *  rate limiting (e.g. Cloud Armor) in a production deployment behind
 *  Cloud Run, but genuinely effective against casual abuse and load spikes. */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const bucket = buckets.get(clientId) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = bucket.timestamps[0];
    buckets.set(clientId, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldestInWindow + RATE_LIMIT_WINDOW_MS - now,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(clientId, bucket);
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - bucket.timestamps.length,
    retryAfterMs: 0,
  };
}

/** Periodic cleanup so the Map doesn't grow unbounded across long-running
 *  Cloud Run instances. Called opportunistically from checkRateLimit's
 *  callers rather than on a timer, to avoid keeping the process alive. */
export function pruneStaleClients(): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  for (const [id, bucket] of Array.from(buckets.entries())) {
    bucket.timestamps = bucket.timestamps.filter((t: number) => t > windowStart);
    if (bucket.timestamps.length === 0) buckets.delete(id);
  }
}

export function extractClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
