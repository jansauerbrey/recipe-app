import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { PayloadTooLargeError } from '../../../types/errors.ts';
import { payloadLimitMiddleware } from '../../../presentation/middleware/payload-limit.middleware.ts';

Deno.test('Payload Limit Middleware', async (t) => {
  await t.step('should allow requests within JSON limit', async () => {
    const mockCtx = {
      request: {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/json',
          'content-length': '1024', // 1KB
        }),
        url: new URL('http://localhost/api/test'),
      },
    } as unknown as Context;

    await payloadLimitMiddleware(mockCtx, () => Promise.resolve());
  });

  await t.step('should block JSON requests exceeding limit', async () => {
    const mockCtx = {
      request: {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/json',
          'content-length': (200 * 1024).toString(), // 200KB (exceeds 100KB limit)
        }),
        url: new URL('http://localhost/api/test'),
      },
    } as unknown as Context;

    await assertRejects(
      () => payloadLimitMiddleware(mockCtx, () => Promise.resolve()),
      PayloadTooLargeError,
    );
  });

  await t.step('should allow requests within form limit', async () => {
    const mockCtx = {
      request: {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data',
          'content-length': (400 * 1024).toString(), // 400KB
        }),
        url: new URL('http://localhost/api/test'),
        body: () => ({
          type: 'form-data',
          value: new FormData(),
        }),
      },
    } as unknown as Context;

    await payloadLimitMiddleware(mockCtx, () => Promise.resolve());
  });

  await t.step('should block form requests exceeding limit', async () => {
    const mockCtx = {
      request: {
        method: 'POST',
        headers: new Headers({
          'content-type': 'multipart/form-data',
          'content-length': (600 * 1024).toString(), // 600KB (exceeds 500KB limit)
        }),
        url: new URL('http://localhost/api/test'),
        body: () => ({
          type: 'form-data',
          value: new FormData(),
        }),
      },
    } as unknown as Context;

    await assertRejects(
      () => payloadLimitMiddleware(mockCtx, () => Promise.resolve()),
      PayloadTooLargeError,
    );
  });

  await t.step('should allow requests with route-specific limits', async () => {
    const mockCtx = {
      request: {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/json',
          'content-length': (400 * 1024).toString(), // 400KB
        }),
        url: new URL('http://localhost/api/recipes'),
      },
    } as unknown as Context;

    await payloadLimitMiddleware(mockCtx, () => Promise.resolve());
  });

  await t.step('should skip check for GET requests', async () => {
    const mockCtx = {
      request: {
        method: 'GET',
        headers: new Headers({
          'content-length': (1024 * 1024 * 10).toString(), // 10MB
        }),
        url: new URL('http://localhost/api/test'),
      },
    } as unknown as Context;

    await payloadLimitMiddleware(mockCtx, () => Promise.resolve());
  });
});
