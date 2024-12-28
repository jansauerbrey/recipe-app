import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Database } from '../database.ts';
import { DishType } from '../../types/dishtype.ts';

export class DishTypeRepository {
  private collection: Collection<DishType>;

  constructor(private database: Database) {
    this.collection = database.dishtypes;
  }

  private validateDishType(dishType: Omit<DishType, '_id'>): void {
    // Validate LocalizedName has all required fields
    if (!dishType.name.en || !dishType.name.de || !dishType.name.fi) {
      throw new Error('Validation failed: LocalizedName must have en, de, and fi translations');
    }

    // Validate identifier is not empty
    if (!dishType.identifier.trim()) {
      throw new Error('Validation failed: identifier cannot be empty');
    }
  }

  async create(dishType: Omit<DishType, '_id'>): Promise<DishType> {
    this.validateDishType(dishType);
    const insertedId = await this.collection.insertOne(dishType);
    return { ...dishType, _id: insertedId };
  }

  async findById(id: string | ObjectId): Promise<DishType | null> {
    const result = await this.collection.findOne({ _id: new ObjectId(id) });
    return result || null;
  }

  async update(id: string | ObjectId, updates: Partial<DishType>): Promise<DishType> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.modifiedCount === 0) {
      throw new Error('DishType not found');
    }

    return await this.findById(id) as DishType;
  }

  async delete(id: string | ObjectId): Promise<void> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    if (result === 0) {
      throw new Error('DishType not found');
    }
  }
}
