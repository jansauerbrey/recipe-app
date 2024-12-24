import { Context } from "oak";
import { validateToken } from "./token.middleware.ts";
import { checkRole } from "./role.middleware.ts";
import { rateLimit } from "./rate-limit.middleware.ts";
import { AuthenticationError } from "../../../types/errors.ts";

// Main authentication middleware that combines token validation and rate limiting
export async function authMiddleware(ctx: Context, next: () => Promise<void>) {
  // Skip auth for OPTIONS requests (CORS preflight)
  if (ctx.request.headers.get("Access-Control-Request-Method")) {
    return await next();
  }

  try {
    // Apply rate limiting first
    await rateLimit(ctx);

    // Validate the token and add user to context
    await validateToken(ctx);

    await next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      ctx.response.status = error.statusCode;
      ctx.response.body = { error: error.message };
      return;
    }
    throw error;
  }
}

// Role-based middleware creators
export const adminOnly = () => checkRole(["admin"]);
export const userOnly = () => checkRole(["user", "admin"]);

// Re-export other middleware for direct use
export { validateToken } from "./token.middleware.ts";
export { checkRole } from "./role.middleware.ts";
export { rateLimit } from "./rate-limit.middleware.ts";
