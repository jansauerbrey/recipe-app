import { DishTypeRepository } from '../../data/repositories/dishtype.repository.ts';
import { DishType, DishTypeResponse } from '../../types/dishtype.ts';
import { LocalizedName } from '../../types/recipe.ts';

export class DishTypeService {
  constructor(private repository: DishTypeRepository) {}

  async getAllDishTypes(): Promise<DishTypeResponse[]> {
    return await this.repository.findAll();
  }

  async getDishTypeById(id: string): Promise<DishTypeResponse | null> {
    return await this.repository.findById(id);
  }

  async getDishTypeByIdentifier(identifier: string): Promise<DishTypeResponse | null> {
    return await this.repository.findByIdentifier(identifier);
  }

  async createDishType(userId: string, data: {
    imagePath: string;
    name: LocalizedName;
    identifier: string;
  }): Promise<DishTypeResponse> {
    // Get next order number
    const order = await this.repository.getNextOrder();

    // Create the dishtype
    return await this.repository.create(userId, {
      ...data,
      order,
    });
  }

  async updateDishType(
    id: string,
    data: Partial<{
      order: number;
      imagePath: string;
      name: LocalizedName;
      identifier: string;
    }>
  ): Promise<boolean> {
    return await this.repository.update(id, data);
  }

  async deleteDishType(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }

  async reorderDishTypes(orderedIds: string[]): Promise<boolean> {
    for (const [index, id] of orderedIds.entries()) {
      const success = await this.repository.update(id, { order: index + 1 });
      if (!success) return false;
    }
    return true;
  }
}
