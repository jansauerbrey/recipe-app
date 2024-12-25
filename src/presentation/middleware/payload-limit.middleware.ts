import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { PayloadTooLargeError } from '../../types/errors.ts';

interface PayloadLimitConfig {
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
    form: 5 * 1024 * 1024, // 5MB for file uploads
  },
};

export const payloadLimitMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
) => {
  const contentType = ctx.request.headers.get('content-type')?.toLowerCase() || '';
  const contentLength = parseInt(ctx.request.headers.get('content-length') || '0', 10);

  // Get route-specific limits or default limits
  const routeLimits = ROUTE_SPECIFIC_LIMITS[ctx.request.url.pathname] || DEFAULT_LIMITS;

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

  // For multipart/form-data, we need to check the actual payload size
  if (contentType.includes('multipart/form-data')) {
    const body = ctx.request.body();
    if (body.type === 'form-data') {
      const formData = await body.value;
      let totalSize = 0;

      // Use type assertion since we know it's FormData
      const form = formData as unknown as FormData;
      for (const value of form.values()) {
        if (typeof value === 'string') {
          totalSize += value.length;
        } else if (value instanceof File) {
          totalSize += value.size;
        }

        if (totalSize > limit) {
          throw new PayloadTooLargeError(undefined, limit);
        }
      }
    }
  }

  await next();
};
