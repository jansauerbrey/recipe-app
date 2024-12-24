import { MongoClient, Database, Collection } from "mongo";
import { User, Recipe } from "./mod.ts";

export interface DBCollections {
  users: Collection<User>;
  recipes: Collection<Recipe>;
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
    users: db.collection<User>("users"),
    recipes: db.collection<Recipe>("recipes"),
  };
}

// Helper function to create indexes
export async function createIndexes(collections: DBCollections): Promise<void> {
  // User indexes
  await collections.users.createIndexes({
    indexes: [
      {
        key: { email: 1 },
        unique: true,
      },
      {
        key: { role: 1 },
      },
    ],
  });

  // Recipe indexes
  await collections.recipes.createIndexes({
    indexes: [
      {
        key: { userId: 1 },
      },
      {
        key: { title: "text", description: "text" },
      },
      {
        key: { tags: 1 },
      },
      {
        key: { "ingredients.name": 1 },
      },
      {
        key: { createdAt: -1 },
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
