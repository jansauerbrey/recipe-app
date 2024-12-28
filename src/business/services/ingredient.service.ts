import { IngredientRepository } from '../../data/repositories/ingredient.repository.ts';
import { CategoryRepository } from '../../data/repositories/category.repository.ts';
import { Ingredient, IngredientResponse, CreateIngredientInput, UpdateIngredientInput } from '../../types/ingredient.ts';
import { ValidationError } from '../../types/errors.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export class IngredientService {
  constructor(
    private repository: IngredientRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async getAllIngredients(): Promise<IngredientResponse[]> {
    return await this.repository.findAll();
  }

  async getIngredientById(id: string): Promise<IngredientResponse | null> {
    return await this.repository.findById(id);
  }

  async getIngredientsByCategory(categoryId: string): Promise<IngredientResponse[]> {
    return await this.repository.findByCategoryId(categoryId);
  }

  async createIngredient(userId: string, data: CreateIngredientInput): Promise<IngredientResponse> {
    // Validate required fields
    if (!data.name?.en || !data.name?.de || !data.name?.fi) {
      throw new ValidationError('Name translations (en, de, fi) are required');
    }

    if (!data.category_id) {
      throw new ValidationError('Category ID is required');
    }

    if (data.rewe_art_no === undefined) {
      throw new ValidationError('REWE article number is required');
    }

    if (!data.rewe_img_links?.xs || !data.rewe_img_links?.sm || !data.rewe_img_links?.md) {
      throw new ValidationError('All REWE image links (xs, sm, md) are required');
    }

    try {
      // Validate category exists
      const category = await this.categoryRepository.findById(data.category_id);
      if (!category) {
        throw new ValidationError('Category not found');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid category ID');
    }

    return await this.repository.create(userId, {
      name: data.name,
      category_id: new ObjectId(data.category_id),
      rewe_art_no: data.rewe_art_no,
      rewe_img_links: data.rewe_img_links,
    });
  }

  async updateIngredient(id: string, data: UpdateIngredientInput): Promise<boolean> {
    // Prepare update data
    const updateData: Partial<Ingredient> = {
      ...(data.name && { name: data.name }),
      ...(data.rewe_art_no !== undefined && { rewe_art_no: data.rewe_art_no }),
      ...(data.rewe_img_links && { rewe_img_links: data.rewe_img_links }),
    };

    // Handle category_id separately
    if (data.category_id) {
      try {
        // Validate category exists
        const category = await this.categoryRepository.findById(data.category_id);
        if (!category) {
          throw new ValidationError('Category not found');
        }
        updateData.category_id = new ObjectId(data.category_id);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError('Invalid category ID');
      }
    }

    return await this.repository.update(id, updateData);
  }

  async deleteIngredient(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }
}
