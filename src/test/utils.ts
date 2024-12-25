import { type Context } from 'oak';
import { create, verify } from 'djwt';

const TEST_SECRET = new TextEncoder().encode('test-secret-key');

async function getCryptoKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    TEST_SECRET,
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
}

// Types
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

// Context Helpers
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

// JWT Helpers
export async function createTestToken(payload: { sub: string; role: string }): Promise<string> {
  const key = await getCryptoKey();
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      ...payload,
      exp: Date.now() / 1000 + 3600, // 1 hour from now
    },
    key
  );
  return jwt;
}

export async function createExpiredToken(payload: { sub: string; role: string }): Promise<string> {
  const key = await getCryptoKey();
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      ...payload,
      exp: Date.now() / 1000 - 3600, // 1 hour ago
    },
    key
  );
  return jwt;
}

export async function verifyTestToken(token: string): Promise<any> {
  const key = await getCryptoKey();
  return await verify(token, key);
}

// Assertion Helpers
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

export function assertDateString(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Expected valid date string, got: ${value}`);
  }
}

export function assertUUID(value: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`Expected UUID, got: ${value}`);
  }
}

export function assertError(error: unknown, expectedStatus: number, expectedMessage?: string) {
  if (!(error instanceof Error)) {
    throw new Error('Expected an Error object');
  }
  
  if ('status' in error && typeof (error as any).status === 'number') {
    if ((error as any).status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${(error as any).status}`);
    }
  }
  
  if (expectedMessage && !error.message.includes(expectedMessage)) {
    throw new Error(`Expected message to include "${expectedMessage}", got "${error.message}"`);
  }
}

// Test Context
export interface TestContext<T = unknown> {
  state: {
    data?: T;
    error?: Error;
  };
}

export function createTestContext<T = unknown>(): TestContext<T> {
  return {
    state: {},
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
