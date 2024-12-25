import {
  assertEquals,
  assertExists,
  assertMatch,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { loggingMiddleware } from '../../../presentation/middleware/logging.middleware.ts';
import { logger } from '../../../utils/logger.ts';
import { AppError } from '../../../types/errors.ts';

// Mock console.log and console.error to capture logs
let logOutput: string[] = [];
const originalLog = console.log;
const originalError = console.error;

function setupLogCapture() {
  logOutput = [];
  console.log = (msg: string) => logOutput.push(msg);
  console.error = (msg: string) => logOutput.push(msg);
}

function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
}

Deno.test('Logging Middleware', async (t) => {
  await t.step('should log successful requests', async () => {
    setupLogCapture();

    const mockCtx = {
      request: {
        method: 'GET',
        url: new URL('http://localhost/test'),
        ip: '127.0.0.1',
        headers: new Headers({
          'user-agent': 'test-agent',
        }),
      },
      response: {
        status: 200,
        headers: new Headers(),
      },
      state: {},
    } as unknown as Context;

    await loggingMiddleware(mockCtx, () => Promise.resolve());

    // Check request ID header
    const requestId = mockCtx.response.headers.get('X-Request-ID');
    assertExists(requestId);
    assertMatch(requestId, /^[0-9a-f-]{36}$/);

    // Check logs
    assertEquals(logOutput.length, 2); // Debug log and request log
    const debugLog = JSON.parse(logOutput[0]);
    const requestLog = JSON.parse(logOutput[1]);

    assertEquals(debugLog.message, 'Request received');
    assertEquals(debugLog.context.method, 'GET');
    assertEquals(debugLog.context.path, '/test');

    assertEquals(requestLog.level, 'info');
    assertEquals(requestLog.message, 'HTTP GET /test');
    assertEquals(requestLog.context.statusCode, 200);
    assertExists(requestLog.context.duration);

    restoreConsole();
  });

  await t.step('should log errors with context', async () => {
    setupLogCapture();

    const mockCtx = {
      request: {
        method: 'POST',
        url: new URL('http://localhost/test'),
        ip: '127.0.0.1',
        headers: new Headers({
          'user-agent': 'test-agent',
        }),
      },
      response: {
        status: 500,
        headers: new Headers(),
      },
      state: {
        user: { id: 'test-user' },
      },
    } as unknown as Context;

    const error = new AppError('Test error', 400, 'TEST_ERROR');

    try {
      await loggingMiddleware(mockCtx, () => Promise.reject(error));
    } catch {
      // Expected error
    }

    // Check logs
    assertEquals(logOutput.length, 2); // Debug log and error log
    const debugLog = JSON.parse(logOutput[0]);
    const errorLog = JSON.parse(logOutput[1]);

    assertEquals(debugLog.message, 'Request received');
    assertEquals(errorLog.level, 'error');
    assertEquals(errorLog.message, 'Request failed');
    assertEquals(errorLog.context.statusCode, 400);
    assertEquals(errorLog.context.errorCode, 'TEST_ERROR');
    assertEquals(errorLog.context.userId, 'test-user');
    assertExists(errorLog.context.duration);

    restoreConsole();
  });

  await t.step('should handle non-AppError errors', async () => {
    setupLogCapture();

    const mockCtx = {
      request: {
        method: 'GET',
        url: new URL('http://localhost/test'),
        ip: '127.0.0.1',
        headers: new Headers({
          'user-agent': 'test-agent',
        }),
      },
      response: {
        status: 500,
        headers: new Headers(),
      },
      state: {},
    } as unknown as Context;

    try {
      await loggingMiddleware(mockCtx, () => Promise.reject(new Error('Unknown error')));
    } catch {
      // Expected error
    }

    // Check logs
    const errorLog = JSON.parse(logOutput[logOutput.length - 1]);
    assertEquals(errorLog.level, 'error');
    assertEquals(errorLog.context.statusCode, 500);
    assertEquals(errorLog.context.errorCode, 'INTERNAL_SERVER_ERROR');

    restoreConsole();
  });
});
