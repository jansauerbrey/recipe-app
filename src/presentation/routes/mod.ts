import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { adminOnly, authMiddleware } from '../middleware/auth.middleware.ts';
import { UserController } from '../controllers/user.controller.ts';
import { RecipeController } from '../controllers/recipe.controller.ts';
import { Dependencies } from '../../types/mod.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

type AppRouter = Router<AppState>;

export async function initializeRoutes(router: AppRouter, dependencies: Dependencies) {
  const { userService, recipeService } = dependencies;

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
    const userRole = ctx.state.user?.role;
    if (userRole !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = { error: 'Forbidden' };
      return;
    }
    ctx.response.body = { message: 'Admin route accessed successfully' };
  });

  router.get('/api/moderator', authMiddleware, (ctx) => {
    const userRole = ctx.state.user?.role;
    if (!userRole || !['admin', 'moderator'].includes(userRole)) {
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
  router.post('/api/users', routeHandler((ctx) => userController.create(ctx)));
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
    routeHandler((ctx) => recipeController.listUserRecipes(ctx)),
  );
  router.post('/api/recipes', authMiddleware, routeHandler((ctx) => recipeController.create(ctx)));
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
