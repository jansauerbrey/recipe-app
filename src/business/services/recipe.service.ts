import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { Recipe, RecipeResponse } from '../../types/mod.ts';
import { AppError } from '../../types/middleware.ts';

export interface IRecipeService {
  createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecipeResponse>;
  getRecipeById(id: string): Promise<RecipeResponse>;
  listUserRecipes(userId: string): Promise<RecipeResponse[]>;
  updateRecipe(id: string, updates: Partial<Recipe>): Promise<RecipeResponse>;
  deleteRecipe(id: string): Promise<void>;
}

export class RecipeService implements IRecipeService {
  constructor(private recipeRepository: RecipeRepository) {}

  async createRecipe(
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RecipeResponse> {
    const createdRecipe = await this.recipeRepository.create(recipe);
    const { id, ...rest } = createdRecipe;
    return {
      ...rest,
      _id: id,
    };
  }

  async getRecipeById(id: string): Promise<RecipeResponse> {
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) {
      throw new AppError(Status.NotFound, 'Recipe not found');
    }
    const { id: recipeId, ...rest } = recipe;
    return {
      ...rest,
      _id: recipeId,
    };
  }

  async listUserRecipes(userId: string): Promise<RecipeResponse[]> {
    const recipes = await this.recipeRepository.findByUserId(userId);
    return recipes.map((recipe) => {
      const { id, ...rest } = recipe;
      return {
        ...rest,
        _id: id,
      };
    });
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<RecipeResponse> {
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) {
      throw new AppError(Status.NotFound, 'Recipe not found');
    }

    const updatedRecipe = await this.recipeRepository.update(id, updates);
    const { id: recipeId, ...rest } = updatedRecipe;
    return {
      ...rest,
      _id: recipeId,
    };
  }

  async deleteRecipe(id: string): Promise<void> {
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) {
      throw new AppError(Status.NotFound, 'Recipe not found');
    }

    await this.recipeRepository.delete(id);
  }
}
