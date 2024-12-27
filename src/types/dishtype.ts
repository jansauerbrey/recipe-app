import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { LocalizedName } from './recipe.ts';

// Internal DB model
export interface DishType {
  _id: ObjectId;
  author: ObjectId;
  order: number;
  imagePath: string;
  updated_at: Date;
  name: LocalizedName;
  identifier: string;
}

// API response model - matches frontend expectations
export interface DishTypeResponse {
  _id: string;
  author: string;
  order: number;
  imagePath: string;
  updated_at: string; // ISO string format
  name: LocalizedName;
  identifier: string;
}
