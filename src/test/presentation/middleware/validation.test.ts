import {
  assertEquals,
  assertRejects,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context, RouterContext } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { validateRequest, validateResponse } from '../../../presentation/middleware/validation.middleware.ts';
import { ValidationError } from '../../../types/errors.ts';

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

type MockContext = Omit<RouterContext<string>, 'request' | 'response'> & {
  request: MockRequest;
  response: MockResponse;
  params: Record<string, string>;
};

function createMockContext(
  method = 'GET',
  path = '/test',
  params: Record<string, string> = {},
  body?: unknown,
  contentType = 'application/json',
): MockContext {
  return {
    request: {
      method,
      url: new URL(`http://localhost${path}`),
      headers: new Headers({
        'content-type': contentType,
      }),
      body: () => ({
        type: 'json',
        value: body,
      }),
    },
    response: {
      status: Status.OK,
      body: null,
      headers: new Headers(),
    },
    params,
  } as MockContext;
}

// Mock OpenAPI spec for testing
const mockOpenApiSpec = {
  paths: {
    '/api/test': {
      post: {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
          },
          {
            name: 'filter',
            in: 'query',
            required: true,
          },
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {},
              },
            },
          },
        },
      },
    },
  },
};

// Replace the actual OpenAPI spec with our mock for testing
(globalThis as unknown as { openApiSpec: unknown }).openApiSpec = mockOpenApiSpec;

async function assertValidationError(
  fn: () => Promise<void>,
  expectedMessage: string,
): Promise<void> {
  await assertRejects(
    async () => {
      await fn();
    },
    ValidationError,
    expectedMessage,
  );
}

// Create a properly typed mock next function
const mockNext = async (): Promise<void> => {
  await Promise.resolve();
};

Deno.test('Validation Middleware', async (t) => {
  await t.step('validateRequest - should pass with valid parameters', async () => {
    const mockCtx = createMockContext(
      'POST',
      '/api/test',
      { id: '123' },
      { data: 'test' },
    );
    mockCtx.request.headers.set('x-api-key', 'test-key');
    mockCtx.request.url.searchParams.set('filter', 'active');

    await validateRequest(mockCtx as unknown as Context, mockNext);
    assertEquals(mockCtx.response.status, Status.OK);
  });

  await t.step('validateRequest - should fail with missing path parameter', async () => {
    const mockCtx = createMockContext(
      'POST',
      '/api/test',
      {},
      { data: 'test' },
    );
    mockCtx.request.headers.set('x-api-key', 'test-key');
    mockCtx.request.url.searchParams.set('filter', 'active');

    await assertValidationError(
      async () => validateRequest(mockCtx as unknown as Context, mockNext),
      'Missing required path parameter: id'
    );
  });

  await t.step('validateRequest - should fail with missing query parameter', async () => {
    const mockCtx = createMockContext(
      'POST',
      '/api/test',
      { id: '123' },
      { data: 'test' },
    );
    mockCtx.request.headers.set('x-api-key', 'test-key');

    await assertValidationError(
      async () => validateRequest(mockCtx as unknown as Context, mockNext),
      'Missing required query parameter: filter'
    );
  });

  await t.step('validateRequest - should fail with missing header', async () => {
    const mockCtx = createMockContext(
      'POST',
      '/api/test',
      { id: '123' },
      { data: 'test' },
    );
    mockCtx.request.url.searchParams.set('filter', 'active');

    await assertValidationError(
      async () => validateRequest(mockCtx as unknown as Context, mockNext),
      'Missing required header parameter: x-api-key'
    );
  });

  await t.step('validateRequest - should fail with missing required body', async () => {
    const mockCtx = createMockContext(
      'POST',
      '/api/test',
      { id: '123' },
      null,
    );
    mockCtx.request.headers.set('x-api-key', 'test-key');
    mockCtx.request.url.searchParams.set('filter', 'active');

    await assertValidationError(
      async () => validateRequest(mockCtx as unknown as Context, mockNext),
      'Missing required request body'
    );
  });

  await t.step('validateResponse - should pass with valid response', async () => {
    const mockCtx = createMockContext('POST', '/api/test');
    mockCtx.response.body = { data: 'test' };
    mockCtx.response.status = Status.OK;

    await validateResponse(mockCtx as unknown as Context, mockNext);
    assertEquals(mockCtx.response.status, Status.OK);
  });

  await t.step('validateResponse - should fail with missing response body', async () => {
    const mockCtx = createMockContext('POST', '/api/test');
    mockCtx.response.status = Status.OK;

    await assertValidationError(
      async () => validateResponse(mockCtx as unknown as Context, mockNext),
      'Missing response body'
    );
  });

  await t.step('should skip validation for undefined routes', async () => {
    const mockCtx = createMockContext('GET', '/undefined/route');

    await validateRequest(mockCtx as unknown as Context, mockNext);
    assertEquals(mockCtx.response.status, Status.OK);
  });
});
