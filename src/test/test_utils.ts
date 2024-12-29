import { Context, State } from '@oak/mod.ts';
import { Status } from '@std/http/http_status.ts';
import { load } from '@std/dotenv/mod.ts';
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
  email: string;
  name: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
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

import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { MongoDatabase } from '../data/database.ts';
let currentTestContext: TestServer | null = null;
 
const usedPorts = new Set<number>();
const BASE_PORT = 3000;
const MAX_PORT = 4000;

async function getAvailablePort(): Promise<number> {
  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (!usedPorts.has(port)) {
      try {
        // Try to create a listener to verify port is available
        const testListener = await Deno.listen({ port });
        testListener.close();
        usedPorts.add(port);
        return port;
      } catch {
        // Port is in use, try next one
        continue;
      }
    }
  }
  throw new Error('No available ports');
}

export interface TestServer {
  port: number;
  server: {
    close: () => Promise<void>;
  };
  mongoClient: MongoClient;
  database: MongoDatabase;
  testUserId: string;
}

import { Application } from 'https://deno.land/x/oak@v12.6.1/mod.ts';

let app: Application | null = null;
let controller: AbortController | null = null;
let serverPromise: Promise<void> | null = null;

export async function setupTest(): Promise<TestServer> {
  console.log('Starting test server...');
  
  // Set test environment
  Deno.env.set('ENVIRONMENT', 'test');

  // Load environment variables from file only in local development
  if (Deno.env.get('CI') !== 'true' && Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
    await load({
      envPath: '.env.test',
      export: true,
      allowEmptyValues: true,
    });
  }

  // Ensure required environment variables are set
  const requiredVars = ['MONGODB_URI', 'MONGO_DB_NAME'];
  for (const varName of requiredVars) {
    if (!Deno.env.get(varName)) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }
  
  // Setup MongoDB connection
  const mongoClient = new MongoClient();
  const uri = Deno.env.get('MONGODB_URI');
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Log connection attempt
  console.log('Connecting to MongoDB...', { 
    environment: Deno.env.get('ENVIRONMENT')
  });

  try {
    await mongoClient.connect(uri);
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection failed:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : error
    });
    throw error;
  }
  
  // Create test user and get ID
  const user = await setupTestUser();
  const testUserId = user._id;
  
  // Setup server with dynamic port
  const port = await getAvailablePort();
  
  // Create and configure Oak application
  const { createApp } = await import('../../app.ts');
  app = await createApp();
  
  try {
    controller = new AbortController();
    if (!app) throw new Error('Application not initialized');
    serverPromise = app.listen({
      port,
      signal: controller.signal,
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const maxAttempts = 10;
      let attempts = 0;
      let timeoutId: number | null = null;

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const checkServer = async () => {
        try {
          const response = await fetch(`http://localhost:${port}/api/user/check`);
          await response.text(); // Consume the response body
          if (response.status === 401) { // Expected unauthorized response
            console.log('Server is ready on port:', port);
            cleanup();
            resolve();
          } else if (attempts < maxAttempts) {
            attempts++;
            timeoutId = setTimeout(checkServer, 100);
          } else {
            cleanup();
            reject(new Error('Server failed to start'));
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('Connection refused')) {
            if (attempts < maxAttempts) {
              attempts++;
              timeoutId = setTimeout(checkServer, 100);
            } else {
              cleanup();
              reject(new Error('Server failed to start'));
            }
          } else {
            console.error('Server check error:', error);
            cleanup();
            reject(error);
          }
        }
      };

      checkServer();
    });

    const server = {
      close: async () => {
        if (controller) {
          controller.abort();
        }
        if (serverPromise) {
          try {
            await serverPromise;
          } catch {
            // Ignore abort errors
          }
        }
        if (app) {
          // @ts-expect-error - Access internal Oak server instance
          const oakServer = app?._server;
          if (oakServer) {
            try {
              await oakServer.close();
            } catch {
              // Ignore close errors
            }
          }
        }
        usedPorts.delete(port);
      }
    };

    // Initialize database and store test context
    const database = new MongoDatabase(mongoClient);
    currentTestContext = { port, server, mongoClient, database, testUserId };
    return currentTestContext;
  } catch (error) {
    console.error('Server start error:', error);
    await cleanupTest();
    throw error;
  }
}

export async function cleanupTest(): Promise<void> {
  try {
    if (currentTestContext) {
      // Get database name from environment
      const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';

      if (currentTestContext.mongoClient) {
        try {
          // Clean up all collections in the test database
          const db = currentTestContext.mongoClient.database(dbName);
          const collections = await db.listCollectionNames();
          
          // Delete all documents from each collection
          await Promise.all(collections.map((name: string) => 
            db.collection(name).deleteMany({}).catch(err => {
              console.error(`Error cleaning collection ${name}:`, err);
            })
          ));

          // Clean up test user
          if (currentTestContext.testUserId) {
            try {
              await cleanupTestUser(currentTestContext.testUserId);
            } catch (err) {
              console.error('Error cleaning up test user:', err);
            }
          }

          // Close MongoDB connection
          try {
            await currentTestContext.mongoClient.close();
          } catch (err) {
            console.error('Error closing MongoDB connection:', err);
          }
        } catch (err) {
          console.error('Error during database cleanup:', err);
        }
      }

      // Close server
      if (currentTestContext.server) {
        try {
          await currentTestContext.server.close();
        } catch (err) {
          console.error('Error closing server:', err);
        }
      }
    }

    // Create a new connection to ensure cleanup
    try {
      const mongoClient = new MongoClient();
      const uri = Deno.env.get('MONGODB_URI');
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required');
      }
      await mongoClient.connect(uri);
      const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
      const db = mongoClient.database(dbName);
      
      // Clean up any remaining data
      const collections = await db.listCollectionNames();
      await Promise.all(collections.map((name: string) => 
        db.collection(name).deleteMany({}).catch(err => {
          console.error(`Error cleaning collection ${name}:`, err);
        })
      ));
      
      try {
        await mongoClient.close();
      } catch (err) {
        console.error('Error closing final cleanup connection:', err);
      }
    } catch (error) {
      console.error('Final cleanup error:', error);
      // Continue even if final cleanup fails
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw error to allow tests to continue
  } finally {
    currentTestContext = null;
  }
}
