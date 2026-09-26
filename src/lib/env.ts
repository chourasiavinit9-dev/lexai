
/** Fail-fast environment validation. Throws a clear error at first use
 *  rather than letting a missing key surface as a cryptic Gemini 401 deep
 *  inside a request. Values are read lazily (not at module load) so that
 *  builds and tests that never call these paths don't require real keys. */

export function requireGeminiApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in .env.local (see .env.example) ' +
      'or in your deployment platform\u2019s environment variables.'
    );
  }
  return key;
}

export function requireOpenRouterKey(): string {
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Set it in .env.local.'
    );
  }
  return key;
}

/** Whether Firestore-backed persistent caching is enabled. Off by default —
 *  falls back to in-memory caching, which is fine for a single instance but
 *  does not survive restarts or scale across multiple Cloud Run instances. */
export function isFirestoreCacheEnabled(): boolean {
  return process.env.FIRESTORE_CACHE_ENABLED === 'true' && Boolean(process.env.GOOGLE_CLOUD_PROJECT);
}

export function getFirestoreProjectId(): string | undefined {
  return process.env.GOOGLE_CLOUD_PROJECT;
}
