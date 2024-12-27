import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { LocalizedName } from './recipe.ts';

export interface Unit {
  _id: ObjectId;
  name: LocalizedName;
}

export interface UnitResponse extends Omit<Unit, '_id'> {
  _id: string;
}
