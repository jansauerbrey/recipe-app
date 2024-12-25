import { Context } from 'oak';
import { AuthorizationError } from '../../../types/errors.ts';

export function checkRole(allowedRoles: string[]) {
  return async function(ctx: Context, next: () => Promise<void>) {
    const user = ctx.state.user;
    
    if (!user || !user.role) {
      throw new AuthorizationError('User role not found');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    await next();
  };
}

// Helper function to check if user has specific role
export function hasRole(ctx: Context, role: string): boolean {
  const user = ctx.state.user;
  return user && user.role === role;
}

// Helper function to check if user has any of the specified roles
export function hasAnyRole(ctx: Context, roles: string[]): boolean {
  const user = ctx.state.user;
  return user && roles.includes(user.role);
}

// Helper function to check if user is the owner of a resource
export function isResourceOwner(ctx: Context, resourceUserId: string): boolean {
  const user = ctx.state.user;
  return user && user.id === resourceUserId;
}

// Middleware to check resource ownership
export function checkOwnership(getUserId: (ctx: Context) => string | Promise<string>) {
  return async function(ctx: Context, next: () => Promise<void>) {
    const user = ctx.state.user;
    
    if (!user) {
      throw new AuthorizationError('User not found');
    }

    // Allow admins to bypass ownership check
    if (user.role === 'admin') {
      return await next();
    }

    const resourceUserId = await Promise.resolve(getUserId(ctx));
    
    if (user.id !== resourceUserId) {
      throw new AuthorizationError('You do not have permission to access this resource');
    }

    await next();
  };
}
