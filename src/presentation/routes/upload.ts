import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { RecipeService } from '../../business/services/recipe.service.ts';
import { UploadController } from '../controllers/upload.controller.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { payloadLimitMiddleware } from '../middleware/payload-limit.middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createUploadRouter(recipeService: RecipeService): Router<AppState> {
  const router = new Router<AppState>();
  const controller = new UploadController(recipeService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  // Configure upload route
  router.post(
    '/api/upload/:id',
    authMiddleware,
    payloadLimitMiddleware,
    routeHandler((ctx) => controller.uploadRecipeImage(ctx))
  );

  return router;
}
