import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware } from '../../../types/middleware.ts';
import { AuthenticationError } from '../../../types/errors.ts';
import { verifyToken } from './token.middleware.ts';
import { User } from '../../../types/user.ts';

// Middleware to check if user is authenticated
export function isAuthenticated(): AppMiddleware {
  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    // Allow OPTIONS requests to pass through
    if (ctx.request.method === 'OPTIONS') {
      await next();
      return;
    }

    const authHeader = ctx.request.headers.get('Authorization');
    if (!authHeader) {
      throw new AuthenticationError('No authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization format');
    }

    const user = await verifyToken(token);
    ctx.state.user = user;

    await next();
  };
}

// Middleware to check if user has admin role
export function isAdmin(): AppMiddleware {
  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    const user = ctx.state.user as User;
    if (!user || user.role !== 'admin') {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = { error: 'Admin access required' };
      return;
    }
    await next();
  };
}

// Middleware to check if user has moderator role or higher
export function isModerator(): AppMiddleware {
  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    const user = ctx.state.user as User;
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = { error: 'Moderator access required' };
      return;
    }
    await next();
  };
}
