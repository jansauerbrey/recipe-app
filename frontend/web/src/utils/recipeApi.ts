import { api } from './api';
import { Recipe, RecipeFormData, RecipeSearchFilters } from '../types/recipe';

export const recipeApi = {
  // Get all recipes
  async getRecipes(filters?: RecipeSearchFilters): Promise<Recipe[]> {
    const queryParams = new URLSearchParams();
    if (filters?.name) queryParams.append('name', filters.name);
    if (filters?.author?._id) queryParams.append('author', filters.author._id);
    if (filters?.dishType) queryParams.append('dishType', filters.dishType);
    if (filters?.tags?.length) queryParams.append('tags', filters.tags.join(','));
    if (filters?.dateRange?.from) {
      queryParams.append('fromDate', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) {
        queryParams.append('toDate', filters.dateRange.to.toISOString());
      }
    }
    if (filters?.favorites) queryParams.append('favorites', 'true');
    
    const url = `/recipes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<Recipe[]>(url);
  },

  // Get a single recipe by ID
  async getRecipe(id: string): Promise<Recipe> {
    return api.get<Recipe>(`/recipes/${id}`);
  },

  // Create a new recipe
  async createRecipe(recipe: RecipeFormData): Promise<Recipe> {
    try {
      // First, create the recipe
      const recipeResponse = await api.post<Recipe>('/recipes', {
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
      });

      // If there's an image, upload it in a separate call
      if (recipe.image) {
        const formData = new FormData();
        // Ensure we're sending the file with the correct field name and filename
        formData.append('image', recipe.image, recipe.image.name);
        
        // Log the form data for debugging
        console.log('Uploading image:', {
          fileName: recipe.image.name,
          fileType: recipe.image.type,
          fileSize: recipe.image.size,
          formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            value: value instanceof File ? {
              name: value.name,
              type: value.type,
              size: value.size
            } : value
          }))
        });
        
        await api.post(`/upload/${recipeResponse._id}`, formData);
      }

      return recipeResponse;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing recipe
  async updateRecipe(id: string, recipe: Partial<RecipeFormData>): Promise<Recipe> {
    try {
      // First update the recipe data
      const recipeResponse = await api.put<Recipe>(`/recipes/${id}`, {
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
      });

      // If there's an image, upload it in a separate call
      if (recipe.image) {
        const formData = new FormData();
        formData.append('image', recipe.image, recipe.image.name);
        
        await api.post(`/upload/${id}`, formData);
      }

      return recipeResponse;
    } catch (error) {
      throw error;
    }
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
