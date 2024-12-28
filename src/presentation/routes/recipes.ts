import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { RecipeService } from '../../business/services/recipe.service.ts';
import { RecipeController } from '../controllers/recipe.controller.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createRecipesRouter(recipeService: RecipeService): Router<AppState> {
  const router = new Router<AppState>();
  const controller = new RecipeController(recipeService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  router.get(
    '/api/recipes',
    authMiddleware,
    routeHandler((ctx) => controller.listRecipes(ctx))
  );

  router.post(
    '/api/recipes',
    authMiddleware,
    routeHandler((ctx) => controller.create(ctx))
  );

  router.get(
    '/api/other/recipecount',
    authMiddleware,
    routeHandler((ctx) => controller.count(ctx))
  );

  router.get(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.getById(ctx))
  );

  router.put(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.update(ctx))
  );

  router.delete(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.delete(ctx))
  );

  return router;
}
