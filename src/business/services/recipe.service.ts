import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { Recipe, RecipeResponse } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

export interface IRecipeService {
  createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecipeResponse>;
  getRecipeById(id: string): Promise<RecipeResponse>;
  listUserRecipes(userId: string): Promise<RecipeResponse[]>;
  updateRecipe(id: string, updates: Partial<Recipe>): Promise<RecipeResponse>;
  deleteRecipe(id: string): Promise<void>;
  countRecipesByCategory(userId: string): Promise<Record<string, number>>;
}

export class RecipeService implements IRecipeService {
  constructor(private recipeRepository: RecipeRepository) {}

  async createRecipe(
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RecipeResponse> {
    // Validate required fields
    if (!recipe.title) {
      throw new ValidationError('Title is required');
    }
    if (!recipe.userId) {
      throw new ValidationError('User ID is required');
    }

    // Validate ingredients
    if (recipe.ingredients?.some((ing) => !ing.name || ing.amount <= 0 || !ing.unit)) {
      throw new ValidationError('Invalid ingredient');
    }

    const createdRecipe = await this.recipeRepository.create(recipe);
    const { id, ...rest } = createdRecipe;
    return {
      ...rest,
      _id: id,
    };
  }

  async getRecipeById(id: string): Promise<RecipeResponse> {
    const recipe = await this.recipeRepository.findById(id);
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
    // Validate ingredients if they're being updated
    if (updates.ingredients?.some((ing) => !ing.name || ing.amount <= 0 || !ing.unit)) {
      throw new ValidationError('Invalid ingredient');
    }

    const updatedRecipe = await this.recipeRepository.update(id, updates);
    const { id: recipeId, ...rest } = updatedRecipe;
    return {
      ...rest,
      _id: recipeId,
    };
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.recipeRepository.delete(id);
  }

  async countRecipesByCategory(userId: string): Promise<Record<string, number>> {
    const recipes = await this.recipeRepository.findByUserId(userId);
    const counts: Record<string, number> = {};

    // Initialize counts for all dish types
    counts['Main Dishes'] = 0;
    counts['Appetizers'] = 0;
    counts['Desserts'] = 0;
    counts['Salads'] = 0;
    counts['Soups'] = 0;
    counts['Beverages'] = 0;

    recipes.forEach((recipe) => {
      // Count by dish type category
      const category = recipe.category || 'Main Dishes';
      counts[category] = (counts[category] || 0) + 1;

      // Count new recipes
      if (recipe.new_recipe) {
        counts['new'] = (counts['new'] || 0) + 1;
      }

      // Count favorite recipes
      if (recipe.fav_recipe) {
        counts['favorites'] = (counts['favorites'] || 0) + 1;
      }
    });

    return counts;
  }
}
