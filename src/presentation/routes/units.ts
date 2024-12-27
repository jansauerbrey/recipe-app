import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { UnitService } from '../../business/services/unit.service.ts';
import { UnitController } from '../controllers/unit.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { AppState, createMiddleware } from '../../types/middleware.ts';
import { ControllerContext } from '../controllers/base.controller.ts';

export function createUnitsRouter(unitService: UnitService): Router<AppState> {
  const router = new Router<AppState>();
  const unitController = new UnitController(unitService);

  // Helper function to create route handlers
  const routeHandler = (handler: (ctx: ControllerContext) => Promise<void>) => {
    return createMiddleware(handler);
  };

  router
    .get('/api/units', authMiddleware, routeHandler((ctx) => unitController.listUnits(ctx)))
    .get('/api/units/:id', authMiddleware, routeHandler((ctx) => unitController.getUnitById(ctx)))
    .post('/api/units', authMiddleware, routeHandler((ctx) => unitController.createUnit(ctx)))
    .put('/api/units/:id', authMiddleware, routeHandler((ctx) => unitController.updateUnit(ctx)))
    .delete('/api/units/:id', authMiddleware, routeHandler((ctx) => unitController.deleteUnit(ctx)));

  return router;
}
