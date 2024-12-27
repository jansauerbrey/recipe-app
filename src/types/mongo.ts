import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { LocalizedName } from './recipe.ts';

export interface MongoUser {
  _id: ObjectId;
  username: string;
  email: string;
  password?: string;
  fullname: string;
  created: Date;
  is_activated: boolean;
  is_admin: boolean;
  autologin: boolean;
  settings: {
    spokenLanguages: string[];
    categoryOrder: string[];
    autoupdate: boolean;
    preferredLanguage: string;
    preferredWeekStartDay: number;
  };
  username_lower: string;
  favoriteRecipes: string[];
  resetPasswordExpires?: Date;
  resetPasswordToken?: string;
  emailNotConfirmed?: string;
  emailConfirmationToken?: string;
}

export interface MongoTag {
  _id: ObjectId;
  text: string;
  updated_at: Date;
  author: {
    _id: ObjectId;
    fullname: string;
    email: string;
  };
}

export interface MongoUnit {
  _id: ObjectId;
  name: LocalizedName;
}

export interface MongoIngredient {
  _id: ObjectId;
  name: LocalizedName;
  amount: number;
  unit: MongoUnit;
}

export interface MongoDishType {
  _id: ObjectId;
  name: LocalizedName;
  order: number;
  imagePath: string;
  identifier: string;
}

export interface MongoAuthor {
  _id: ObjectId;
  fullname: string;
  email: string;
}

export interface MongoRecipe {
  _id: ObjectId;
  userId: string;
  language: string;
  name: string;
  instructions: string;
  prepTime: number;
  yield: number;
  totalTime: number;
  author: MongoAuthor;
  cookTime: number;
  kilocalories: number;
  waitTime: number;
  carb: number;
  fat: number;
  protein: number;
  ingredients: MongoIngredient[];
  tags: string[];
  dishType: MongoDishType;
  imagePath: string;
  fav_recipe?: boolean;
  updatedAt: Date;
}
