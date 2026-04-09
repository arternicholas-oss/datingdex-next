/**
 * Simple in-memory rate limiter.
 * For production, swap this with Upstash Redis (@upstash/ratelimit).
 * This version works on Vercel serverless (per-instance, best-effort).
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Pre-configured rate limiters
export function rateLimitPlan(userId: string) {
  // Free tier: 5 plans/day, Premium: 30 plans/day
  return rateLimit(`plan:${userId}`, 30, 24 * 60 * 60 * 1000);
}

export function rateLimitReview(userId: string) {
  // 10 reviews/day for any tier
  return rateLimit(`review:${userId}`, 10, 24 * 60 * 60 * 1000);
}

export function rateLimitApi(ip: string) {
  // General API: 100 requests/minute per IP
  return rateLimit(`api:${ip}`, 100, 60 * 1000);
}
