import { LocalizedName } from './category';

interface ReweImageLinks {
  xs: string;
  sm: string;
  md: string;
}

export interface Ingredient {
  _id: string;
  name: LocalizedName;
  category_id: string;
  rewe_art_no: number;
  rewe_img_links: ReweImageLinks;
  author_id: string;
  updated_at: string;
}

export type CreateIngredientInput = Omit<Ingredient, '_id' | 'updated_at' | 'author_id'>;
export type UpdateIngredientInput = Partial<CreateIngredientInput>;
