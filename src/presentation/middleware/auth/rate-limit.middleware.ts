import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware } from '../../../types/middleware.ts';
import { RateLimitError } from '../../../types/errors.ts';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (ctx: Context) => string;
  skip?: (ctx: Context) => boolean;
  handler?: (ctx: Context) => Promise<void>;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  statusCode: Status.TooManyRequests,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
};

const hits = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate a key for rate limiting based on IP address
 */
function defaultKeyGenerator(ctx: Context): string {
  return ctx.request.ip;
}

/**
 * Check if request should be skipped
 */
function defaultSkip(_ctx: Context): boolean {
  return false;
}

/**
 * Default rate limit exceeded handler
 */
async function defaultHandler(ctx: Context): Promise<void> {
  const retryAfter = Math.ceil(
    (hits.get(ctx.request.ip)?.resetTime || 0) - Date.now()
  ) / 1000;

  ctx.response.status = Status.TooManyRequests;
  ctx.response.headers.set('Retry-After', retryAfter.toString());
  throw new RateLimitError('Too many requests', new Date(Date.now() + retryAfter * 1000));
}

/**
 * Create rate limiting middleware
 */
export function rateLimit(options: Partial<RateLimitConfig> = {}): AppMiddleware {
  const config = { ...defaultConfig, ...options };
  const keyGen = config.keyGenerator || defaultKeyGenerator;
  const skip = config.skip || defaultSkip;
  const handler = config.handler || defaultHandler;

  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    if (skip(ctx)) {
      await next();
      return;
    }

    const key = keyGen(ctx);
    const now = Date.now();
    const resetTime = now + config.windowMs;

    let hit = hits.get(key);
    if (!hit || hit.resetTime <= now) {
      hit = { count: 0, resetTime };
    }

    hit.count++;
    hits.set(key, hit);

    // Set rate limit headers
    const rateLimitInfo: RateLimitInfo = {
      limit: config.max,
      current: hit.count,
      remaining: Math.max(0, config.max - hit.count),
      resetTime: new Date(hit.resetTime),
    };

    ctx.response.headers.set('X-RateLimit-Limit', config.max.toString());
    ctx.response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    ctx.response.headers.set('X-RateLimit-Reset', Math.ceil(hit.resetTime / 1000).toString());

    if (hit.count > config.max) {
      await handler(ctx);
      return;
    }

    try {
      await next();

      // Optionally skip successful requests
      if (
        config.skipSuccessfulRequests &&
        ctx.response.status >= 200 &&
        ctx.response.status < 300
      ) {
        hit.count--;
        hits.set(key, hit);
      }
    } catch (error) {
      // Optionally skip failed requests
      if (config.skipFailedRequests) {
        hit.count--;
        hits.set(key, hit);
      }
      throw error;
    }
  };
}
