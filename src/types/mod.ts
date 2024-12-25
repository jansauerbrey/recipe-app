import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { UserService } from '../business/services/user.service.ts';
import { RecipeService } from '../business/services/recipe.service.ts';
import { UserRepository } from '../data/repositories/user.repository.ts';
import { RecipeRepository } from '../data/repositories/recipe.repository.ts';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Dependencies {
  db: MongoClient;
  userService: UserService;
  recipeService: RecipeService;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeResponse extends Omit<Recipe, 'id'> {
  _id: string;
}
