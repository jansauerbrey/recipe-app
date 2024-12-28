import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export interface LocalizedName {
  en: string;
  de: string;
  fi: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  dishType: {
    _id: string;
    name: LocalizedName;
    order: number;
    imagePath: string;
    identifier: string;
    author: string;
    updated_at: string;
  };
  category?: string;
  imagePath?: string;  // Added for image support
  new_recipe?: boolean;
  fav_recipe?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeResponse extends Omit<Recipe, 'id'> {
  _id: string;
}

export type CreateRecipeData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export type RecipeDoc = Omit<Recipe, 'id'> & { _id: string };
