import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { Recipe, RecipeResponse } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

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
    try {
      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new ResourceNotFoundError('Recipe');
      }
      const { id: recipeId, ...rest } = recipe;
      return {
        ...rest,
        _id: recipeId,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new ValidationError('Invalid recipe ID');
    }
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
    try {
      // Validate ingredients if they're being updated
      if (updates.ingredients?.some((ing) => !ing.name || ing.amount <= 0 || !ing.unit)) {
        throw new ValidationError('Invalid ingredient');
      }

      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new ResourceNotFoundError('Recipe');
      }

      const updatedRecipe = await this.recipeRepository.update(id, updates);
      const { id: recipeId, ...rest } = updatedRecipe;
      return {
        ...rest,
        _id: recipeId,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid recipe ID');
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new ResourceNotFoundError('Recipe');
      }

      await this.recipeRepository.delete(id);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new ValidationError('Invalid recipe ID');
    }
  }
}
