import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { LocalizedName } from './recipe.ts';

interface ReweImageLinks {
  xs: string;
  sm: string;
  md: string;
}

export interface Ingredient {
  _id: ObjectId;
  name: LocalizedName;
  category_id: ObjectId;
  rewe_art_no: number;
  rewe_img_links: ReweImageLinks;
  author_id: ObjectId;
  updated_at: Date;
}

export interface IngredientResponse {
  _id: string;
  name: LocalizedName;
  category_id: string;
  rewe_art_no: number;
  rewe_img_links: ReweImageLinks;
  author_id: string;
  updated_at: string;
}

export interface CreateIngredientInput {
  name: LocalizedName;
  category_id: string;
  rewe_art_no: number;
  rewe_img_links: ReweImageLinks;
}

export interface UpdateIngredientInput {
  name?: LocalizedName;
  category_id?: string;
  rewe_art_no?: number;
  rewe_img_links?: ReweImageLinks;
}
