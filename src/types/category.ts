import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { LocalizedName } from './recipe.ts';

export interface Category {
  _id: ObjectId;
  name: LocalizedName;
  parent_id?: ObjectId;
  rewe_cat_id: number;
  updated_at: Date;
}

export interface CategoryResponse {
  _id: string;
  name: LocalizedName;
  parent_id?: string;
  rewe_cat_id: number;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: LocalizedName;
  parent_id?: string;
  rewe_cat_id: number;
}

export interface UpdateCategoryInput {
  name?: LocalizedName;
  parent_id?: string | null; // null to remove parent
  rewe_cat_id?: number;
}
