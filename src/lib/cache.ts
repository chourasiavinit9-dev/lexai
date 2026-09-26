import 'server-only';
import { createHash } from 'crypto';
import { Firestore } from '@google-cloud/firestore';
import { CACHE_TTL_MS } from './constants';
import { isFirestoreCacheEnabled, getFirestoreProjectId } from './env';
import { log } from './logger';
import type { CacheEntry } from './types';

/** Two-tier cache: Cloud Firestore when FIRESTORE_CACHE_ENABLED=true and a
 *  GOOGLE_CLOUD_PROJECT is configured (persists across restarts and scales
 *  across multiple Cloud Run instances), falling back to a per-instance
 *  in-memory Map otherwise (correct for local dev and single-instance demos,
 *  but does not share state across instances or survive a restart). */

const memoryStore = new Map<string, CacheEntry<unknown>>();
const FIRESTORE_COLLECTION = 'lexai_cache';

let firestoreClient: Firestore | null = null;
function getFirestoreClient(): Firestore {
  if (!firestoreClient) {
    firestoreClient = new Firestore({ projectId: getFirestoreProjectId() });
  }
  return firestoreClient;
}

export function hashInput(input: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
    .slice(0, 20);
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (isFirestoreCacheEnabled()) {
    try {
      const doc = await getFirestoreClient().collection(FIRESTORE_COLLECTION).doc(key).get();
      if (!doc.exists) return null;
      const entry = doc.data() as CacheEntry<T>;
      if (Date.now() > entry.expiresAt) {
        await doc.ref.delete();
        return null;
      }
      return entry.data;
    } catch (err) {
      log.warn('firestore_cache_read_failed', { message: (err as Error).message });
      // Fall through to memory below rather than failing the request.
    }
  }

  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + CACHE_TTL_MS };

  if (isFirestoreCacheEnabled()) {
    try {
      await getFirestoreClient().collection(FIRESTORE_COLLECTION).doc(key).set(entry);
      return;
    } catch (err) {
      log.warn('firestore_cache_write_failed', { message: (err as Error).message });
      // Fall through to memory below rather than failing the request.
    }
  }

  memoryStore.set(key, entry);
}
