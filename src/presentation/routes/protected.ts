import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { AppRouterContext } from '../../types/middleware.ts';

const router = new Router();

router.use(authMiddleware);

router.get('/protected', async (ctx: AppRouterContext) => {
  ctx.response.body = { message: 'Protected route accessed successfully' };
});

router.get('/admin', async (ctx: AppRouterContext) => {
  const userRole = ctx.state.user?.role;
  if (userRole !== 'admin') {
    ctx.response.status = 403;
    ctx.response.body = { error: 'Forbidden' };
    return;
  }
  ctx.response.body = { message: 'Admin route accessed successfully' };
});

router.get('/moderator', async (ctx: AppRouterContext) => {
  const userRole = ctx.state.user?.role;
  if (!userRole || !['admin', 'moderator'].includes(userRole)) {
    ctx.response.status = 403;
    ctx.response.body = { error: 'Forbidden' };
    return;
  }
  ctx.response.body = { message: 'Moderator route accessed successfully' };
});

export default router;
