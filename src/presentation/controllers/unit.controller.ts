import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { UnitService } from '../../business/services/unit.service.ts';
import { Unit } from '../../types/unit.ts';
import { BaseController, ControllerContext } from './base.controller.ts';

export class UnitController extends BaseController {
  constructor(private unitService: UnitService) {
    super();
  }

  async listUnits(ctx: ControllerContext) {
    try {
      const units = await this.unitService.getAllUnits();
      ctx.response.body = units;
    } catch (error) {
      await this.internalServerError(ctx, error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  async getUnitById(ctx: ControllerContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Unit ID is required' };
        return;
      }

      const unit = await this.unitService.getUnitById(id);
      if (!unit) {
        ctx.response.status = 404;
        ctx.response.body = { error: 'Unit not found' };
        return;
      }

      ctx.response.body = unit;
    } catch (error) {
      await this.internalServerError(ctx, error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  async createUnit(ctx: ControllerContext) {
    try {
      const body = ctx.request.body();
      if (body.type !== 'json') {
        ctx.response.status = 400;
        ctx.response.body = { error: 'JSON request body is required' };
        return;
      }

      const unitData = await body.value as Omit<Unit, '_id'>;
      if (!unitData.name || !unitData.name.en) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Unit name is required' };
        return;
      }

      const unit = await this.unitService.createUnit(unitData);
      ctx.response.status = 201;
      ctx.response.body = unit;
    } catch (error) {
      await this.internalServerError(ctx, error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  async updateUnit(ctx: ControllerContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Unit ID is required' };
        return;
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        ctx.response.status = 400;
        ctx.response.body = { error: 'JSON request body is required' };
        return;
      }

      const unitData = await body.value as Partial<Omit<Unit, '_id'>>;
      const success = await this.unitService.updateUnit(id, unitData);

      if (!success) {
        ctx.response.status = 404;
        ctx.response.body = { error: 'Unit not found' };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = { message: 'Unit updated successfully' };
    } catch (error) {
      await this.internalServerError(ctx, error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  async deleteUnit(ctx: ControllerContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Unit ID is required' };
        return;
      }

      const success = await this.unitService.deleteUnit(id);
      if (!success) {
        ctx.response.status = 404;
        ctx.response.body = { error: 'Unit not found' };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = { message: 'Unit deleted successfully' };
    } catch (error) {
      await this.internalServerError(ctx, error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
}
