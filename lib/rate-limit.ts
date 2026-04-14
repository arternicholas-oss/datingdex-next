/**
 * Three-tier free-plan funnel:
 *   1. Pure anonymous       \u2014 1 plan per IP (then email wall)
 *   2. Email captured       \u2014 1 more plan per email (then signup wall)
 *   3. Authenticated free   \u2014 1 more plan (then paywall)
 *   4. Premium              \u2014 unlimited
 *
 * IP-based anon counts + email-capture counts are persisted in Supabase so
 * they survive across serverless instances. In-memory guards are layered on
 * top for burst protection.
 */

import crypto from 'node:crypto';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
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

// Burst guard for the POST /api/plan endpoint (e.g., prevent 100 reqs/sec)
export function rateLimitPlan(userId: string) {
  return rateLimit(`plan:${userId}`, 30, 24 * 60 * 60 * 1000);
}

export function rateLimitReview(userId: string) {
  return rateLimit(`review:${userId}`, 10, 24 * 60 * 60 * 1000);
}

export function rateLimitApi(ip: string) {
  return rateLimit(`api:${ip}`, 100, 60 * 1000);
}

// ------------------------------------------------------------
// Three-tier funnel helpers
// ------------------------------------------------------------

export const FREE_PLAN_LIMITS = {
  anon: 1, // fully anonymous \u2014 no email
  email: 1, // after email capture
  signed: 1, // after signup, before paywall
} as const;

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'datingdex-salt-v1';
  return crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 32);
}

export function extractIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  return (fwd.split(',')[0] || '').trim() || 'anon';
}
