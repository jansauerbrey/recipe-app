import { Database, MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export interface TestDatabase {
  client: MongoClient;
  db: Database;
}

/**
 * Setup test database connection
 */
export async function setupTestDatabase(): Promise<TestDatabase> {
  const client = new MongoClient();
  const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe-app-test';
  const uri = Deno.env.get('MONGODB_URI') || 'mongodb://localhost:27017';

  try {
    await client.connect(uri);
    const db = client.database(dbName);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(client: MongoClient) {
  try {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe-app-test';
    const db = client.database(dbName);

    // Get all collection names
    const collections = await db.listCollectionNames();

    // Clear all collections
    for (const collectionName of collections) {
      await db.collection(collectionName).deleteMany({});
    }

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
export async function seedTestData(db: Database) {
  try {
    // Create test user
    const users = db.collection('users');
    await users.insertOne({
      username: 'testuser',
      password: '$2a$10$K8ZpdrjwzUWSTmtyM.SAHewu7Zxpq3kUXnv/DPZSM8k.DSrmSekxi', // 'testpass'
      role: 'user',
    });

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
        userId: 'testuser',
      },
      {
        title: 'Test Recipe 2',
        description: 'Test Description 2',
        ingredients: [
          { name: 'Ingredient 2', amount: 200, unit: 'ml' },
        ],
        instructions: ['Step 1', 'Step 2'],
        userId: 'testuser',
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
export function withTestDatabase(testFn: (db: TestDatabase) => Promise<void>) {
  return async () => {
    const testDb = await setupTestDatabase();
    try {
      await testFn(testDb);
    } finally {
      await cleanupTestDatabase(testDb.client);
    }
  };
}
