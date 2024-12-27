import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Database } from '../database.ts';
import { Recipe, DishType } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

type RecipeDoc = Omit<Recipe, 'id'> & { _id: ObjectId };

const DISH_TYPES: DishType[] = [
  { id: 'all', name: 'All Recipes', slug: 'all', imageUrl: '/img/dishtypes/all.jpg' },
  { id: 'my', name: 'My Recipes', slug: 'my', imageUrl: '/img/dishtypes/my.jpg' },
  { id: 'new', name: 'New Recipes', slug: 'new', imageUrl: '/img/dishtypes/new.jpg' },
  { id: 'favorites', name: 'Favorite Recipes', slug: 'favorites', imageUrl: '/img/dishtypes/favorites.jpg' },
  { id: '56294bad07ee48b60ec4405b', name: 'Breakfast', slug: 'breakfast', imageUrl: '/img/dishtypes/breakfast.jpg' },
  { id: '56293446137c052908b75e22', name: 'Main Dishes', slug: 'maindishes', imageUrl: '/img/dishtypes/maindishes.jpg' },
  { id: '562940cc4bdc01930dca94d9', name: 'Side Dishes', slug: 'sidedishes', imageUrl: '/img/dishtypes/sidedishes.jpg' },
  { id: '562940db4bdc01930dca94da', name: 'Salads', slug: 'salads', imageUrl: '/img/dishtypes/salads.jpg' },
  { id: '562940ee4bdc01930dca94db', name: 'Desserts', slug: 'desserts', imageUrl: '/img/dishtypes/desserts.jpg' },
  { id: '5668a3b36faed8e960d4f213', name: 'Snacks', slug: 'snacks', imageUrl: '/img/dishtypes/snacks.jpg' },
  { id: '562aabc37a696f1229593c42', name: 'Breads', slug: 'breads', imageUrl: '/img/dishtypes/breads.jpg' },
  { id: '562934ae137c052908b75e23', name: 'Appetizer', slug: 'appetizer', imageUrl: '/img/dishtypes/appetizer.jpg' },
  { id: '562940bd4bdc01930dca94d8', name: 'Drinks', slug: 'drinks', imageUrl: '/img/dishtypes/drinks.jpg' },
  { id: '5629f52a2b9118f35b96c2ca', name: 'Other', slug: 'other', imageUrl: '/img/dishtypes/no_image.png' }
];

interface RecipeFilter {
  userId?: string;
  dishType?: string;
  name?: string;
  author?: string;
  tags?: string[];
}

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

  async findWithFilters(filter: RecipeFilter): Promise<Recipe[]> {
    const query: Record<string, unknown> = {};

    if (filter.userId) {
      query.userId = filter.userId;
    }

    if (filter.dishType) {
      switch (filter.dishType) {
        case 'all':
          // No filter needed for 'all'
          break;
        case 'my':
          // Already handled by userId filter
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
        default: {
          // For regular dish types, filter by category
          const dishType = DISH_TYPES.find((dt: DishType) => dt.slug === filter.dishType);
          if (dishType) {
            query.category = dishType.slug;
          }
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
