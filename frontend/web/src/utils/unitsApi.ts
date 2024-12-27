import { api } from './api';
import { Unit } from '../types/recipe';

export const unitsApi = {
  // Get all units
  async getUnits(): Promise<Unit[]> {
    return api.get<Unit[]>('/units');
  },

  // Get a single unit by ID
  async getUnit(id: string): Promise<Unit> {
    return api.get<Unit>(`/units/${id}`);
  },

  // Create a new unit
  async createUnit(data: Omit<Unit, '_id'>): Promise<Unit> {
    return api.post<Unit>('/units', data);
  },

  // Update an existing unit
  async updateUnit(id: string, data: Omit<Unit, '_id'>): Promise<Unit> {
    return api.put<Unit>(`/units/${id}`, data);
  },

  // Delete a unit
  async deleteUnit(id: string): Promise<void> {
    return api.delete(`/units/${id}`);
  },
};
