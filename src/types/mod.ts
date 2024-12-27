import { Database } from '../data/database.ts';
import { UserService } from '../business/services/user.service.ts';
import { RecipeService } from '../business/services/recipe.service.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { RecipeRepository } from '../data/repositories/recipe.repository.ts';

export * from './user.ts';

import { TagsService } from '../business/services/tags.service.ts';

export interface Dependencies {
  db: Database;
  userService: UserService;
  recipeService: RecipeService;
  tagsService: TagsService;
  userRepository: UserRepository;
  recipeRepository: RecipeRepository;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  category?: string;
  new_recipe?: boolean;
  fav_recipe?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagResponse extends Omit<Tag, 'id'> {
  _id: string;
}

export interface RecipeResponse extends Omit<Recipe, 'id'> {
  _id: string;
}
