import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

describe('Auth Middleware Tests', () => {
  let testContext: any;

  beforeEach(async () => {
    testContext = await setupTest();
  });

  afterEach(async () => {
    await cleanupTest();
  });

  it('should pass with valid token', async () => {
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
  });

  it('should reject missing auth header', async () => {
      const response = await fetch(
        `http://localhost:${testContext.port}/api/user/check`,
      );

      assertEquals(response.status, 401);
      const body = await response.json();
      assertEquals(body.error, 'No authorization token provided');
  });

  it('should reject invalid token', async () => {
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
  });
});
