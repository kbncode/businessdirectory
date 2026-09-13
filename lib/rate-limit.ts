import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
}

function hasRealUpstashCredentials() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ---------- In-memory fallback ----------
// Lets rate limiting work in local dev (and this session's testing) without
// a real Upstash database. Per-process state only — doesn't survive restarts
// and isn't shared across serverless instances, so it is NOT sufficient in
// production. Upstash is used automatically once real credentials are set.
const memoryStore = new Map<string, number[]>();

function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const timestamps = (memoryStore.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    return { success: false, limit, remaining: 0, reset: timestamps[0] + windowMs };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);
  return { success: true, limit, remaining: limit - timestamps.length, reset: now + windowMs };
}

// ---------- Upstash-backed sliding window ----------
let redisClient: Redis | null = null;
function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });
  }
  return redisClient;
}

const limiterCache = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowSeconds: number) {
  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: "kbn-ratelimit",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Sliding-window rate limit check. `identifier` should already include
 * enough context to be unique per route + client (e.g. `register:203.0.113.4`)
 * so limits on different actions don't share a bucket.
 */
export async function rateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  if (!hasRealUpstashCredentials()) {
    return memoryRateLimit(`${identifier}:${limit}:${windowSeconds}`, limit, windowSeconds);
  }

  const limiter = getLimiter(limit, windowSeconds);
  const result = await limiter.limit(identifier);
  return { success: result.success, limit: result.limit, remaining: result.remaining, reset: result.reset };
}

/** Extracts the client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/** Same, for Server Actions (no Request object — reads from next/headers()). */
export function getClientIpFromHeaders(): string {
  const headerList = headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return headerList.get("x-real-ip") || "unknown";
}

function formatRetryMessage(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return {
    retryAfterSeconds,
    message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  };
}

/** Builds a 429 JSON response with a plain-language retry message, for API routes. */
export function rateLimitResponse(result: RateLimitResult) {
  const { retryAfterSeconds, message } = formatRetryMessage(result);
  return NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } });
}

/** Same message, for Server Actions that report errors via form state instead of HTTP status. */
export function rateLimitMessage(result: RateLimitResult) {
  return formatRetryMessage(result).message;
}
