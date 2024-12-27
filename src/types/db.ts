import { MongoClient, Database, Collection } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { User, Recipe, DishType } from './mod.ts';

export interface DBCollections {
  users: Collection<User>;
  recipes: Collection<Recipe>;
  dishtypes: Collection<DishType>;
}

export interface DB extends Database {
  collections: DBCollections;
}

export interface MongoConnection {
  client: MongoClient;
  db: DB;
}

// Helper function to get typed collections
export function getCollections(db: Database): DBCollections {
  return {
    users: db.collection<User>('users'),
    recipes: db.collection<Recipe>('recipes'),
    dishtypes: db.collection<DishType>('dishtypes'),
  };
}

// Helper function to create indexes
export async function createIndexes(collections: DBCollections): Promise<void> {
  // User indexes
  await collections.users.createIndexes({
    indexes: [
      {
        key: { email: 1 },
        name: 'email_unique',
        unique: true,
      },
      {
        key: { role: 1 },
        name: 'role_index',
      },
    ],
  });

  // Recipe indexes
  await collections.recipes.createIndexes({
    indexes: [
      {
        key: { userId: 1 },
        name: 'user_id_index',
      },
      {
        key: { title: 'text', description: 'text' },
        name: 'text_search_index',
      },
      {
        key: { tags: 1 },
        name: 'tags_index',
      },
      {
        key: { 'ingredients.name': 1 },
        name: 'ingredients_name_index',
      },
      {
        key: { createdAt: -1 },
        name: 'created_at_index',
      },
    ],
  });

  // DishType indexes
  await collections.dishtypes.createIndexes({
    indexes: [
      {
        key: { author: 1 },
        name: 'author_index',
      },
      {
        key: { order: 1 },
        name: 'order_index',
      },
      {
        key: { identifier: 1 },
        name: 'identifier_unique',
        unique: true,
      },
      {
        key: { updated_at: -1 },
        name: 'updated_at_index',
      },
    ],
  });
}

// Helper function to initialize database connection
export async function initializeDB(uri: string): Promise<MongoConnection> {
  const client = new MongoClient();
  
  try {
    await client.connect(uri);
    const db = client.database() as DB;
    db.collections = getCollections(db);
    await createIndexes(db.collections);
    
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}
