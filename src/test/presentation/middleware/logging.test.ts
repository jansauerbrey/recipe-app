import {
  assertEquals,
  assertExists,
  assertMatch,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context, State } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { loggingMiddleware } from '../../../presentation/middleware/logging.middleware.ts';
import { AppError } from '../../../types/errors.ts';

interface MockRequest {
  method: string;
  url: URL;
  ip: string;
  headers: Headers;
}

interface MockResponse {
  status: number;
  headers: Headers;
}

interface MockState extends State {
  user?: {
    id: string;
  };
}

type MockContext = Pick<Context, 'request' | 'response' | 'state'> & {
  request: MockRequest;
  response: MockResponse;
  state: MockState;
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
      ip: '127.0.0.1',
      headers: new Headers({
        'user-agent': 'test-agent',
      }),
    },
    response: {
      status,
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

Deno.test('Logging Middleware', async (t) => {
  await t.step('should log successful requests', async () => {
    setupLogCapture();

    const mockCtx = createMockContext();
    const mockNext = () => Promise.resolve() as Promise<unknown>;

    await loggingMiddleware(mockCtx as unknown as Context, mockNext);

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

    const mockCtx = createMockContext('POST', '/test', 'test-user', 400);
    const mockNext = () => Promise.reject(new AppError('Test error', 400, 'TEST_ERROR')) as Promise<unknown>;

    await assertErrorType(
      () => loggingMiddleware(mockCtx as unknown as Context, mockNext),
      AppError,
      'Test error'
    );

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

    const mockCtx = createMockContext('GET', '/test');
    const mockNext = () => Promise.reject(new Error('Unknown error')) as Promise<unknown>;

    await assertErrorType(
      () => loggingMiddleware(mockCtx as unknown as Context, mockNext),
      Error,
      'Unknown error'
    );

    // Check logs
    const errorLog = JSON.parse(logOutput[logOutput.length - 1]);
    assertEquals(errorLog.level, 'error');
    assertEquals(errorLog.context.statusCode, 500);
    assertEquals(errorLog.context.errorCode, 'INTERNAL_SERVER_ERROR');

    restoreConsole();
  });

  await t.step('should handle non-Error objects', async () => {
    setupLogCapture();

    const mockCtx = createMockContext('GET', '/test');
    const mockNext = () => Promise.reject('String error') as Promise<unknown>;

    try {
      await loggingMiddleware(mockCtx as unknown as Context, mockNext);
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
