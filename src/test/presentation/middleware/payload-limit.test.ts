import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context, State } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { PayloadTooLargeError } from '../../../types/errors.ts';
import { payloadLimitMiddleware } from '../../../presentation/middleware/payload-limit.middleware.ts';

interface MockRequestBody {
  type: string;
  value: FormData;
}

interface MockRequest {
  method: string;
  headers: Headers;
  url: URL;
  body?: () => MockRequestBody;
}

// Create a more complete mock context type
type TestState = Record<string, unknown>;
type TestContext = Omit<Context<TestState>, 'request'> & {
  request: MockRequest;
  response: {
    headers: Headers;
  };
  state: TestState;
};

const createMockContext = (
  method: string,
  contentType: string,
  contentLength: number,
  path = '/api/test',
  withFormData = false,
): TestContext => {
  const ctx = {
    request: {
      method,
      headers: new Headers({
        'content-type': contentType,
        'content-length': contentLength.toString(),
      }),
      url: new URL(`http://localhost${path}`),
      ...(withFormData && {
        body: () => ({
          type: 'form-data',
          value: new FormData(),
        }),
      }),
    },
    response: {
      headers: new Headers(),
      status: 200,
      body: undefined,
    },
    state: {},
    app: {},
    cookies: new Map(),
    isUpgradable: false,
    respond: () => Promise.resolve(),
    upgrade: () => {
      throw new Error('Not implemented');
    },
    assert: () => undefined,
    throw: () => undefined,
  } as unknown as TestContext;

  return ctx;
};

const assertPayloadError = async (ctx: TestContext, fn: () => Promise<void>): Promise<void> => {
  await fn();
  assertEquals(ctx.response.status, 413);
  const body = ctx.response.body as { error: string; status: number };
  assertEquals(body.status, 413);
  assertEquals(typeof body.error === 'string' && body.error.includes('Request payload too large'), true);
};

Deno.test('Payload Limit Middleware', async (t) => {
  await t.step('should allow requests within JSON limit', async () => {
    const mockCtx = createMockContext('POST', 'application/json', 1024);
    const mockNext = (): Promise<void> => Promise.resolve();

    await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
  });

  await t.step('should block JSON requests exceeding limit', async () => {
    const mockCtx = createMockContext('POST', 'application/json', 200 * 1024); // 200KB (exceeds 100KB limit)
    const mockNext = (): Promise<void> => Promise.resolve();

    await assertPayloadError(mockCtx, async () => {
      await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
    });
  });

  await t.step('should allow requests within form limit', async () => {
    const mockCtx = createMockContext('POST', 'multipart/form-data', 400 * 1024, '/api/test', true);
    const mockNext = (): Promise<void> => Promise.resolve();

    await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
  });

  await t.step('should block form requests exceeding limit', async () => {
    const mockCtx = createMockContext('POST', 'multipart/form-data', 600 * 1024, '/api/test', true);
    const mockNext = (): Promise<void> => Promise.resolve();

    await assertPayloadError(mockCtx, async () => {
      await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
    });
  });

  await t.step('should allow requests with route-specific limits', async () => {
    const mockCtx = createMockContext('POST', 'application/json', 400 * 1024, '/api/recipes');
    const mockNext = (): Promise<void> => Promise.resolve();

    await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
  });

  await t.step('should skip check for GET requests', async () => {
    const mockCtx = createMockContext('GET', 'application/json', 10 * 1024 * 1024);
    const mockNext = (): Promise<void> => Promise.resolve();

    await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
  });

  await t.step('should handle text content type', async () => {
    const mockCtx = createMockContext('POST', 'text/plain', 40 * 1024); // Under 50KB limit
    const mockNext = (): Promise<void> => Promise.resolve();

    await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
  });

  await t.step('should block oversized text content', async () => {
    const mockCtx = createMockContext('POST', 'text/plain', 60 * 1024); // Over 50KB limit
    const mockNext = (): Promise<void> => Promise.resolve();

    await assertPayloadError(mockCtx, async () => {
      await payloadLimitMiddleware(mockCtx as unknown as Context<State>, mockNext);
    });
  });
});
