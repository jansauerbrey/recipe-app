import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

Deno.test({
  name: 'Protected Route - should allow authenticated access',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const response = await fetch(`${baseUrl}/protected`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      assertEquals(response.status, 200);
      const body = await response.json();
      assertEquals(body.message, 'Protected route accessed successfully');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Protected Route - should reject unauthenticated access',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const response = await fetch(`${baseUrl}/protected`);

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
  name: 'Protected Route - should allow admin access to admin route',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const response = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'admin'),
      });

      assertEquals(response.status, 200);
      const body = await response.json();
      assertEquals(body.message, 'Admin route accessed successfully');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Protected Route - should reject non-admin access to admin route',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const response = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'user'),
      });

      assertEquals(response.status, 403);
      const body = await response.json();
      assertEquals(body.error, 'Forbidden');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
