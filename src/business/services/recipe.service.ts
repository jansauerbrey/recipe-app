import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { Recipe, RecipeResponse, CreateRecipeData, RecipeIngredient } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';
import { storageService } from '../../utils/storage.ts';

export interface RecipeFilter {
  userId?: string;
  dishType?: string;
  name?: string;
  author?: string;
  tags?: string[];
}

export interface IRecipeService {
  createRecipe(recipe: CreateRecipeData): Promise<RecipeResponse>;
  getRecipeById(id: string): Promise<RecipeResponse>;
  listUserRecipes(userId: string): Promise<RecipeResponse[]>;
  listRecipesWithFilters(filter: RecipeFilter): Promise<RecipeResponse[]>;
  updateRecipe(id: string, updates: Partial<Recipe>): Promise<RecipeResponse>;
  deleteRecipe(id: string): Promise<void>;
  countRecipesByCategory(userId: string): Promise<Record<string, number>>;
}

export class RecipeService implements IRecipeService {
  constructor(private recipeRepository: RecipeRepository) {}

  async createRecipe(recipe: CreateRecipeData): Promise<RecipeResponse> {
    // Validate required fields
    if (!recipe.name) {
      throw new ValidationError('Name is required');
    }
    if (!recipe.userId) {
      throw new ValidationError('User ID is required');
    }

    // Validate ingredients
    if (recipe.ingredients?.some((ing: RecipeIngredient) => !ing.name || ing.amount <= 0 || !ing.unit)) {
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

  async listRecipesWithFilters(filter: RecipeFilter): Promise<RecipeResponse[]> {
    const recipes = await this.recipeRepository.findWithFilters(filter);
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

    // If updating image, delete the old one
    if (updates.imagePath) {
      const existingRecipe = await this.recipeRepository.findById(id);
      if (existingRecipe.imagePath) {
        try {
          // Extract key from the old image URL
          const oldKey = this.getKeyFromUrl(existingRecipe.imagePath);
          if (oldKey) {
            await storageService.deleteFile(oldKey);
          }
        } catch (error) {
          console.error('Failed to delete old image:', error);
          // Continue with update even if deletion fails
        }
      }
    }

    const updatedRecipe = await this.recipeRepository.update(id, updates);
    const { id: recipeId, ...rest } = updatedRecipe;
    return {
      ...rest,
      _id: recipeId,
    };
  }

  async deleteRecipe(id: string): Promise<void> {
    // Get recipe to check for image
    const recipe = await this.recipeRepository.findById(id);
    
    // Delete the recipe
    await this.recipeRepository.delete(id);

    // Delete associated image if it exists
    if (recipe.imagePath) {
      try {
        const key = this.getKeyFromUrl(recipe.imagePath);
        if (key) {
          await storageService.deleteFile(key);
        }
      } catch (error) {
        console.error('Failed to delete recipe image:', error);
        // Don't throw error as recipe is already deleted
      }
    }
  }

  private getKeyFromUrl(url: string): string | null {
    try {
      // Extract the key from the full R2 URL
      // URL format: https://{accountId}.r2.cloudflarestorage.com/{bucket}/{key}
      const urlParts = url.split('/');
      return urlParts.slice(4).join('/'); // Skip protocol, domain, and bucket
    } catch {
      return null;
    }
  }

  async countRecipesByCategory(userId: string): Promise<Record<string, number>> {
    const allRecipes = await this.recipeRepository.findWithFilters({});
    const userRecipes = await this.recipeRepository.findByUserId(userId);
    const counts: Record<string, number> = {};

    // Count all recipes
    counts['all'] = allRecipes.length;

    // Count user's recipes (only user-specific count)
    counts['my'] = userRecipes.length;

    // Count by dishType (all recipes)
    allRecipes.forEach((recipe) => {
      if (recipe.dishType?.identifier) {
        counts[recipe.dishType.identifier] = (counts[recipe.dishType.identifier] || 0) + 1;
      }
    });

    // Count new recipes (all recipes)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    counts['new'] = allRecipes.filter(recipe => 
      new Date(recipe.createdAt) > thirtyDaysAgo
    ).length;

    // Count favorite recipes (all recipes)
    counts['favorites'] = allRecipes.filter(recipe => recipe.fav_recipe).length;

    return counts;
  }
}
