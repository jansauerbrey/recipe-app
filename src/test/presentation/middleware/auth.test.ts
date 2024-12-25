import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { authMiddleware, generateToken } from '../../../presentation/middleware/auth.middleware.ts';
import { AppRouterContext } from '../../../types/middleware.ts';

Deno.test('Auth Middleware', async (t) => {
  await t.step('should return 401 when no token is provided', async () => {
    const ctx = {
      request: {
        headers: new Headers(),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {},
    } as unknown as AppRouterContext;

    await authMiddleware(ctx, async () => {});

    assertEquals(ctx.response.status, Status.Unauthorized);
    assertEquals(ctx.response.body, { error: 'No authorization token provided' });
  });

  await t.step('should return 401 when invalid token is provided', async () => {
    const ctx = {
      request: {
        headers: new Headers({
          Authorization: 'Bearer invalid-token',
        }),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {},
    } as unknown as AppRouterContext;

    await authMiddleware(ctx, async () => {});

    assertEquals(ctx.response.status, Status.Unauthorized);
    assertEquals(ctx.response.body, { error: 'Invalid token' });
  });

  await t.step('should call next middleware when valid token is provided', async () => {
    // Generate a valid token
    const userId = 'test-user-id';
    const role = 'user';
    const token = await generateToken(userId, role);

    let nextCalled = false;
    const ctx = {
      request: {
        headers: new Headers({
          Authorization: token, // generateToken already adds the AUTH prefix
        }),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {
        user: undefined,
      },
    } as unknown as AppRouterContext;

    const next = async () => {
      nextCalled = true;
    };

    await authMiddleware(ctx, next);

    assertEquals(nextCalled, true);
    assertEquals(ctx.state.user?.id, userId);
    assertEquals(ctx.state.user?.role, role);
  });
});
