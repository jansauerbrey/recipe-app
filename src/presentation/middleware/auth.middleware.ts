import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { getConfig } from '../../types/env.ts';
import { AppRouterContext, createMiddleware } from '../../types/middleware.ts';
import { AuthenticationError } from '../../types/errors.ts';

interface JWTPayload extends jose.JWTPayload {
  sub: string; // user id
  role: string;
  exp: number;
}

const JWT_SECRET = getConfig().JWT_SECRET;

export const authMiddleware = createMiddleware(async (ctx: AppRouterContext, next) => {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (ctx.request.headers.get('Access-Control-Request-Method')) {
    await next();
    return;
  }

  const token = getAuthToken(ctx);
  if (!token) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: 'No authorization token provided' };
    ctx.response.headers.set('Connection', 'close');
    return;
  }

  try {
    const verifyResult = await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
    );

    const payload = verifyResult.payload as unknown as JWTPayload;
    if (!payload || !payload.sub) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: 'Invalid token payload' };
      ctx.response.headers.set('Connection', 'close');
      return;
    }

    // Add user info to context state
    ctx.state.user = {
      id: payload.sub,
      role: payload.role,
    };

    await next();
  } catch (error) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: 'Invalid token' };
    ctx.response.headers.set('Connection', 'close');
    return;
  }
});

function getAuthToken(ctx: AppRouterContext): string | null {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');
  if (!token) return null;
  if (type !== 'Bearer' && type !== 'AUTH') return null;

  return token;
}

// Middleware to check if user has admin role
export const adminOnly = createMiddleware(async (ctx: AppRouterContext, next) => {
  const user = ctx.state.user;
  if (!user || user.role !== 'admin') {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = { error: 'Admin access required' };
    ctx.response.headers.set('Connection', 'close');
    return;
  }
  await next();
});

// Helper to generate JWT token (used in auth service)
export async function generateToken(userId: string, role: string): Promise<string> {
  try {
    const payload: JWTPayload = {
      sub: userId,
      role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    };

    const token = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET));
    return `AUTH ${token}`;
  } catch (error) {
    throw new AuthenticationError('Failed to generate authentication token');
  }
}
