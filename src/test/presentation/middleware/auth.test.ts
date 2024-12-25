import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import {
  adminOnly,
  authMiddleware,
  generateToken,
} from '../../../presentation/middleware/auth.middleware.ts';
import { AppRouterContext } from '../../../types/middleware.ts';

interface MockRequest {
  method: string;
  url: URL;
  headers: Headers;
}

interface MockResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

interface MockState {
  user?: {
    id: string;
    role: string;
  };
}

type MockContext = Pick<AppRouterContext, 'request' | 'response' | 'state'> & {
  request: MockRequest;
  response: MockResponse;
  state: MockState;
};

function createMockContext(
  token?: string,
  method = 'GET',
  path = '/test',
): MockContext {
  return {
    request: {
      method,
      url: new URL(`http://localhost${path}`),
      headers: new Headers(
        token ? { Authorization: token } : undefined
      ),
    },
    response: {
      status: Status.OK,
      body: null,
      headers: new Headers(),
    },
    state: {},
  } as MockContext;
}

Deno.test('Auth Middleware', async (t) => {
  await t.step('should pass with valid token', async () => {
    const token = await generateToken('test-user', 'user');
    const mockCtx = createMockContext(token);
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, true);
    assertEquals(mockCtx.response.status, Status.OK);
    assertExists(mockCtx.state.user);
    assertEquals(mockCtx.state.user.id, 'test-user');
    assertEquals(mockCtx.state.user.role, 'user');
  });

  await t.step('should fail with missing token', async () => {
    const mockCtx = createMockContext();
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, false);
    assertEquals(mockCtx.response.status, Status.Unauthorized);
    assertEquals(
      (mockCtx.response.body as { error: string }).error,
      'No authorization token provided'
    );
  });

  await t.step('should fail with invalid token format', async () => {
    const mockCtx = createMockContext('invalid-token');
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, false);
    assertEquals(mockCtx.response.status, Status.Unauthorized);
    assertEquals(
      (mockCtx.response.body as { error: string }).error,
      'Invalid authorization header format'
    );
  });

  await t.step('should fail with invalid token', async () => {
    const mockCtx = createMockContext('Bearer invalid.token.here');
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, false);
    assertEquals(mockCtx.response.status, Status.Unauthorized);
    assertEquals(
      (mockCtx.response.body as { error: string }).error,
      'Invalid token'
    );
  });

  await t.step('should allow OPTIONS requests', async () => {
    const mockCtx = createMockContext(undefined, 'OPTIONS');
    mockCtx.request.headers.set('Access-Control-Request-Method', 'POST');
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, true);
    assertEquals(mockCtx.response.status, Status.OK);
  });
});

Deno.test('Admin Only Middleware', async (t) => {
  await t.step('should pass for admin users', async () => {
    const mockCtx = createMockContext();
    mockCtx.state.user = { id: 'admin-user', role: 'admin' };
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await adminOnly(mockCtx as Context, mockNext);

    assertEquals(nextCalled, true);
    assertEquals(mockCtx.response.status, Status.OK);
  });

  await t.step('should fail for non-admin users', async () => {
    const mockCtx = createMockContext();
    mockCtx.state.user = { id: 'regular-user', role: 'user' };
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await adminOnly(mockCtx as Context, mockNext);

    assertEquals(nextCalled, false);
    assertEquals(mockCtx.response.status, Status.Forbidden);
    assertEquals(
      (mockCtx.response.body as { error: string }).error,
      'Admin access required'
    );
  });

  await t.step('should fail for missing user', async () => {
    const mockCtx = createMockContext();
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await adminOnly(mockCtx as Context, mockNext);

    assertEquals(nextCalled, false);
    assertEquals(mockCtx.response.status, Status.Forbidden);
    assertEquals(
      (mockCtx.response.body as { error: string }).error,
      'Admin access required'
    );
  });
});

Deno.test('Token Generation', async (t) => {
  await t.step('should generate valid token', async () => {
    const token = await generateToken('test-user', 'user');

    assertExists(token);
    assertEquals(token.startsWith('AUTH '), true);

    // Verify the token can be used with auth middleware
    const mockCtx = createMockContext(token);
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await authMiddleware(mockCtx as Context, mockNext);

    assertEquals(nextCalled, true);
    assertEquals(mockCtx.response.status, Status.OK);
    assertExists(mockCtx.state.user);
    assertEquals(mockCtx.state.user.id, 'test-user');
    assertEquals(mockCtx.state.user.role, 'user');
  });
});
