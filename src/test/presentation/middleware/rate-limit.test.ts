import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { rateLimitMiddleware } from '../../../presentation/middleware/rate-limit.middleware.ts';
import { RateLimitError } from '../../../types/errors.ts';

Deno.test('Rate Limit Middleware', async (t) => {
  await t.step('should allow requests within limit for unauthenticated users', async () => {
    const mockCtx = {
      request: { ip: '127.0.0.1' },
      response: { headers: new Headers() },
      state: {},
    } as unknown as Context;

    // Should allow 30 requests
    for (let i = 0; i < 30; i++) {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
      assertEquals(mockCtx.response.headers.has('X-RateLimit-Limit'), true);
      assertEquals(mockCtx.response.headers.get('X-RateLimit-Limit'), '30');
    }
  });

  await t.step('should block requests over limit for unauthenticated users', async () => {
    const mockCtx = {
      request: { ip: '127.0.0.2' },
      response: { headers: new Headers() },
      state: {},
    } as unknown as Context;

    // Make 30 requests (the limit)
    for (let i = 0; i < 30; i++) {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
    }

    // The 31st request should fail
    try {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
      throw new Error('Expected rate limit error');
    } catch (error) {
      if (!(error instanceof RateLimitError)) {
        throw new Error('Expected RateLimitError but got different error');
      }
      assertEquals(error.message.includes('Rate limit exceeded'), true);
    }
  });

  await t.step('should allow more requests for authenticated users', async () => {
    const mockCtx = {
      request: { ip: '127.0.0.3' },
      response: { headers: new Headers() },
      state: { user: { id: 'test-user' } },
    } as unknown as Context;

    // Should allow 100 requests
    for (let i = 0; i < 100; i++) {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
      assertEquals(mockCtx.response.headers.has('X-RateLimit-Limit'), true);
      assertEquals(mockCtx.response.headers.get('X-RateLimit-Limit'), '100');
    }
  });

  await t.step('should block requests over limit for authenticated users', async () => {
    const mockCtx = {
      request: { ip: '127.0.0.4' },
      response: { headers: new Headers() },
      state: { user: { id: 'test-user-2' } },
    } as unknown as Context;

    // Make 100 requests (the limit)
    for (let i = 0; i < 100; i++) {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
    }

    // The 101st request should fail
    try {
      await rateLimitMiddleware(mockCtx, () => Promise.resolve());
      throw new Error('Expected rate limit error');
    } catch (error) {
      if (!(error instanceof RateLimitError)) {
        throw new Error('Expected RateLimitError but got different error');
      }
      assertEquals(error.message.includes('Rate limit exceeded'), true);
    }
  });
});
