import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

Deno.test({
  name: 'Auth Middleware - should pass with valid token',
  async fn() {
    const testContext = await setupTest();

    try {
      const response = await fetch(
        `http://localhost:${testContext.port}/api/user/check`,
        {
          headers: await createAuthHeader(testContext.testUserId!),
        },
      );

      assertEquals(response.status, 200);
      const body = await response.json();
      assertExists(body.user);
      assertEquals(body.user.id, testContext.testUserId);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Auth Middleware - should reject missing auth header',
  async fn() {
    const testContext = await setupTest();

    try {
      const response = await fetch(
        `http://localhost:${testContext.port}/api/user/check`,
      );

      assertEquals(response.status, 401);
      const body = await response.json();
      assertEquals(body.error, 'No authorization token provided');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Auth Middleware - should reject invalid token',
  async fn() {
    const testContext = await setupTest();

    try {
      const response = await fetch(
        `http://localhost:${testContext.port}/api/user/check`,
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        },
      );

      assertEquals(response.status, 401);
      const body = await response.json();
      assertEquals(body.error, 'Invalid token');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
