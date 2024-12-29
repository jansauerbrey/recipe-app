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
    assertEquals(logOutput.length, 2); // Debug log and request log
    const logs = logOutput.map(log => JSON.parse(log));
    
    // First log should be debug
    assertEquals(logs[0].message, 'Request received');
    assertEquals(logs[0].context.method, 'GET');
    assertEquals(logs[0].context.path, '/test');

    // Second log should be info
    assertEquals(logs[1].level, 'info');
    assertEquals(logs[1].message, 'HTTP GET /test');
    assertEquals(logs[1].context.statusCode, 200);
    assertExists(logs[1].context.duration);

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
    assertEquals(logOutput.length, 2); // Debug log and error log
    const logs = logOutput.map(log => JSON.parse(log));

    // First log should be debug
    assertEquals(logs[0].message, 'Request received');
    
    // Second log should be error
    assertEquals(logs[1].level, 'error');
    assertEquals(logs[1].message, 'Request failed');
    assertEquals(logs[1].context.statusCode, 400);
    assertEquals(logs[1].context.errorCode, 'TEST_ERROR');
    assertEquals(logs[1].context.userId, 'test-user');
    assertExists(logs[1].context.duration);

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
    assertEquals(logOutput.length, 2); // Debug log and error log
    const logs = logOutput.map(log => JSON.parse(log));

    // First log should be debug
    assertEquals(logs[0].message, 'Request received');
    
    // Second log should be error
    assertEquals(logs[1].level, 'error');
    assertEquals(logs[1].context.statusCode, 500);
    assertEquals(logs[1].context.errorCode, 'INTERNAL_SERVER_ERROR');

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
    assertEquals(logOutput.length, 2); // Debug log and error log
    const logs = logOutput.map(log => JSON.parse(log));

    // First log should be debug
    assertEquals(logs[0].message, 'Request received');
    
    // Second log should be error
    assertEquals(logs[1].level, 'error');
    assertEquals(logs[1].context.statusCode, 500);
    assertEquals(logs[1].context.errorCode, 'INTERNAL_SERVER_ERROR');

    restoreConsole();
  });
});
