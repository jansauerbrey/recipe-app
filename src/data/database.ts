import { Collection, MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Tag } from '../types/mod.ts';

import { User } from '../types/mod.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

type UserDoc = Omit<User, 'id'> & { _id: ObjectId };

import { Recipe } from '../types/mod.ts';

type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };

export interface Database {
  tags: Collection<Tag>;
  users: Collection<UserDoc>;
  recipes: Collection<RecipeDoc>;
}

export class MongoDatabase implements Database {
  public tags: Collection<Tag>;
  public users: Collection<UserDoc>;
  public recipes: Collection<RecipeDoc>;

  constructor(private client: MongoClient) {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
    const db = client.database(dbName);
    this.tags = db.collection<Tag>('tags');
    this.users = db.collection<UserDoc>('users');
    this.recipes = db.collection<RecipeDoc>('recipes');
  }

  static async connect(uri: string): Promise<MongoDatabase> {
    const client = new MongoClient();
    await client.connect(uri);
    return new MongoDatabase(client);
  }
}
