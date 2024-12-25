import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context, Request } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { rateLimitMiddleware } from '../../../presentation/middleware/rate-limit.middleware.ts';
import { RateLimitError } from '../../../types/errors.ts';

// Create a minimal mock Request type that satisfies the requirements
type MockRequest = Pick<Request, 'url' | 'ip'>;

// Create a type that represents our test context
type TestState = {
  user?: {
    id: string;
  };
};

// Create a partial mock context with only the properties we need
type MockContext = Pick<Context<TestState>, 'request' | 'response' | 'state'> & {
  request: MockRequest;
  response: {
    headers: Headers;
  };
  state: TestState;
};

const createMockContext = (ip: string, userId?: string): MockContext => {
  const ctx = {
    request: {
      ip,
      url: new URL('http://localhost/test'),
    },
    response: {
      headers: new Headers(),
    },
    state: userId ? { user: { id: userId } } : {},
  } as MockContext;

  return ctx;
};

Deno.test('Rate Limit Middleware', async (t) => {
  await t.step('should allow requests within limit for unauthenticated users', async () => {
    const mockCtx = createMockContext('127.0.0.1');
    const mockNext = (): Promise<void> => Promise.resolve();

    // Should allow 200 requests (unauthenticated limit)
    for (let i = 0; i < 200; i++) {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
      assertEquals(mockCtx.response.headers.has('X-RateLimit-Limit'), true);
      assertEquals(mockCtx.response.headers.get('X-RateLimit-Limit'), '200');
    }
  });

  await t.step('should block requests over limit for unauthenticated users', async () => {
    const mockCtx = createMockContext('127.0.0.2');
    const mockNext = (): Promise<void> => Promise.resolve();

    // Make 200 requests (the unauthenticated limit)
    for (let i = 0; i < 200; i++) {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
    }

    // The 201st request should fail
    await assertRateLimitError(async () => {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
    });
  });

  await t.step('should allow more requests for authenticated users', async () => {
    const mockCtx = createMockContext('127.0.0.3', 'test-user');
    const mockNext = (): Promise<void> => Promise.resolve();

    // Should allow 100 requests
    for (let i = 0; i < 100; i++) {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
      assertEquals(mockCtx.response.headers.has('X-RateLimit-Limit'), true);
      assertEquals(mockCtx.response.headers.get('X-RateLimit-Limit'), '100');
    }
  });

  await t.step('should block requests over limit for authenticated users', async () => {
    const mockCtx = createMockContext('127.0.0.4', 'test-user-2');
    const mockNext = (): Promise<void> => Promise.resolve();

    // Make 100 requests (the limit)
    for (let i = 0; i < 100; i++) {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
    }

    // The 101st request should fail
    await assertRateLimitError(async () => {
      await rateLimitMiddleware(mockCtx as unknown as Context, mockNext);
    });
  });
});

async function assertRateLimitError(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    throw new Error('Expected rate limit error');
  } catch (error) {
    if (!(error instanceof RateLimitError)) {
      throw new Error('Expected RateLimitError but got different error');
    }
    assertEquals(error.message.includes('Rate limit exceeded'), true);
  }
}
