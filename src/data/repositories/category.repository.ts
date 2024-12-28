import { Database } from '../database.ts';
import { Category, CategoryResponse } from '../../types/category.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class CategoryRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<CategoryResponse[]> {
    const categories = await this.db.categories.find().toArray();
    return categories.map(this.toResponse);
  }

  async findById(id: string): Promise<CategoryResponse | null> {
    const category = await this.db.categories.findOne({ _id: new ObjectId(id) });
    if (!category) return null;
    return this.toResponse(category);
  }

  async findByParentId(parentId: string | null): Promise<CategoryResponse[]> {
    const query = parentId 
      ? { parent_id: new ObjectId(parentId) }
      : { parent_id: { $exists: false } };
    const categories = await this.db.categories.find(query).toArray();
    return categories.map(this.toResponse);
  }

  async create(data: Omit<Category, '_id' | 'updated_at'>): Promise<CategoryResponse> {
    const doc: Omit<Category, '_id'> = {
      ...data,
      updated_at: new Date(),
    };

    const id = await this.db.categories.insertOne(doc);
    return this.toResponse({ _id: id, ...doc });
  }

  async update(id: string, data: Partial<Omit<Category, '_id'>>): Promise<boolean> {
    const update = {
      ...data,
      updated_at: new Date(),
    };

    const result = await this.db.categories.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    return result.matchedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    // First check if there are any child categories
    const childCategories = await this.db.categories.findOne({ parent_id: new ObjectId(id) });
    if (childCategories) {
      throw new Error('Cannot delete category with child categories');
    }

    // Then check if there are any ingredients using this category
    const ingredients = await this.db.ingredients.findOne({ category_id: new ObjectId(id) });
    if (ingredients) {
      throw new Error('Cannot delete category that is used by ingredients');
    }

    const result = await this.db.categories.deleteOne({ _id: new ObjectId(id) });
    return result > 0;
  }

  private toResponse(category: Category): CategoryResponse {
    return {
      ...category,
      _id: category._id.toString(),
      parent_id: category.parent_id?.toString(),
      updated_at: category.updated_at.toISOString(),
    };
  }
}
