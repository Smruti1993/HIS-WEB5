/**
 * rateLimiter.ts
 *
 * In-memory sliding-window rate limiter per user.
 * Limit: 20 messages per minute per userId.
 *
 * ⚠️  PRODUCTION NOTE: In-memory rate limiting applies per-process.
 * In a multi-instance/clustered environment, use Redis (e.g. via ioredis or redis-rate-limiter).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const userRequests = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  let record = userRequests.get(userId);

  if (!record) {
    record = { timestamps: [] };
    userRequests.set(userId, record);
  }

  // Filter out timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterSec = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(retryAfterSec, 1),
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.timestamps.length,
  };
}

// Periodically clean up idle users every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of userRequests.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);
    if (record.timestamps.length === 0) {
      userRequests.delete(userId);
    }
  }
}, 5 * 60 * 1000).unref();
