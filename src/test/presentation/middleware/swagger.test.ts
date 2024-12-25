import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { swaggerMiddleware } from '../../../presentation/middleware/swagger.middleware.ts';
import { ResourceNotFoundError } from '../../../types/errors.ts';

interface MockRequest {
  url: URL;
}

interface MockResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

type MockContext = Pick<Context, 'request' | 'response'> & {
  request: MockRequest;
  response: MockResponse;
};

function createMockContext(path: string): MockContext {
  return {
    request: {
      url: new URL(`http://localhost${path}`),
    },
    response: {
      status: Status.OK,
      body: null,
      headers: new Headers(),
    },
  } as MockContext;
}

// Mock OpenAPI spec for testing
const mockOpenApiSpec = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
`;

// Mock file system operations
const originalReadTextFile = Deno.readTextFile;

function mockReadTextFile(content: string): void {
  (Deno as unknown as { readTextFile: unknown }).readTextFile = async () => content;
}

function restoreReadTextFile(): void {
  (Deno as unknown as { readTextFile: unknown }).readTextFile = originalReadTextFile;
}

Deno.test('Swagger Middleware', async (t) => {
  await t.step('should serve YAML documentation', async () => {
    const mockCtx = createMockContext('/api-docs/swagger.yaml');
    mockReadTextFile(mockOpenApiSpec);

    try {
      const mockNext = async () => {};
      await swaggerMiddleware(mockCtx as Context, mockNext);

      assertEquals(mockCtx.response.headers.get('Content-Type'), 'text/yaml');
      assertEquals(mockCtx.response.body, mockOpenApiSpec);
      assertEquals(mockCtx.response.status, Status.OK);
    } finally {
      restoreReadTextFile();
    }
  });

  await t.step('should serve JSON documentation', async () => {
    const mockCtx = createMockContext('/api-docs');
    mockReadTextFile(mockOpenApiSpec);

    try {
      const mockNext = async () => {};
      await swaggerMiddleware(mockCtx as Context, mockNext);

      assertEquals(mockCtx.response.headers.get('Content-Type'), 'application/json');
      assertExists(mockCtx.response.body);
      assertEquals((mockCtx.response.body as { info: { title: string } }).info.title, 'Test API');
      assertEquals(mockCtx.response.status, Status.OK);
    } finally {
      restoreReadTextFile();
    }
  });

  await t.step('should handle missing OpenAPI file', async () => {
    const mockCtx = createMockContext('/api-docs');
    (Deno as unknown as { readTextFile: unknown }).readTextFile = async () => {
      throw new Error('File not found');
    };

    try {
      const mockNext = async () => {};
      await swaggerMiddleware(mockCtx as Context, mockNext);

      assertEquals(mockCtx.response.status, Status.NotFound);
      assertExists(mockCtx.response.body);
      assertEquals(
        (mockCtx.response.body as { error: string }).error.includes('OpenAPI specification'),
        true
      );
    } finally {
      restoreReadTextFile();
    }
  });

  await t.step('should handle invalid YAML content', async () => {
    const mockCtx = createMockContext('/api-docs');
    mockReadTextFile('invalid: yaml: content: ]: }');

    try {
      const mockNext = async () => {};
      await swaggerMiddleware(mockCtx as Context, mockNext);

      assertEquals(mockCtx.response.status, Status.InternalServerError);
      assertExists(mockCtx.response.body);
      assertEquals(
        (mockCtx.response.body as { error: string }).error.includes('Failed to parse'),
        true
      );
    } finally {
      restoreReadTextFile();
    }
  });

  await t.step('should handle invalid OpenAPI spec format', async () => {
    const mockCtx = createMockContext('/api-docs');
    mockReadTextFile('valid_yaml: but_not_openapi: true');

    try {
      const mockNext = async () => {};
      await swaggerMiddleware(mockCtx as Context, mockNext);

      assertEquals(mockCtx.response.status, Status.InternalServerError);
      assertExists(mockCtx.response.body);
      assertEquals(
        (mockCtx.response.body as { error: string }).error.includes('Invalid OpenAPI specification'),
        true
      );
    } finally {
      restoreReadTextFile();
    }
  });

  await t.step('should pass through non-swagger routes', async () => {
    const mockCtx = createMockContext('/other-route');
    let nextCalled = false;

    const mockNext = async () => {
      nextCalled = true;
    };

    await swaggerMiddleware(mockCtx as Context, mockNext);
    assertEquals(nextCalled, true);
  });
});
