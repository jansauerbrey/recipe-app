import { Application } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

let app: Application | null = null;
let mongoClient: MongoClient | null = null;
let testUserId: string | null = null;
let controller: AbortController | null = null;
let serverPromise: Promise<void> | null = null;

export async function setupTest() {
  // Load test environment variables
  const { load } = await import('https://deno.land/std@0.208.0/dotenv/mod.ts');
  await load({
    envPath: '.env.test',
    export: true,
    allowEmptyValues: true,
  });

  // Connect to test database
  mongoClient = new MongoClient();
  await mongoClient.connect(Deno.env.get('MONGODB_URI')!);
  const db = mongoClient.database(Deno.env.get('MONGO_DB_NAME') || 'recipe-app-test');

  // Create test user
  console.log('Setting up test user...');
  const users = db.collection('users');
  await users.deleteMany({});
  const testUser = {
    username: 'jan',
    password: '$2a$10$K8ZpdrjwzUWSTmtyM.SAHewu7Zxpq3kUXnv/DPZSM8k.DSrmSekxi', // jan
    role: 'user',
  };
  const result = await users.insertOne(testUser);
  testUserId = result.toString();
  console.log('Test user created with ID:', testUserId);

  // Verify user was created
  const createdUser = await users.findOne({ username: 'jan' });
  console.log('Verifying test user:', createdUser);

  // Start test server
  if (!app) {
    const { createApp } = await import('../../app.ts');
    app = await createApp();
    try {
      console.log('Starting test server...');
      controller = new AbortController();
      serverPromise = app.listen({
        port: 3000,
        hostname: '127.0.0.1',
        signal: controller.signal,
      }).finally(() => {
        // Ensure server is properly cleaned up
        controller?.abort();
        controller = null;
        serverPromise = null;
      });

      // Wait for server to be ready
      let timeoutId: number | null = null;
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      try {
        await new Promise<void>((resolve, reject) => {
          const checkServer = async () => {
            try {
              const response = await fetch('http://localhost:3000/api/user/check');
              const text = await response.text(); // Consume the response body
              if (response.status === 401) { // Expected unauthorized response
                console.log('Server is ready');
                cleanup();
                resolve();
              } else {
                timeoutId = setTimeout(checkServer, 100);
              }
            } catch (error: unknown) {
              if (error instanceof Error && error.message.includes('Connection refused')) {
                timeoutId = setTimeout(checkServer, 100);
              } else {
                console.error('Server check error:', error);
                cleanup();
                reject(error);
              }
            }
          };
          checkServer();
        });
      } catch (error) {
        cleanup();
        throw error;
      }
    } catch (error) {
      console.error('Server start error:', error);
      throw error;
    }
  }

  return {
    testUserId,
    server: {
      close: async () => {
        if (controller) {
          controller.abort();
          if (serverPromise) {
            await serverPromise.catch(() => {
              // Ignore abort error
            });
          }
          controller = null;
          serverPromise = null;
        }
        app = null;
      },
    },
  };
}

export async function cleanupTest() {
  // Clean up database
  if (mongoClient) {
    const db = mongoClient.database(Deno.env.get('MONGO_DB_NAME') || 'recipe-app-test');
    // Clean all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
    await mongoClient.close();
    mongoClient = null;
  }

  // Stop server and cleanup connections
  if (app || controller || serverPromise) {
    try {
      // First abort any ongoing requests
      if (controller) {
        controller.abort();
      }

      // Wait for server to finish cleanup
      if (serverPromise) {
        await Promise.race([
          serverPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Server cleanup timeout')), 1000)
          ),
        ]).catch(() => {
          // Ignore cleanup errors
        });
      }

      // Force close any remaining connections
      if (app) {
        // @ts-ignore - Access internal _server to force close connections
        const server = app?.['_server'];
        if (server) {
          try {
            // @ts-ignore - Force close all connections
            server.close();
          } catch {
            // Ignore close errors
          }
        }
      }
    } finally {
      controller = null;
      serverPromise = null;
      app = null;
    }
  }

  // Wait for all connections to be fully closed
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Clean up environment
  const envKeys = [
    'NODE_ENV',
    'ENVIRONMENT',
    'JWT_SECRET',
    'JWT_EXPIRATION',
    'RATE_LIMIT_MAX',
    'RATE_LIMIT_WINDOW',
    'MAX_FILE_SIZE',
    'ALLOWED_FILE_TYPES',
    'UPLOAD_DIR',
    'MONGODB_URI',
    'MONGO_DB_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'ALLOWED_ORIGINS',
    'LOG_LEVEL',
    'PORT',
  ];
  for (const key of envKeys) {
    Deno.env.delete(key);
  }

  testUserId = null;
}

// Helper to create test data
export function createTestData() {
  if (!testUserId) {
    throw new Error('Test user ID not available. Did you call setupTest()?');
  }

  return {
    user: {
      id: testUserId,
      email: 'test@example.com',
      password: 'test-password',
      role: 'user',
    },
    recipe: {
      id: 'test-recipe-id',
      title: 'Test Recipe',
      description: 'Test Description',
      ingredients: [],
      steps: [],
      userId: testUserId,
    },
  };
}

// Helper to assert error types
export function assertErrorType(error: unknown, expectedType: string, message?: string) {
  if (!(error instanceof Error)) {
    throw new Error('Expected an Error object');
  }

  if (error.constructor.name !== expectedType) {
    throw new Error(
      `Expected error of type "${expectedType}" but got "${error.constructor.name}"`,
    );
  }

  if (message && !error.message.includes(message)) {
    throw new Error(
      `Expected error message to include "${message}" but got "${error.message}"`,
    );
  }
}

// Export test user ID for other tests to use
export function getTestUserId(): string {
  if (!testUserId) {
    throw new Error('Test user ID not available. Did you call setupTest()?');
  }
  return testUserId;
}
