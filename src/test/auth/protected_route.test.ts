import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { setupTest } from '../test_utils.ts';
import { createAuthHeader } from '../utils/helpers.ts';

describe('Protected Route Tests', () => {
  it('should handle protected routes correctly', async () => {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Test authenticated request
      const authResponse = await fetch(`${baseUrl}/protected`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      assertEquals(authResponse.status, 200);
      const authBody = await authResponse.json();
      assertEquals(authBody.message, 'Protected route accessed successfully');

      // Test unauthenticated request
      const noAuthResponse = await fetch(`${baseUrl}/protected`);

      assertEquals(noAuthResponse.status, 401);
      const noAuthBody = await noAuthResponse.json();
      assertEquals(noAuthBody.error, 'No authorization token provided');

      // Test role-protected route with correct role
      const adminResponse = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'admin'),
      });

      assertEquals(adminResponse.status, 200);
      const adminBody = await adminResponse.json();
      assertEquals(adminBody.message, 'Admin route accessed successfully');

      // Test role-protected route with incorrect role
      const userResponse = await fetch(`${baseUrl}/admin`, {
        headers: await createAuthHeader(testContext.testUserId!, 'user'),
      });

      assertEquals(userResponse.status, 403);
      const userBody = await userResponse.json();
      assertEquals(userBody.error, 'Forbidden');
    } finally {
      await testContext.server.close();
    }
  });
});
