import { Database } from '../data/database.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { UserService } from '../business/services/user.service.ts';
import { RecipeService } from '../business/services/recipe.service.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { RecipeRepository } from '../data/repositories/recipe.repository.ts';

export * from './user.ts';
export * from './recipe.ts';
export * from './unit.ts';
export * from './dishtype.ts';

import { TagsService } from '../business/services/tags.service.ts';
import { UnitService } from '../business/services/unit.service.ts';
import { DishTypeService } from '../business/services/dishtype.service.ts';
import { UnitRepository } from '../data/repositories/unit.repository.ts';
import { DishTypeRepository } from '../data/repositories/dishtype.repository.ts';

export interface Dependencies {
  db: Database;
  userService: UserService;
  recipeService: RecipeService;
  tagsService: TagsService;
  unitService: UnitService;
  userRepository: UserRepository;
  recipeRepository: RecipeRepository;
  unitRepository: UnitRepository;
  dishTypeService: DishTypeService;
  dishTypeRepository: DishTypeRepository;
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
  _id: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagResponse extends Omit<Tag, '_id'> {
  _id: string;
}

export interface RecipeResponse extends Omit<Recipe, 'id'> {
  _id: string;
}
