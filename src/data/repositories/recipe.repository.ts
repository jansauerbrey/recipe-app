import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Database } from '../database.ts';
import { Recipe } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };

export class RecipeRepository {
  private collection: Collection<RecipeDoc>;

  constructor(db: Database) {
    this.collection = db.recipes;
  }

  private toRecipe(doc: RecipeDoc): Recipe {
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  }

  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new ValidationError('Invalid recipe ID');
    }
  }

  async create(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    // Validate required fields
    if (!recipeData.title || !recipeData.userId) {
      throw new ValidationError('Missing required fields');
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

  async findById(id: string): Promise<Recipe> {
    const _id = this.toObjectId(id);
    const doc = await this.collection.findOne({ _id });
    if (!doc) {
      throw new ResourceNotFoundError('Recipe');
    }
    return this.toRecipe(doc);
  }

  async findByUserId(userId: string): Promise<Recipe[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map((doc) => this.toRecipe(doc));
  }

  async update(id: string, updates: Partial<Recipe>): Promise<Recipe> {
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
      throw new ResourceNotFoundError('Recipe');
    }

    return this.toRecipe(doc);
  }

  async delete(id: string): Promise<void> {
    const _id = this.toObjectId(id);
    const result = await this.collection.deleteOne({ _id });
    if (result === 0) {
      throw new ResourceNotFoundError('Recipe');
    }
  }
}
