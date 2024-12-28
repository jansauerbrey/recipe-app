import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { DishTypeService } from '../../business/services/dishtype.service.ts';
import { DishTypeController } from '../controllers/dishtype.controller.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createDishTypesRouter(dishTypeService: DishTypeService): Router<AppState> {
  const router = new Router<AppState>();
  const controller = new DishTypeController(dishTypeService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  // All routes require authentication
  router.get(
    '/api/dishtypes',
    authMiddleware,
    routeHandler((ctx) => controller.listDishTypes(ctx))
  );

  router.get(
    '/api/dishtypes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.getDishTypeById(ctx))
  );

  router.get(
    '/api/dishtypes/identifier/:identifier',
    authMiddleware,
    routeHandler((ctx) => controller.getDishTypeByIdentifier(ctx))
  );

  router.post(
    '/api/dishtypes',
    authMiddleware,
    routeHandler((ctx) => controller.createDishType(ctx))
  );

  router.put(
    '/api/dishtypes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.updateDishType(ctx))
  );

  router.delete(
    '/api/dishtypes/:id',
    authMiddleware,
    routeHandler((ctx) => controller.deleteDishType(ctx))
  );

  router.post(
    '/api/dishtypes/reorder',
    authMiddleware,
    routeHandler((ctx) => controller.reorderDishTypes(ctx))
  );

  return router;
}
