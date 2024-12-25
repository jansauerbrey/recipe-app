import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

async function setupAdminUser(testContext: any) {
  const db = testContext.mongoClient.database(
    Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test',
  );
  await db.collection('users').updateOne(
    { _id: testContext.testUserId },
    { $set: { role: 'admin' } },
  );
}

Deno.test({
  name: 'Role Authorization - should allow admin access to admin route',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      await setupAdminUser(testContext);

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
  name: 'Role Authorization - should reject incorrect role',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      await setupAdminUser(testContext);

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

Deno.test({
  name: 'Role Authorization - should reject unauthenticated access',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const response = await fetch(`${baseUrl}/admin`);

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
  name: 'Role Authorization - should allow admin access to moderator route',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      await setupAdminUser(testContext);

      const response = await fetch(`${baseUrl}/moderator`, {
        headers: await createAuthHeader(testContext.testUserId!, 'admin'),
      });

      assertEquals(response.status, 200);
      const body = await response.json();
      assertEquals(body.message, 'Moderator route accessed successfully');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
