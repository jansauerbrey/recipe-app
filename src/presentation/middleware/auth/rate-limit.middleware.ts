import { Context } from "oak";
import { RateLimitError } from "../../../types/errors.ts";

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
}

// In-memory store for rate limiting
// In production, you'd want to use Redis or similar
const ipHits = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipHits.entries()) {
    if (data.resetTime <= now) {
      ipHits.delete(ip);
    }
  }
}, 60000); // Clean up every minute

// Default config: 100 requests per minute
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100
};

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const options: RateLimitConfig = { ...defaultConfig, ...config };

  return async function(ctx: Context, next: () => Promise<void>) {
    const ip = ctx.request.headers.get("x-forwarded-for") || 
               ctx.request.headers.get("x-real-ip") ||
               ctx.request.headers.get("cf-connecting-ip") ||
               "unknown";
    const now = Date.now();

    // Get or create rate limit data for this IP
    let data = ipHits.get(ip);
    if (!data || data.resetTime <= now) {
      data = {
        count: 0,
        resetTime: now + options.windowMs
      };
      ipHits.set(ip, data);
    }

    // Increment request count
    data.count++;

    // Set rate limit headers
    ctx.response.headers.set("X-RateLimit-Limit", options.max.toString());
    ctx.response.headers.set("X-RateLimit-Remaining", Math.max(0, options.max - data.count).toString());
    ctx.response.headers.set("X-RateLimit-Reset", Math.ceil(data.resetTime / 1000).toString());

    // Check if rate limit exceeded
    if (data.count > options.max) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      ctx.response.headers.set("Retry-After", retryAfter.toString());
      throw new RateLimitError();
    }

    await next();
  };
}

// Helper to get current rate limit status for an IP
export function getRateLimitStatus(ip: string): {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} {
  const data = ipHits.get(ip);
  const now = Date.now();

  if (!data || data.resetTime <= now) {
    return {
      remaining: defaultConfig.max,
      resetTime: now + defaultConfig.windowMs,
      isLimited: false
    };
  }

  return {
    remaining: Math.max(0, defaultConfig.max - data.count),
    resetTime: data.resetTime,
    isLimited: data.count > defaultConfig.max
  };
}

// Helper to reset rate limit for an IP
export function resetRateLimit(ip: string): void {
  ipHits.delete(ip);
}
