import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { getConfig } from '../../types/env.ts';
import { AppMiddleware, AppRouterContext, createMiddleware } from '../../types/middleware.ts';
import {
  AuthenticationError,
  InvalidTokenError,
  TokenExpiredError,
} from '../../types/errors.ts';

interface JWTPayload extends jose.JWTPayload {
  sub: string; // user id
  role: string;
  exp: number;
}

interface UserState {
  id: string;
  role: string;
}

const JWT_SECRET = getConfig().JWT_SECRET;

/**
 * Extract and validate JWT token from authorization header
 */
function getAuthToken(ctx: AppRouterContext): string {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthenticationError('No authorization token provided');
  }

  const [type, token] = authHeader.split(' ');
  if (!token || (type !== 'Bearer' && type !== 'AUTH')) {
    throw new AuthenticationError('Invalid authorization header format');
  }

  return token;
}

/**
 * Verify JWT token and extract payload
 */
async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const verifyResult = await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
    );

    const payload = verifyResult.payload as unknown as JWTPayload;
    if (!payload?.sub) {
      throw new InvalidTokenError();
    }

    // Check token expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new TokenExpiredError();
    }

    return payload;
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError || error instanceof InvalidTokenError) {
      throw error;
    }
    throw new InvalidTokenError();
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authMiddleware: AppMiddleware = createMiddleware(async (ctx, next) => {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (ctx.request.headers.get('Access-Control-Request-Method')) {
    await next();
    return;
  }

  const token = getAuthToken(ctx);
  const payload = await verifyToken(token);

  // Add user info to context state
  ctx.state.user = {
    id: payload.sub,
    role: payload.role,
  };

  await next();
});

/**
 * Middleware to restrict access to admin users
 */
export const adminOnly: AppMiddleware = createMiddleware(async (ctx, next) => {
  const user = ctx.state.user as UserState | undefined;
  if (!user?.role || user.role !== 'admin') {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = { error: 'Admin access required' };
    ctx.response.headers.set('Connection', 'close');
    return;
  }
  await next();
});

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(userId: string, role: string): Promise<string> {
  try {
    const payload: JWTPayload = {
      sub: userId,
      role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET));

    return `AUTH ${token}`;
  } catch (error: unknown) {
    throw new AuthenticationError(
      `Failed to generate authentication token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
