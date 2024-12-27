import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { DishTypeService } from '../../business/services/dishtype.service.ts';
import { DishType } from '../../types/dishtype.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import {
  AppError,
  AuthenticationError,
  ValidationError,
} from '../../types/errors.ts';

export class DishTypeController extends BaseController {
  constructor(private dishTypeService: DishTypeService) {
    super();
  }

  async listDishTypes(ctx: ControllerContext) {
    try {
      const dishtypes = await this.dishTypeService.getAllDishTypes();
      await this.ok(ctx, dishtypes);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to list dishtypes');
      }
    }
  }

  async getDishTypeById(ctx: ControllerContext) {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('DishType ID is required');
      }

      const dishtype = await this.dishTypeService.getDishTypeById(id);
      if (!dishtype) {
        await this.notFound(ctx, 'DishType not found');
        return;
      }

      await this.ok(ctx, dishtype);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 404:
            await this.notFound(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to get dishtype');
      }
    }
  }

  async getDishTypeByIdentifier(ctx: ControllerContext) {
    try {
      const { identifier } = ctx.params;
      if (!identifier) {
        throw new ValidationError('DishType identifier is required');
      }

      const dishtype = await this.dishTypeService.getDishTypeByIdentifier(identifier);
      if (!dishtype) {
        await this.notFound(ctx, 'DishType not found');
        return;
      }

      await this.ok(ctx, dishtype);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 404:
            await this.notFound(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to get dishtype');
      }
    }
  }

  async createDishType(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const dishTypeData = await body.value as {
        imagePath: string;
        name: { en: string; de: string; fi: string };
        identifier: string;
      };

      // Validate required fields
      if (!dishTypeData.name?.en || !dishTypeData.name?.de || !dishTypeData.name?.fi) {
        throw new ValidationError('Name translations (en, de, fi) are required');
      }

      if (!dishTypeData.identifier) {
        throw new ValidationError('Identifier is required');
      }

      if (!dishTypeData.imagePath) {
        throw new ValidationError('Image path is required');
      }

      const dishtype = await this.dishTypeService.createDishType(userId, dishTypeData);
      await this.created(ctx, dishtype);
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 401:
            await this.unauthorized(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to create dishtype');
      }
    }
  }

  async updateDishType(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('DishType ID is required');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const dishTypeData = await body.value as Partial<{
        order: number;
        imagePath: string;
        name: { en: string; de: string; fi: string };
        identifier: string;
      }>;

      const success = await this.dishTypeService.updateDishType(id, dishTypeData);
      if (!success) {
        await this.notFound(ctx, 'DishType not found');
        return;
      }

      await this.ok(ctx, { message: 'DishType updated successfully' });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 401:
            await this.unauthorized(ctx, err.message);
            break;
          case 404:
            await this.notFound(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to update dishtype');
      }
    }
  }

  async deleteDishType(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('DishType ID is required');
      }

      const success = await this.dishTypeService.deleteDishType(id);
      if (!success) {
        await this.notFound(ctx, 'DishType not found');
        return;
      }

      await this.ok(ctx, { message: 'DishType deleted successfully' });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 401:
            await this.unauthorized(ctx, err.message);
            break;
          case 404:
            await this.notFound(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to delete dishtype');
      }
    }
  }

  async reorderDishTypes(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const data = await body.value as { orderedIds: string[] };
      if (!Array.isArray(data.orderedIds)) {
        throw new ValidationError('orderedIds array is required');
      }

      const success = await this.dishTypeService.reorderDishTypes(data.orderedIds);
      if (!success) {
        throw new ValidationError('Failed to reorder dishtypes');
      }

      await this.ok(ctx, { message: 'DishTypes reordered successfully' });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err instanceof AppError) {
        switch (err.statusCode) {
          case 400:
            await this.badRequest(ctx, err.message);
            break;
          case 401:
            await this.unauthorized(ctx, err.message);
            break;
          default:
            await this.internalServerError(ctx, err.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to reorder dishtypes');
      }
    }
  }
}
