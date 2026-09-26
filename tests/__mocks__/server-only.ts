// No-op stub for tests. The real 'server-only' package throws when imported
// outside Next.js's server compiler context, which includes Vitest's plain
// Node environment. Aliased in vitest.config.ts so route/lib logic that
// legitimately imports 'server-only' (correctly, for production safety) can
// still be unit-tested directly.
export {};
