import { PayloadTooLargeError } from '../../types/errors.ts';
import { createMiddleware } from '../../types/middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export interface PayloadLimitConfig {
  json?: number; // JSON payload limit in bytes
  form?: number; // Form data limit in bytes
  text?: number; // Text payload limit in bytes
  raw?: number; // Raw payload limit in bytes
}

// Default limits must have all values defined
const DEFAULT_LIMITS: Required<PayloadLimitConfig> = {
  json: 100 * 1024, // 100KB for JSON
  form: 500 * 1024, // 500KB for form data
  text: 50 * 1024, // 50KB for text
  raw: 1024 * 1024, // 1MB for raw data
};

  // Routes that need different limits
const ROUTE_SPECIFIC_LIMITS: Record<string, PayloadLimitConfig> = {
  '/api/recipes': {
    json: 500 * 1024, // 500KB for recipe data (might include base64 images)
  },
  '/api/upload': {
    form: 10 * 1024 * 1024, // 10MB for file uploads
  },
};

// Route patterns for dynamic routes
const ROUTE_PATTERNS = {
  UPLOAD: /^\/api\/upload\/[^\/]+$/,  // Matches /api/upload/{id}
};

/**
 * Middleware to limit payload size based on content type and route
 */
const payloadLimitHandler = async (ctx: ControllerContext, next: () => Promise<unknown>) => {
  // Ensure request and headers exist
  if (!ctx.request?.headers) {
    await next();
    return;
  }

  const contentType = ctx.request.headers.get('content-type')?.toLowerCase() ?? '';
  const contentLength = parseInt(ctx.request.headers.get('content-length') ?? '0', 10);

  // Get route-specific limits
  const pathname = ctx.request.url.pathname;
  let routeLimits: PayloadLimitConfig = {};
  
  // Check exact matches first
  if (pathname in ROUTE_SPECIFIC_LIMITS) {
    routeLimits = ROUTE_SPECIFIC_LIMITS[pathname];
  } 
  // Then check patterns
  else if (ROUTE_PATTERNS.UPLOAD.test(pathname)) {
    routeLimits = ROUTE_SPECIFIC_LIMITS['/api/upload'];
  }

  // Merge with default limits
  routeLimits = {
    ...DEFAULT_LIMITS,
    ...routeLimits,
  };

  // Skip payload check for GET and HEAD requests
  if (['GET', 'HEAD'].includes(ctx.request.method)) {
    await next();
    return;
  }

  // Determine limit based on content type
  let limit: number = DEFAULT_LIMITS.raw; // Default to raw limit

  if (contentType.includes('application/json')) {
    limit = routeLimits.json ?? DEFAULT_LIMITS.json;
  } else if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    limit = routeLimits.form ?? DEFAULT_LIMITS.form;
  } else if (contentType.includes('text/')) {
    limit = routeLimits.text ?? DEFAULT_LIMITS.text;
  }

  if (contentLength > limit) {
    throw new PayloadTooLargeError(undefined, limit);
  }


  await next();
};

export const payloadLimitMiddleware = createMiddleware(payloadLimitHandler);
