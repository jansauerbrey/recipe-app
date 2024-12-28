import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { CategoryService } from '../../business/services/category.service.ts';
import { CategoryController } from '../controllers/category.controller.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createCategoriesRouter(categoryService: CategoryService): Router<AppState> {
  const router = new Router<AppState>();
  const controller = new CategoryController(categoryService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  // All routes require authentication
  router.get(
    '/api/categories',
    authMiddleware,
    routeHandler((ctx) => controller.listCategories(ctx))
  );

  router.get(
    '/api/categories/root',
    authMiddleware,
    routeHandler((ctx) => controller.getRootCategories(ctx))
  );

  router.get(
    '/api/categories/:id/subcategories',
    authMiddleware,
    routeHandler((ctx) => controller.getSubcategories(ctx))
  );

  router.get(
    '/api/categories/:id',
    authMiddleware,
    routeHandler((ctx) => controller.getCategoryById(ctx))
  );

  router.post(
    '/api/categories',
    authMiddleware,
    routeHandler((ctx) => controller.createCategory(ctx))
  );

  router.put(
    '/api/categories/:id',
    authMiddleware,
    routeHandler((ctx) => controller.updateCategory(ctx))
  );

  router.delete(
    '/api/categories/:id',
    authMiddleware,
    routeHandler((ctx) => controller.deleteCategory(ctx))
  );

  return router;
}
