import { Database } from '../database.ts';
import { Unit, UnitResponse } from '../../types/unit.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class UnitRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<UnitResponse[]> {
    const units = await this.db.units.find().toArray();
    return units.map((unit) => ({
      ...unit,
      _id: unit._id.toString(),
    }));
  }

  async findById(id: string): Promise<UnitResponse | null> {
    const unit = await this.db.units.findOne({ _id: new ObjectId(id) });
    if (!unit) return null;
    return {
      ...unit,
      _id: unit._id.toString(),
    };
  }

  async create(unit: Omit<Unit, '_id'>): Promise<UnitResponse> {
    const id = await this.db.units.insertOne(unit);
    return {
      ...unit,
      _id: id.toString(),
    };
  }

  async update(id: string, unit: Partial<Omit<Unit, '_id'>>): Promise<boolean> {
    const result = await this.db.units.updateOne(
      { _id: new ObjectId(id) },
      { $set: unit }
    );
    return result.matchedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.units.deleteOne({ _id: new ObjectId(id) });
    return result > 0;
  }
}
