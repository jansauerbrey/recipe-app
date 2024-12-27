import { api } from './api';
import { RecipeCount } from '../types/recipe';

export const otherApi = {
  // Get recipe counts
  async getRecipeCounts(): Promise<RecipeCount> {
    return api.get<RecipeCount>('/other/recipecount');
  }
};
