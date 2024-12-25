import { Application } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

let app: Application | null = null;
let mongoClient: MongoClient | null = null;
let testUserId: string | null = null;
let controller: AbortController | null = null;
let serverPromise: Promise<void> | null = null;

// Keep track of used ports
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

export interface TestContext {
  testUserId: string | null;
  mongoClient: MongoClient;
  port: number;
  server: {
    close: () => Promise<void>;
  };
}

let envVarsLoaded = false;

async function loadEnvVars() {
  if (!envVarsLoaded) {
    const { load } = await import('https://deno.land/std@0.208.0/dotenv/mod.ts');
    await load({
      envPath: '.env.test',
      export: true,
      allowEmptyValues: true,
    });
    envVarsLoaded = true;
  }
}

export async function setupTest(): Promise<TestContext> {
  // Clean up any existing test resources
  await cleanupTest();

  // Load test environment variables
  await loadEnvVars();

  // Connect to MongoDB
  mongoClient = new MongoClient();
  await mongoClient.connect(Deno.env.get('MONGODB_URI')!);

  // Clean up any existing data
  const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
  const db = mongoClient.database(dbName);
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }

  // Create test user
  console.log('Setting up test user...');
  const users = db.collection('users');
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
  const { createApp } = await import('../../app.ts');
  app = await createApp();
  try {
    console.log('Starting test server...');
    controller = new AbortController();
    const port = await getAvailablePort();

    // Start server
    serverPromise = app.listen({
      port,
      hostname: '127.0.0.1',
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
            console.log('Server is ready');
            cleanup();
            resolve();
          } else if (attempts < maxAttempts) {
            attempts++;
            timeoutId = setTimeout(checkServer, 100);
          } else {
            cleanup();
            reject(new Error('Server failed to start'));
          }
        } catch (error: unknown) {
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

    return {
      testUserId,
      mongoClient,
      port,
      server: {
        close: async () => {
          // First abort any ongoing requests
          if (controller) {
            controller.abort();
          }

          // Wait for server to finish cleanup
          if (serverPromise) {
            try {
              await serverPromise;
            } catch {
              // Ignore cleanup errors
            }
          }

          // Force close any remaining connections
          if (app) {
            // @ts-ignore - Access internal _server to force close connections
            const server = app?.['_server'];
            if (server) {
              try {
                // @ts-ignore - Force close all connections
                await server.close();
                // Add a small delay to ensure connections are fully closed
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch {
                // Ignore close errors
              }
            }
          }

          usedPorts.delete(port);

          // Clean up database
          if (mongoClient) {
            const db = mongoClient.database(Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test');
            const collections = await db.listCollections().toArray();
            for (const collection of collections) {
              await db.collection(collection.name).deleteMany({});
            }
            await mongoClient.close();
            mongoClient = null;
          }

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
          envVarsLoaded = false;
        },
      },
    };
  } catch (error) {
    console.error('Server start error:', error);
    await cleanupTest();
    throw error;
  }
}

export async function cleanupTest() {
  // Stop server and cleanup connections
  if (app || controller || serverPromise) {
    try {
      // First abort any ongoing requests
      if (controller) {
        controller.abort();
      }

      // Wait for server to finish cleanup
      if (serverPromise) {
        try {
          await serverPromise;
        } catch {
          // Ignore cleanup errors
        }
      }

      // Force close any remaining connections
      if (app) {
        // @ts-ignore - Access internal _server to force close connections
        const server = app?.['_server'];
        if (server) {
          try {
            // @ts-ignore - Force close all connections
            await server.close();
            // Add a small delay to ensure connections are fully closed
            await new Promise(resolve => setTimeout(resolve, 100));
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

  // Clean up database
  if (mongoClient) {
    const db = mongoClient.database(Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
    await mongoClient.close();
    mongoClient = null;
  }

  testUserId = null;
  envVarsLoaded = false;
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
      instructions: [],
      userId: testUserId,
      tags: [],
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
