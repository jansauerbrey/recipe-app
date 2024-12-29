import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { loggingMiddleware } from '../../../presentation/middleware/logging.middleware.ts';
import { AppError } from '../../../types/errors.ts';

interface MockBody {
  type: string;
  value: unknown;
}

interface MockRequest {
  method: string;
  url: URL;
  headers: Headers;
  body: () => MockBody;
}

interface MockResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

type MockContext = Pick<Context, 'request' | 'response' | 'state'> & {
  request: MockRequest;
  response: MockResponse;
  state: Record<string, unknown>;
};

// Mock console.log and console.error to capture logs
let logOutput: string[] = [];
const originalLog = console.log;
const originalError = console.error;

function setupLogCapture(): void {
  logOutput = [];
  console.log = (msg: string) => logOutput.push(msg);
  console.error = (msg: string) => logOutput.push(msg);
}

function restoreConsole(): void {
  console.log = originalLog;
  console.error = originalError;
}

function createMockContext(
  method = 'GET',
  path = '/test',
  userId?: string,
  status = 200,
): MockContext {
  return {
    request: {
      method,
      url: new URL(`http://localhost${path}`),
      headers: new Headers({
        'user-agent': 'test-agent',
      }),
      body: () => ({
        type: 'json',
        value: null,
      }),
    },
    response: {
      status: Status.OK,
      body: null,
      headers: new Headers(),
    },
    state: userId ? { user: { id: userId } } : {},
  } as MockContext;
}

async function assertErrorType<T extends Error>(
  fn: () => Promise<void>,
  errorType: new (...args: any[]) => T,
  message?: string,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error: unknown) {
    if (!(error instanceof errorType)) {
      throw new Error(`Expected ${errorType.name} but got ${error instanceof Error ? error.constructor.name : typeof error}`);
    }
    if (message) {
      assertEquals((error as Error).message, message);
    }
  }
}

// Create a properly typed mock next function
const mockNext = async (): Promise<void> => {
  await Promise.resolve();
};

Deno.test('Logging Middleware', async (t) => {
  await t.step('should log successful requests', async () => {
    setupLogCapture();

    const mockCtx = createMockContext();

    await loggingMiddleware(mockCtx as Context, mockNext);

    // Check request ID header
    const requestId = mockCtx.response.headers.get('X-Request-ID');
    assertExists(requestId);

    // Check logs
    assertEquals(logOutput.length, 1); // Debug log and request log
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

    const mockCtx = createMockContext('POST', '/test', 'test-user', 400);
    const errorNext = async (): Promise<void> => {
      throw new AppError('Test error', 400, 'TEST_ERROR');
    };

    try {
      await loggingMiddleware(mockCtx as Context, errorNext);
    } catch (error) {
      assertEquals(error instanceof AppError, true);
    }

    // Check logs
    assertEquals(logOutput.length, 1); // Debug log and error log
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

    const mockCtx = createMockContext();
    const errorNext = async (): Promise<void> => {
      throw new Error('Unknown error');
    };

    try {
      await loggingMiddleware(mockCtx as Context, errorNext);
    } catch (error) {
      assertEquals(error instanceof Error, true);
      assertEquals((error as Error).message, 'Unknown error');
    }

    // Check logs
    const errorLog = JSON.parse(logOutput[logOutput.length - 1]);
    assertEquals(errorLog.level, 'error');
    assertEquals(errorLog.context.statusCode, 500);
    assertEquals(errorLog.context.errorCode, 'INTERNAL_SERVER_ERROR');

    restoreConsole();
  });

  await t.step('should handle non-Error objects', async () => {
    setupLogCapture();

    const mockCtx = createMockContext();
    const errorNext = async (): Promise<void> => {
      throw 'String error';
    };

    try {
      await loggingMiddleware(mockCtx as Context, errorNext);
    } catch (error: unknown) {
      assertEquals(typeof error, 'string');
      assertEquals(error, 'String error');
    }

    // Check logs
    const errorLog = JSON.parse(logOutput[logOutput.length - 1]);
    assertEquals(errorLog.level, 'error');
    assertEquals(errorLog.context.statusCode, 500);
    assertEquals(errorLog.context.errorCode, 'INTERNAL_SERVER_ERROR');

    restoreConsole();
  });
});
