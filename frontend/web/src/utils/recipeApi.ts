import { api } from './api';
import { Recipe, RecipeFormData, RecipeSearchFilters } from '../types/recipe';

export const recipeApi = {
  // Get all recipes
  async getRecipes(filters?: RecipeSearchFilters): Promise<Recipe[]> {
    const queryParams = new URLSearchParams();
    if (filters?.name) queryParams.append('name', filters.name);
    if (filters?.author?._id) queryParams.append('author', filters.author._id);
    if (filters?.dishType) queryParams.append('dishType', filters.dishType);
    
    const url = `/recipes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<Recipe[]>(url);
  },

  // Get a single recipe by ID
  async getRecipe(id: string): Promise<Recipe> {
    return api.get<Recipe>(`/recipes/${id}`);
  },

  // Create a new recipe
  async createRecipe(recipe: RecipeFormData): Promise<Recipe> {
    const formData = new FormData();
    
    // Add recipe data
    formData.append('recipe', JSON.stringify({
      name: recipe.name,
      language: recipe.language,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      yield: recipe.yield,
      totalTime: recipe.totalTime,
      cookTime: recipe.cookTime,
      kilocalories: recipe.kilocalories,
      waitTime: recipe.waitTime,
      carb: recipe.carb,
      fat: recipe.fat,
      protein: recipe.protein,
      ingredients: recipe.ingredients,
      tags: recipe.tags,
      dishType: recipe.dishType,
    }));

    // Add image if present
    if (recipe.image) {
      formData.append('image', recipe.image);
    }

    return api.post<Recipe>('/recipes', formData);
  },

  // Update an existing recipe
  async updateRecipe(id: string, recipe: Partial<RecipeFormData>): Promise<Recipe> {
    const formData = new FormData();
    
    // Add recipe data
    formData.append('recipe', JSON.stringify(recipe));

    // Add image if present
    if (recipe.image) {
      formData.append('image', recipe.image);
    }

    return api.put<Recipe>(`/recipes/${id}`, formData);
  },

  // Delete a recipe
  async deleteRecipe(id: string): Promise<void> {
    return api.delete(`/recipes/${id}`);
  },

  // Toggle recipe favorite status
  async toggleFavorite(id: string): Promise<Recipe> {
    return api.post<Recipe>(`/recipes/${id}/favorite`, {});
  },

  // Get user's recipes
  async getUserRecipes(): Promise<Recipe[]> {
    return api.get<Recipe[]>('/recipes/user');
  },

  // Get recipe counts by category
  async getRecipeCounts(): Promise<Record<string, number>> {
    return api.get<Record<string, number>>('/recipes/counts');
  }
};
