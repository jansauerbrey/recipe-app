import { CategoryRepository } from '../../data/repositories/category.repository.ts';
import { Category, CategoryResponse, CreateCategoryInput, UpdateCategoryInput } from '../../types/category.ts';
import { ValidationError } from '../../types/errors.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class CategoryService {
  constructor(private repository: CategoryRepository) {}

  async getAllCategories(): Promise<CategoryResponse[]> {
    return await this.repository.findAll();
  }

  async getCategoryById(id: string): Promise<CategoryResponse | null> {
    return await this.repository.findById(id);
  }

  async getRootCategories(): Promise<CategoryResponse[]> {
    return await this.repository.findByParentId(null);
  }

  async getSubcategories(parentId: string): Promise<CategoryResponse[]> {
    return await this.repository.findByParentId(parentId);
  }

  async createCategory(data: CreateCategoryInput): Promise<CategoryResponse> {
    // Validate required fields
    if (!data.name?.en || !data.name?.de || !data.name?.fi) {
      throw new ValidationError('Name translations (en, de, fi) are required');
    }

    if (data.rewe_cat_id === undefined) {
      throw new ValidationError('REWE category ID is required');
    }

    // If parent_id is provided, verify it exists
    if (data.parent_id) {
      const parentExists = await this.repository.findById(data.parent_id);
      if (!parentExists) {
        throw new ValidationError('Parent category not found');
      }
    }

    return await this.repository.create({
      name: data.name,
      parent_id: data.parent_id ? new ObjectId(data.parent_id) : undefined,
      rewe_cat_id: data.rewe_cat_id,
    });
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<boolean> {
    // If parent_id is provided (including null to remove parent), verify new parent exists
    if (data.parent_id !== undefined && data.parent_id !== null) {
      const parentExists = await this.repository.findById(data.parent_id);
      if (!parentExists) {
        throw new ValidationError('Parent category not found');
      }
    }

    // Prepare update data
    const updateData: Partial<Category> = {
      ...(data.name && { name: data.name }),
      ...(data.rewe_cat_id !== undefined && { rewe_cat_id: data.rewe_cat_id }),
    };

    // Handle parent_id separately since it can be explicitly set to undefined
    if (data.parent_id !== undefined) {
      updateData.parent_id = data.parent_id ? new ObjectId(data.parent_id) : undefined;
    }

    return await this.repository.update(id, updateData);
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('child categories')) {
          throw new ValidationError('Cannot delete category with child categories');
        }
        if (error.message.includes('used by ingredients')) {
          throw new ValidationError('Cannot delete category that is used by ingredients');
        }
      }
      throw error;
    }
  }
}
