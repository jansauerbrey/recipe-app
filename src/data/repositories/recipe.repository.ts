import { Collection, MongoClient, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Recipe } from '../../types/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppError } from '../../types/middleware.ts';

type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };

export class RecipeRepository {
  private collection: Collection<RecipeDoc>;

  constructor(client: MongoClient) {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
    this.collection = client.database(dbName).collection<RecipeDoc>('recipes');
  }

  private toRecipe(doc: RecipeDoc): Recipe {
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  }

  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new AppError(Status.BadRequest, 'Invalid recipe ID');
    }
  }

  async create(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    // Validate required fields
    if (!recipeData.title || !recipeData.userId) {
      throw new AppError(Status.BadRequest, 'Missing required fields');
    }

    const now = new Date();
    const _id = new ObjectId();

    const doc = await this.collection.insertOne({
      _id,
      ...recipeData,
      createdAt: now,
      updatedAt: now,
    });

    return this.toRecipe({
      _id,
      ...recipeData,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findById(id: string): Promise<Recipe | null> {
    try {
      const doc = await this.collection.findOne({ _id: this.toObjectId(id) });
      return doc ? this.toRecipe(doc) : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Status.BadRequest, 'Invalid recipe ID');
    }
  }

  async findByUserId(userId: string): Promise<Recipe[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map((doc) => this.toRecipe(doc));
  }

  async update(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    try {
      const _id = this.toObjectId(id);
      const doc = await this.collection.findAndModify(
        { _id },
        {
          update: {
            $set: { ...updates, updatedAt: new Date() },
          },
          new: true,
        },
      );

      if (!doc) {
        throw new AppError(Status.NotFound, 'Recipe not found');
      }

      return this.toRecipe(doc);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Status.BadRequest, 'Invalid recipe ID');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const _id = this.toObjectId(id);
      const result = await this.collection.deleteOne({ _id });
      if (!result || result === 0) {
        throw new AppError(Status.NotFound, 'Recipe not found');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Status.BadRequest, 'Invalid recipe ID');
    }
  }
}
