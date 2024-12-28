import { IngredientService } from '../../business/services/ingredient.service.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { AppError, AuthenticationError, ValidationError } from '../../types/errors.ts';

export class IngredientController extends BaseController {
  constructor(private ingredientService: IngredientService) {
    super();
  }

  async listIngredients(ctx: ControllerContext) {
    try {
      const ingredients = await this.ingredientService.getAllIngredients();
      await this.ok(ctx, ingredients);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to list ingredients');
      }
    }
  }

  async getIngredientById(ctx: ControllerContext) {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Ingredient ID is required');
      }

      const ingredient = await this.ingredientService.getIngredientById(id);
      if (!ingredient) {
        await this.notFound(ctx, 'Ingredient not found');
        return;
      }

      await this.ok(ctx, ingredient);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          case 404:
            await this.notFound(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to get ingredient');
      }
    }
  }

  async getIngredientsByCategory(ctx: ControllerContext) {
    try {
      const { categoryId } = ctx.params;
      if (!categoryId) {
        throw new ValidationError('Category ID is required');
      }

      const ingredients = await this.ingredientService.getIngredientsByCategory(categoryId);
      await this.ok(ctx, ingredients);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to get ingredients by category');
      }
    }
  }

  async createIngredient(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const ingredientData = await body.value;
      const ingredient = await this.ingredientService.createIngredient(userId, ingredientData);
      await this.created(ctx, ingredient);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          case 401:
            await this.unauthorized(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to create ingredient');
      }
    }
  }

  async updateIngredient(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Ingredient ID is required');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const ingredientData = await body.value;
      const success = await this.ingredientService.updateIngredient(id, ingredientData);
      if (!success) {
        await this.notFound(ctx, 'Ingredient not found');
        return;
      }

      await this.ok(ctx, { message: 'Ingredient updated successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          case 401:
            await this.unauthorized(ctx, error.message);
            break;
          case 404:
            await this.notFound(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to update ingredient');
      }
    }
  }

  async deleteIngredient(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Ingredient ID is required');
      }

      const success = await this.ingredientService.deleteIngredient(id);
      if (!success) {
        await this.notFound(ctx, 'Ingredient not found');
        return;
      }

      await this.ok(ctx, { message: 'Ingredient deleted successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            await this.badRequest(ctx, error.message);
            break;
          case 401:
            await this.unauthorized(ctx, error.message);
            break;
          case 404:
            await this.notFound(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to delete ingredient');
      }
    }
  }
}
