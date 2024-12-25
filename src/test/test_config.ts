/// <reference lib="deno.ns" />
/// <reference types="./deno.d.ts" />

import { load } from 'https://deno.land/std@0.208.0/dotenv/mod.ts';
import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

let mongoClient: MongoClient | null = null;

export async function loadTestConfig() {
  // Load test environment variables
  try {
    const config = await load({
      envPath: '.env.test',
      export: true,
      allowEmptyValues: true
    });
    console.log('Loaded test environment variables:', Object.keys(config));
  } catch (error) {
    console.error('Failed to load .env.test:', error);
    throw error;
  }

  // Ensure test upload directory exists
  const uploadDir = Deno.env.get('UPLOAD_DIR') || './test-uploads';
  try {
    await Deno.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  // Clean up test upload directory
  for await (const entry of Deno.readDir(uploadDir)) {
    if (entry.isFile) {
      await Deno.remove(`${uploadDir}/${entry.name}`);
    }
  }
}

export async function setupTestDB() {
  const mongoUri = Deno.env.get('MONGO_URI');
  const dbName = Deno.env.get('MONGO_DB_NAME');

  // Skip MongoDB setup in test mode if no URI is provided
  if (!mongoUri) {
    console.warn('MONGO_URI not set, skipping database setup');
    return;
  }

  try {
    mongoClient = new MongoClient();
    await mongoClient.connect(mongoUri);
    const db = mongoClient.database(dbName);

    // Verify connection
    await db.listCollectionNames();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Don't throw error to allow tests to run without MongoDB
  }

  if (mongoClient) {
    try {
      // Clear all collections
      const db = mongoClient.database();
      const collections = await db.listCollectionNames();
      for (const collection of collections) {
        await db.collection(collection).deleteMany({});
      }
    } catch (error) {
      console.error('Failed to clear collections:', error);
    }
  }
}

export async function cleanupTestDB() {
  if (mongoClient) {
    const db = mongoClient.database();
    const collections = await db.listCollectionNames();
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
    await mongoClient.close();
    mongoClient = null;
  }
}

export async function cleanupTestConfig() {
  await cleanupTestDB();

  const uploadDir = Deno.env.get('UPLOAD_DIR') || './test-uploads';
  try {
    await Deno.remove(uploadDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}
