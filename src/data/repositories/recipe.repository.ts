import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Database } from '../database.ts';
import { Recipe } from '../../types/mod.ts';
import { DishType } from '../../types/dishtype.ts';
import { FilterType, RECIPE_FILTERS } from '../../types/filter.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };

interface RecipeFilter {
  userId?: string;
  dishType?: string;
  name?: string;
  author?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to?: Date;
  };
  favorites?: boolean;
}

export class RecipeRepository {
  private collection: Collection<RecipeDoc>;
  private dishTypeCollection: Collection<DishType>;

  constructor(db: Database) {
    this.collection = db.recipes;
    this.dishTypeCollection = db.dishtypes;
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

  async findWithFilters(filter: RecipeFilter): Promise<Recipe[]> {
    const query: Record<string, unknown> = {};

    if (filter.dishType) {
      const isSpecialFilter = RECIPE_FILTERS.some(f => f.identifier === filter.dishType);
      
      if (isSpecialFilter) {
        switch (filter.dishType) {
          case 'all':
            // No filters for 'all' recipes
            break;
          case 'my':
            if (filter.userId) {
              query.userId = filter.userId;
            }
            break;
          case 'new': {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.createdAt = { $gt: thirtyDaysAgo };
            break;
          }
          case 'favorites':
            query.fav_recipe = true;
            break;
        }
      } else {
        // For regular dish types, filter by category
        const dishType = await this.dishTypeCollection.findOne({ identifier: filter.dishType });
        if (dishType) {
          query.dishType = dishType._id;
        }
      }
    }

    if (filter.name) {
      query.name = { $regex: new RegExp(filter.name, 'i') };
    }

    if (filter.author) {
      query['author.fullname'] = { $regex: new RegExp(filter.author, 'i') };
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags };
    }

    const docs = await this.collection.find(query).toArray();
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
