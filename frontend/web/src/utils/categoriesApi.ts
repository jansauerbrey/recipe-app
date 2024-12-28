import { api } from './api';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';

export const categoriesApi = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    return api.get<Category[]>('/categories');
  },

  // Get a single category by ID
  async getCategory(id: string): Promise<Category> {
    return api.get<Category>(`/categories/${id}`);
  },

  // Create a new category
  async createCategory(data: CreateCategoryInput): Promise<Category> {
    return api.post<Category>('/categories', data);
  },

  // Update an existing category
  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    return api.put<Category>(`/categories/${id}`, data);
  },

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    return api.delete(`/categories/${id}`);
  },
};
