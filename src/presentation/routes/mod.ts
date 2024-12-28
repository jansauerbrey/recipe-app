import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { adminOnly, authMiddleware } from '../middleware/auth.middleware.ts';
import { UserController } from '../controllers/user.controller.ts';
import { RecipeController } from '../controllers/recipe.controller.ts';
import { Dependencies } from '../../types/mod.ts';
import { createTagsRouter } from './tags.ts';
import { createUnitsRouter } from './units.ts';
import { createDishTypesRouter } from './dishtypes.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

type AppRouter = Router<AppState>;

export async function initializeRoutes(router: AppRouter, dependencies: Dependencies) {
  const { userService, recipeService, tagsService, unitService, dishTypeService } = dependencies;

  // Add tags routes
  const tagsRouter = createTagsRouter(tagsService);
  router.use(tagsRouter.routes());
  router.use(tagsRouter.allowedMethods());

  // Add units routes
  const unitsRouter = createUnitsRouter(unitService);
  router.use(unitsRouter.routes());
  router.use(unitsRouter.allowedMethods());

  // Add dishtype routes
  const dishTypesRouter = createDishTypesRouter(dishTypeService);
  router.use(dishTypesRouter.routes());
  router.use(dishTypesRouter.allowedMethods());

  // Initialize controllers
  const userController = new UserController(userService);
  const recipeController = new RecipeController(recipeService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  // Protected routes
  router.get('/api/protected', authMiddleware, (ctx) => {
    ctx.response.body = { message: 'Protected route accessed successfully' };
  });

  router.get('/api/admin', authMiddleware, (ctx) => {
    if (ctx.state.user?.role !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = { error: 'Forbidden' };
      return;
    }
    ctx.response.body = { message: 'Admin route accessed successfully' };
  });

  // Note: Since we only have is_admin flag, we'll treat admin as moderator
  router.get('/api/moderator', authMiddleware, (ctx) => {
    if (ctx.state.user?.role !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = { error: 'Forbidden' };
      return;
    }
    ctx.response.body = { message: 'Moderator route accessed successfully' };
  });

  // Auth routes
  router.post('/api/user/login', routeHandler((ctx) => userController.validateCredentials(ctx)));
  router.get(
    '/api/user/check',
    authMiddleware,
    routeHandler((ctx) => userController.checkUser(ctx)),
  );

  // User routes
  router.post('/api/user/create', routeHandler((ctx) => userController.create(ctx)));
  router.get('/api/users/:id', authMiddleware, routeHandler((ctx) => userController.getById(ctx)));
  router.put('/api/users/:id', authMiddleware, routeHandler((ctx) => userController.update(ctx)));
  router.delete(
    '/api/users/:id',
    authMiddleware,
    adminOnly,
    routeHandler((ctx) => userController.delete(ctx)),
  );

  // Recipe routes
  router.get(
    '/api/recipes',
    authMiddleware,
    routeHandler((ctx) => recipeController.listRecipes(ctx)),
  );
  router.post('/api/recipes', authMiddleware, routeHandler((ctx) => recipeController.create(ctx)));

  // Count recipes by category
  router.get(
    '/api/other/recipecount',
    authMiddleware,
    routeHandler((ctx) => recipeController.count(ctx)),
  );

  router.get(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => recipeController.getById(ctx)),
  );
  router.put(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => recipeController.update(ctx)),
  );
  router.delete(
    '/api/recipes/:id',
    authMiddleware,
    routeHandler((ctx) => recipeController.delete(ctx)),
  );

  return router;
}
