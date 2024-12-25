import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { RateLimitError } from '../../types/errors.ts';
import { createMiddleware } from '../../types/middleware.ts';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: Date;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: number;

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  check(key: string): { allowed: boolean; resetTime: Date } {
    const now = new Date();
    let entry = this.store.get(key);

    // If no entry exists or the entry has expired, create a new one
    if (!entry || entry.resetTime < now) {
      const resetTime = new Date(now.getTime() + this.config.windowMs);
      entry = { count: 1, resetTime };
      this.store.set(key, entry);
      return { allowed: true, resetTime };
    }

    // Check if we've hit the limit
    if (entry.count >= this.config.max) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    // Increment counter and update store
    entry.count++;
    this.store.set(key, entry);
    return { allowed: true, resetTime: entry.resetTime };
  }

  close() {
    clearInterval(this.cleanupInterval);
  }
}

// Default config: 100 requests per minute for authenticated users, 30 for unauthenticated
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
};

const unauthenticatedConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
};

const authenticatedLimiter = new RateLimiter(defaultConfig);
const unauthenticatedLimiter = new RateLimiter(unauthenticatedConfig);

export const rateLimitMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
  const isAuthenticated = ctx.state.user !== undefined;
  const limiter = isAuthenticated ? authenticatedLimiter : unauthenticatedLimiter;

  // Use IP address and user ID (if authenticated) as rate limit key
  const ip = ctx.request.ip;
  const userId = isAuthenticated ? ctx.state.user.id : '';
  const key = `${ip}-${userId}`;

  const { allowed, resetTime } = limiter.check(key);

  // Set rate limit headers
  ctx.response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
  ctx.response.headers.set(
    'X-RateLimit-Limit',
    isAuthenticated ? defaultConfig.max.toString() : unauthenticatedConfig.max.toString(),
  );

  if (!allowed) {
    throw new RateLimitError(
      'Rate limit exceeded. Please try again later.',
      resetTime,
    );
  }

  await next();
};
