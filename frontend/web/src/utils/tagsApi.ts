import { api } from './api';
import { Tag } from '../types/recipe';

export const tagsApi = {
  // Get all tags
  async getTags(): Promise<Tag[]> {
    return api.get<Tag[]>('/tags');
  }
};
