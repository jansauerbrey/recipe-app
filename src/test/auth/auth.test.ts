import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';

Deno.test({
  name: 'Authentication - should return 401 for unauthenticated request',
  async fn() {
    // Setup test environment
    const testContext = await setupTest();

    try {
      // Create TCP connection
      const tcpConn = await Deno.connect({ hostname: '127.0.0.1', port: testContext.port });

      try {
        // Send HTTP request
        const encoder = new TextEncoder();
        const request = encoder.encode(
          'GET /api/user/check HTTP/1.1\r\n' +
            `Host: localhost:${testContext.port}\r\n` +
            'Connection: close\r\n\r\n',
        );
        await tcpConn.write(request);

        // Read response
        const buf = new Uint8Array(1024);
        const n = await tcpConn.read(buf);
        if (n === null) {
          throw new Error('Failed to read response');
        }

        // Parse response
        const decoder = new TextDecoder();
        const response = decoder.decode(buf.subarray(0, n));
        assertEquals(response.includes('401'), true);
      } finally {
        // Ensure TCP connection is closed
        tcpConn.close();
      }
    } finally {
      // Cleanup test environment
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
