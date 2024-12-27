import { UnitRepository } from '../../data/repositories/unit.repository.ts';
import { Unit, UnitResponse } from '../../types/unit.ts';

export class UnitService {
  constructor(private unitRepository: UnitRepository) {}

  async getAllUnits(): Promise<UnitResponse[]> {
    return await this.unitRepository.findAll();
  }

  async getUnitById(id: string): Promise<UnitResponse | null> {
    return await this.unitRepository.findById(id);
  }

  async createUnit(unit: Omit<Unit, '_id'>): Promise<UnitResponse> {
    return await this.unitRepository.create(unit);
  }

  async updateUnit(id: string, unit: Partial<Omit<Unit, '_id'>>): Promise<boolean> {
    return await this.unitRepository.update(id, unit);
  }

  async deleteUnit(id: string): Promise<boolean> {
    return await this.unitRepository.delete(id);
  }
}
