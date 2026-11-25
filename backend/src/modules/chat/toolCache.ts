/**
 * toolCache.ts
 *
 * Lightweight in-memory cache for read-only tool calls.
 * TTL: 30 seconds. Identical args → identical key → cached result.
 * Fine for development. Move to Redis for multi-instance production.
 */

interface CacheEntry {
  result: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 30_000;

/** Build a stable cache key from tool name + sorted args. */
export function buildCacheKey(toolName: string, args: Record<string, unknown>): string {
  const sortedArgs = Object.keys(args)
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: args[k] }), {});
  return `${toolName}:${JSON.stringify(sortedArgs)}`;
}

/** Return cached result or null if missing/expired. */
export function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

/** Store a result. */
export function setCached(key: string, result: unknown): void {
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Evict all expired entries (call periodically if needed). */
export function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}

