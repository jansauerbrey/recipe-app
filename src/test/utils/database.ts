import { Collection, Database, MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { TestUser } from '../test_utils.ts';

export interface TestContext {
  client: MongoClient;
  db: Database;
  userId: string;
}

/**
 * Create a test user
 */
export async function createTestUser(): Promise<TestUser> {
  const client = new MongoClient();
  const uri = Deno.env.get('MONGODB_URI') || 'mongodb://127.0.0.1:27018/recipe_app_test';
  const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';

  try {
    await client.connect(uri);
    const db = client.database(dbName);
    const users = db.collection('users');

    const testUser = {
      email: 'jan@test.com',
      name: 'jan',
      password: '$2a$10$K8ZpdrjwzUWSTmtyM.SAHewu7Zxpq3kUXnv/DPZSM8k.DSrmSekxi',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(testUser);
    await client.close();

    return {
      ...testUser,
      _id: result.toString(),
    };
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Delete a test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const client = new MongoClient();
  const uri = Deno.env.get('MONGODB_URI') || 'mongodb://127.0.0.1:27018/recipe_app_test';
  const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';

  try {
    await client.connect(uri);
    const db = client.database(dbName);
    const users = db.collection('users');
    await users.deleteOne({ _id: userId });
    await client.close();
  } catch (error) {
    console.error('Failed to delete test user:', error);
    throw error;
  }
}

/**
 * Setup test database connection
 */
export async function setupTestDatabase(): Promise<TestContext> {
  const client = new MongoClient();
  const uri = Deno.env.get('MONGODB_URI') || 'mongodb://127.0.0.1:27018/recipe_app_test';
  const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';

  try {
    await client.connect(uri);
    const db = client.database(dbName);

    // Create test user
    const users = db.collection('users');
    const result = await users.insertOne({
      email: 'testuser@test.com',
      name: 'testuser',
      password: '$2a$10$K8ZpdrjwzUWSTmtyM.SAHewu7Zxpq3kUXnv/DPZSM8k.DSrmSekxi', // 'testpass'
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { client, db, userId: result.toString() };
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(client: MongoClient): Promise<void> {
  try {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
    const db = client.database(dbName);

    // Get all collections
    const collections = await db.listCollectionNames();

    // Clear all collections
    const deletePromises = collections.map((name) => {
      const collection = db.collection(name);
      return collection.deleteMany({});
    });

    await Promise.all(deletePromises);

    // Close connection
    await client.close();
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    throw error;
  }
}

/**
 * Create test data in database
 */
export async function seedTestData(db: Database, userId: string): Promise<void> {
  try {
    // Create test recipes
    const recipes = db.collection('recipes');
    await recipes.insertMany([
      {
        title: 'Test Recipe 1',
        description: 'Test Description 1',
        ingredients: [
          { name: 'Ingredient 1', amount: 100, unit: 'g' },
        ],
        instructions: ['Step 1', 'Step 2'],
        userId,
      },
      {
        title: 'Test Recipe 2',
        description: 'Test Description 2',
        ingredients: [
          { name: 'Ingredient 2', amount: 200, unit: 'ml' },
        ],
        instructions: ['Step 1', 'Step 2'],
        userId,
      },
    ]);
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Utility function to wrap tests with database setup/cleanup
 */
export function withTestDatabase(testFn: (context: TestContext) => Promise<void>): () => Promise<void> {
  return async () => {
    const testContext = await setupTestDatabase();
    try {
      await testFn(testContext);
    } finally {
      await cleanupTestDatabase(testContext.client);
    }
  };
}
