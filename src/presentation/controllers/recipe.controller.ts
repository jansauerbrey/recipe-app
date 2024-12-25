import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { RecipeService } from '../../business/services/recipe.service.ts';
import { AppError } from '../../types/middleware.ts';
import { Recipe, RecipeResponse } from '../../types/mod.ts';

export class RecipeController extends BaseController {
  constructor(private recipeService: RecipeService) {
    super();
  }

  async create(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AppError(Status.Unauthorized, 'User not authenticated');
      }

      const body = ctx.request.body();
      const recipeData = await body.value;

      if (!recipeData.title) {
        throw new AppError(Status.BadRequest, 'Missing required fields');
      }

      const recipe = await this.recipeService.createRecipe({
        ...recipeData,
        userId,
      } as Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>);

      await this.created(ctx, recipe);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.status) {
          case Status.BadRequest:
            await this.badRequest(ctx, error.message);
            break;
          case Status.Unauthorized:
            await this.unauthorized(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to create recipe');
      }
    }
  }

  async getById(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new AppError(Status.BadRequest, 'Recipe ID is required');
      }

      const recipe = await this.recipeService.getRecipeById(id);
      await this.ok(ctx, recipe);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.status) {
          case Status.NotFound:
            await this.notFound(ctx, error.message);
            break;
          case Status.BadRequest:
            await this.badRequest(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to get recipe');
      }
    }
  }

  async listUserRecipes(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AppError(Status.Unauthorized, 'User not authenticated');
      }

      const recipes = await this.recipeService.listUserRecipes(userId);
      await this.ok(ctx, recipes);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.status) {
          case Status.Unauthorized:
            await this.unauthorized(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to list recipes');
      }
    }
  }

  async update(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new AppError(Status.BadRequest, 'Recipe ID is required');
      }

      const body = ctx.request.body();
      const updates = await body.value;

      const recipe = await this.recipeService.updateRecipe(id, updates);
      await this.ok(ctx, recipe);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.status) {
          case Status.NotFound:
            await this.notFound(ctx, error.message);
            break;
          case Status.BadRequest:
            await this.badRequest(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to update recipe');
      }
    }
  }

  async delete(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new AppError(Status.BadRequest, 'Recipe ID is required');
      }

      await this.recipeService.deleteRecipe(id);
      await this.noContent(ctx);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.status) {
          case Status.NotFound:
            await this.notFound(ctx, error.message);
            break;
          case Status.BadRequest:
            await this.badRequest(ctx, error.message);
            break;
          default:
            await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to delete recipe');
      }
    }
  }
}
