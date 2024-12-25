import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

describe('Role Authorization Tests', () => {
  it('should handle role-based authorization', async () => {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Update test user to admin role
      const db = testContext.mongoClient.database(
        Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test',
      );
      await db.collection('users').updateOne(
        { _id: testContext.testUserId },
        { $set: { role: 'admin' } },
      );

      // Test admin access
      const adminResponse = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'admin'),
      });

      assertEquals(adminResponse.status, 200);
      const adminBody = await adminResponse.json();
      assertEquals(adminBody.message, 'Admin route accessed successfully');

      // Test incorrect role
      const userResponse = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'user'),
      });

      assertEquals(userResponse.status, 403);
      const userBody = await userResponse.json();
      assertEquals(userBody.error, 'Forbidden');

      // Test no user
      const noAuthResponse = await fetch(`${baseUrl}/admin`);

      assertEquals(noAuthResponse.status, 401);
      const noAuthBody = await noAuthResponse.json();
      assertEquals(noAuthBody.error, 'No authorization token provided');

      // Test multiple allowed roles
      const moderatorResponse = await fetch(`${baseUrl}/moderator`, {
        headers: await createAuthHeader(testContext.testUserId!, 'admin'),
      });

      assertEquals(moderatorResponse.status, 200);
      const moderatorBody = await moderatorResponse.json();
      assertEquals(moderatorBody.message, 'Moderator route accessed successfully');
    } finally {
      await testContext.server.close();
    }
  });
});
