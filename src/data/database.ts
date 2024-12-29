import { Collection, MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Tag, User, Recipe, Unit, DishType, Category, Ingredient } from '../types/mod.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { logger } from '../utils/logger.ts';

type TagDoc = Omit<Tag, '_id'> & { _id: ObjectId };
type UserDoc = Omit<User, 'id'> & { _id: ObjectId };
type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };
type UnitDoc = Omit<Unit, '_id'> & { _id: ObjectId };
type DishTypeDoc = Omit<DishType, '_id'> & { _id: ObjectId };
type CategoryDoc = Omit<Category, '_id'> & { _id: ObjectId };
type IngredientDoc = Omit<Ingredient, '_id'> & { _id: ObjectId };

export interface Database {
  tags: Collection<TagDoc>;
  users: Collection<UserDoc>;
  recipes: Collection<RecipeDoc>;
  units: Collection<UnitDoc>;
  dishtypes: Collection<DishTypeDoc>;
  categories: Collection<CategoryDoc>;
  ingredients: Collection<IngredientDoc>;
}

export class MongoDatabase implements Database {
  public tags: Collection<TagDoc>;
  public users: Collection<UserDoc>;
  public recipes: Collection<RecipeDoc>;
  public units: Collection<UnitDoc>;
  public dishtypes: Collection<DishTypeDoc>;
  public categories: Collection<CategoryDoc>;
  public ingredients: Collection<IngredientDoc>;

  constructor(private client: MongoClient) {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
    logger.debug('Initializing MongoDB database connection', { 
      dbName,
      collections: ['tags', 'users', 'recipes', 'units', 'dishtypes', 'categories', 'ingredients']
    });
    const db = client.database(dbName);
    this.tags = db.collection<TagDoc>('tags');
    this.users = db.collection<UserDoc>('users');
    this.recipes = db.collection<RecipeDoc>('recipes');
    this.units = db.collection<UnitDoc>('units');
    this.dishtypes = db.collection<DishTypeDoc>('dishtypes');
    this.categories = db.collection<CategoryDoc>('categories');
    this.ingredients = db.collection<IngredientDoc>('ingredients');
  }

  static async connect(uri: string): Promise<MongoDatabase> {
    logger.debug('Attempting to connect to MongoDB', { 
      uri: uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Log URI with hidden credentials
    });
    
    try {
      const client = new MongoClient();
      await client.connect(uri);
      logger.debug('Successfully connected to MongoDB');
      return new MongoDatabase(client);
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
