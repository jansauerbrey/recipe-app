import { CreateDishTypeDto, DishType } from '../types/dishtype';
import { api } from './api';

export const dishtypesApi = {
  async getDishTypes(): Promise<DishType[]> {
    return api.get<DishType[]>('/dishtypes');
  },

  async getDishType(id: string): Promise<DishType> {
    return api.get<DishType>(`/dishtypes/${id}`);
  },

  async createDishType(dishType: CreateDishTypeDto): Promise<DishType> {
    return api.post<DishType>('/dishtypes', dishType);
  },

  async updateDishType(id: string, dishType: CreateDishTypeDto): Promise<DishType> {
    return api.put<DishType>(`/dishtypes/${id}`, dishType);
  },

  async deleteDishType(id: string): Promise<void> {
    await api.delete(`/dishtypes/${id}`);
  }
};
