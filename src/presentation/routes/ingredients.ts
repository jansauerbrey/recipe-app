import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { IngredientService } from '../../business/services/ingredient.service.ts';
import { IngredientController } from '../controllers/ingredient.controller.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createIngredientsRouter(ingredientService: IngredientService): Router<AppState> {
  const router = new Router<AppState>();
  const controller = new IngredientController(ingredientService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  // All routes require authentication
  router.get(
    '/api/ingredients',
    authMiddleware,
    routeHandler((ctx) => controller.listIngredients(ctx))
  );

  router.get(
    '/api/ingredients/:id',
    authMiddleware,
    routeHandler((ctx) => controller.getIngredientById(ctx))
  );

  router.get(
    '/api/categories/:categoryId/ingredients',
    authMiddleware,
    routeHandler((ctx) => controller.getIngredientsByCategory(ctx))
  );

  router.post(
    '/api/ingredients',
    authMiddleware,
    routeHandler((ctx) => controller.createIngredient(ctx))
  );

  router.put(
    '/api/ingredients/:id',
    authMiddleware,
    routeHandler((ctx) => controller.updateIngredient(ctx))
  );

  router.delete(
    '/api/ingredients/:id',
    authMiddleware,
    routeHandler((ctx) => controller.deleteIngredient(ctx))
  );

  return router;
}
