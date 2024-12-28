import { Database } from '../database.ts';
import { Ingredient, IngredientResponse } from '../../types/ingredient.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class IngredientRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<IngredientResponse[]> {
    const ingredients = await this.db.ingredients.find().toArray();
    return ingredients.map(this.toResponse);
  }

  async findById(id: string): Promise<IngredientResponse | null> {
    const ingredient = await this.db.ingredients.findOne({ _id: new ObjectId(id) });
    if (!ingredient) return null;
    return this.toResponse(ingredient);
  }

  async findByCategoryId(categoryId: string): Promise<IngredientResponse[]> {
    const ingredients = await this.db.ingredients.find({ 
      category_id: new ObjectId(categoryId) 
    }).toArray();
    return ingredients.map(this.toResponse);
  }

  async create(userId: string, data: Omit<Ingredient, '_id' | 'author_id' | 'updated_at'>): Promise<IngredientResponse> {
    const doc: Omit<Ingredient, '_id'> = {
      ...data,
      author_id: new ObjectId(userId),
      updated_at: new Date(),
    };

    const id = await this.db.ingredients.insertOne(doc);
    return this.toResponse({ _id: id, ...doc });
  }

  async update(id: string, data: Partial<Omit<Ingredient, '_id' | 'author_id'>>): Promise<boolean> {
    const update = {
      ...data,
      updated_at: new Date(),
    };

    const result = await this.db.ingredients.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    return result.matchedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.ingredients.deleteOne({ _id: new ObjectId(id) });
    return result > 0;
  }

  private toResponse(ingredient: Ingredient): IngredientResponse {
    return {
      ...ingredient,
      _id: ingredient._id.toString(),
      category_id: ingredient.category_id.toString(),
      author_id: ingredient.author_id.toString(),
      updated_at: ingredient.updated_at.toISOString(),
    };
  }
}
