import { api } from './api';
import { Ingredient, CreateIngredientInput, UpdateIngredientInput } from '../types/ingredient';

export const ingredientsApi = {
  // Get all ingredients
  async getIngredients(): Promise<Ingredient[]> {
    return api.get<Ingredient[]>('/ingredients');
  },

  // Get a single ingredient by ID
  async getIngredient(id: string): Promise<Ingredient> {
    return api.get<Ingredient>(`/ingredients/${id}`);
  },

  // Create a new ingredient
  async createIngredient(data: CreateIngredientInput): Promise<Ingredient> {
    return api.post<Ingredient>('/ingredients', data);
  },

  // Update an existing ingredient
  async updateIngredient(id: string, data: UpdateIngredientInput): Promise<Ingredient> {
    return api.put<Ingredient>(`/ingredients/${id}`, data);
  },

  // Delete an ingredient
  async deleteIngredient(id: string): Promise<void> {
    return api.delete(`/ingredients/${id}`);
  },
};
