import { CategoryService } from '../../business/services/category.service.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { AppError, AuthenticationError, ValidationError } from '../../types/errors.ts';

export class CategoryController extends BaseController {
  constructor(private categoryService: CategoryService) {
    super();
  }

  async listCategories(ctx: ControllerContext) {
    try {
      const categories = await this.categoryService.getAllCategories();
      await this.ok(ctx, categories);
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
        await this.internalServerError(ctx, 'Failed to list categories');
      }
    }
  }

  async getRootCategories(ctx: ControllerContext) {
    try {
      const categories = await this.categoryService.getRootCategories();
      await this.ok(ctx, categories);
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
        await this.internalServerError(ctx, 'Failed to get root categories');
      }
    }
  }

  async getSubcategories(ctx: ControllerContext) {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Parent category ID is required');
      }

      const categories = await this.categoryService.getSubcategories(id);
      await this.ok(ctx, categories);
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
        await this.internalServerError(ctx, 'Failed to get subcategories');
      }
    }
  }

  async getCategoryById(ctx: ControllerContext) {
    try {
      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Category ID is required');
      }

      const category = await this.categoryService.getCategoryById(id);
      if (!category) {
        await this.notFound(ctx, 'Category not found');
        return;
      }

      await this.ok(ctx, category);
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
        await this.internalServerError(ctx, 'Failed to get category');
      }
    }
  }

  async createCategory(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const categoryData = await body.value;
      const category = await this.categoryService.createCategory(categoryData);
      await this.created(ctx, category);
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
        await this.internalServerError(ctx, 'Failed to create category');
      }
    }
  }

  async updateCategory(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Category ID is required');
      }

      const body = ctx.request.body();
      if (body.type !== 'json') {
        throw new ValidationError('JSON request body is required');
      }

      const categoryData = await body.value;
      const success = await this.categoryService.updateCategory(id, categoryData);
      if (!success) {
        await this.notFound(ctx, 'Category not found');
        return;
      }

      await this.ok(ctx, { message: 'Category updated successfully' });
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
        await this.internalServerError(ctx, 'Failed to update category');
      }
    }
  }

  async deleteCategory(ctx: ControllerContext) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Category ID is required');
      }

      const success = await this.categoryService.deleteCategory(id);
      if (!success) {
        await this.notFound(ctx, 'Category not found');
        return;
      }

      await this.ok(ctx, { message: 'Category deleted successfully' });
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
        await this.internalServerError(ctx, 'Failed to delete category');
      }
    }
  }
}
