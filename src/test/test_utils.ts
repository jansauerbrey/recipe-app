import { Context, State } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppError } from '../types/errors.ts';
import { createTestUser, deleteTestUser } from './utils/database.ts';
import { generateToken } from '../presentation/middleware/auth/token.middleware.ts';

export interface TestContext extends Context {
  state: TestState;
  params: Record<string, string>;
}

export interface TestResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

export interface TestRequest {
  method: string;
  url: URL;
  headers: Headers;
  body: () => { type: string; value: unknown };
}

export interface TestUser {
  _id: string;
  username: string;
  password: string;
  role: string;
}

export interface TestState extends State {
  user?: TestUser;
}

export function createMockContext(
  method = 'GET',
  path = '/api/test',
  params: Record<string, string> = {},
  body?: unknown,
  contentType = 'application/json',
  user?: TestUser,
): TestContext {
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
    } as TestRequest,
    response: {
      status: Status.OK,
      body: null,
      headers: new Headers(),
    } as TestResponse,
    state: { user } as TestState,
    params,
  } as TestContext;
}

export function createMockNext(): () => Promise<void> {
  return async (): Promise<void> => {
    await Promise.resolve();
  };
}

export function assertErrorType(error: unknown, expectedType: new (...args: any[]) => Error): void {
  if (!(error instanceof expectedType)) {
    throw new Error(`Expected error to be instance of ${expectedType.name}`);
  }
}

export function assertAppError(error: unknown, status: number, message?: string): void {
  if (!(error instanceof AppError)) {
    throw new Error('Expected error to be instance of AppError');
  }
  if (error.statusCode !== status) {
    throw new Error(`Expected error status to be ${status}, got ${error.statusCode}`);
  }
  if (message && error.message !== message) {
    throw new Error(`Expected error message to be "${message}", got "${error.message}"`);
  }
}

export async function setupTestUser(): Promise<TestUser> {
  const user = await createTestUser();
  if (!user) {
    throw new Error('Failed to create test user');
  }
  console.log('Test user created with ID:', user._id);
  console.log('Verifying test user:', user);
  return user;
}

export async function cleanupTestUser(userId: string): Promise<void> {
  await deleteTestUser(userId);
}

export async function setupTestContext(
  method = 'GET',
  path = '/api/test',
  params: Record<string, string> = {},
  body?: unknown,
  contentType = 'application/json',
): Promise<{ context: TestContext; user: TestUser }> {
  const user = await setupTestUser();
  const context = createMockContext(method, path, params, body, contentType, user);
  const token = await generateToken(user._id, user.role);
  context.request.headers.set('Authorization', `Bearer ${token}`);
  return { context, user };
}

export function createTestContext(
  method = 'GET',
  path = '/api/test',
  params: Record<string, string> = {},
  body?: unknown,
  contentType = 'application/json',
  user?: TestUser,
): TestContext {
  const context = createMockContext(method, path, params, body, contentType, user);
  if (user) {
    const token = generateToken(user._id, user.role);
    context.request.headers.set('Authorization', `Bearer ${token}`);
  }
  return context;
}

export async function setupTestServer(): Promise<void> {
  console.log('Starting test server...');
  // Add any test server setup logic here
  console.log('Server is ready');
}

export async function cleanupTestServer(): Promise<void> {
  // Add any test server cleanup logic here
}
