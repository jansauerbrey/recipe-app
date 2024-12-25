import { type Context } from 'oak';
import { create, verify } from 'djwt';

const TEST_SECRET = 'test-secret-key';

export interface MockContext extends Omit<Context, 'request' | 'response' | 'state'> {
  request: {
    method: string;
    url: URL;
    headers: Headers;
    body: () => { type: string; value: Promise<any> };
  };
  response: {
    status: number;
    body: any;
    headers: Headers;
    type: string;
  };
  state: {
    user?: {
      id: string;
      role: string;
    };
    [key: string]: any;
  };
}

export interface TestMiddleware {
  (context: Context, next: () => Promise<void>): Promise<void>;
}

export function createMockContext(options: {
  method?: string;
  token?: string;
  headers?: Record<string, string>;
} = {}): MockContext {
  const headers = new Headers();
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return {
    request: {
      method: options.method || 'GET',
      url: new URL('http://localhost:8000'),
      headers,
      body: () => ({ type: 'json', value: Promise.resolve({}) }),
    },
    response: {
      status: 200,
      body: null,
      headers: new Headers(),
      type: 'application/json',
    },
    state: {},
    cookies: {
      get: (key: string) => undefined,
      set: (key: string, value: string) => {},
    },
    throw: (status: number, message?: string) => {
      throw new Error(message);
    },
    assert: (condition: boolean, status: number, message?: string) => {
      if (!condition) {
        throw new Error(message);
      }
    },
  } as MockContext;
}

export async function createTestToken(payload: { sub: string; role: string }): Promise<string> {
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      ...payload,
      exp: Date.now() / 1000 + 3600, // 1 hour from now
    },
    TEST_SECRET
  );
  return jwt;
}

export async function createExpiredToken(payload: { sub: string; role: string }): Promise<string> {
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      ...payload,
      exp: Date.now() / 1000 - 3600, // 1 hour ago
    },
    TEST_SECRET
  );
  return jwt;
}

export async function verifyTestToken(token: string): Promise<any> {
  return await verify(token, TEST_SECRET);
}

export function assertHeaders(headers: Headers, expectedHeaders: Record<string, string>) {
  for (const [key, value] of Object.entries(expectedHeaders)) {
    if (!headers.has(key)) {
      throw new Error(`Expected header "${key}" to be present`);
    }
    if (headers.get(key) !== value) {
      throw new Error(`Expected header "${key}" to be "${value}", got "${headers.get(key)}"`);
    }
  }
}
