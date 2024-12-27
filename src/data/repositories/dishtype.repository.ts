import { Database } from '../database.ts';
import { DishType, DishTypeResponse } from '../../types/dishtype.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class DishTypeRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<DishTypeResponse[]> {
    const dishtypes = await this.db.dishtypes.find().sort({ order: 1 }).toArray();
    return dishtypes.map(this.toResponse);
  }

  async findById(id: string): Promise<DishTypeResponse | null> {
    const dishtype = await this.db.dishtypes.findOne({ _id: new ObjectId(id) });
    if (!dishtype) return null;
    return this.toResponse(dishtype);
  }

  async findByIdentifier(identifier: string): Promise<DishTypeResponse | null> {
    const dishtype = await this.db.dishtypes.findOne({ identifier });
    if (!dishtype) return null;
    return this.toResponse(dishtype);
  }

  async create(userId: string, dishtype: Omit<DishType, '_id' | 'author' | 'updated_at'>): Promise<DishTypeResponse> {
    const doc: Omit<DishType, '_id'> = {
      ...dishtype,
      author: new ObjectId(userId),
      updated_at: new Date(),
    };

    const id = await this.db.dishtypes.insertOne(doc);
    return this.toResponse({ _id: id, ...doc });
  }

  async update(id: string, dishtype: Partial<Omit<DishType, '_id' | 'author'>>): Promise<boolean> {
    const update = {
      ...dishtype,
      updated_at: new Date(),
    };

    const result = await this.db.dishtypes.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    return result.matchedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.dishtypes.deleteOne({ _id: new ObjectId(id) });
    return result > 0;
  }

  async getNextOrder(): Promise<number> {
    const lastDishType = await this.db.dishtypes.findOne(
      {},
      { sort: { order: -1 } }
    );
    return (lastDishType?.order ?? 0) + 1;
  }

  private toResponse(dishtype: DishType): DishTypeResponse {
    return {
      ...dishtype,
      _id: dishtype._id.toString(),
      author: dishtype.author.toString(),
      updated_at: dishtype.updated_at.toISOString(),
    };
  }
}
