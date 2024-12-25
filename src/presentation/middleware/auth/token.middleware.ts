import { create, verify, Payload } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AuthenticationError, TokenExpiredError } from '../../../types/errors.ts';
import { AppMiddleware } from '../../../types/middleware.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key';
const JWT_ALGORITHM = 'HS256';
const TOKEN_EXPIRY = '24h';

interface TokenPayload extends Payload {
  userId: string;
  role: string;
  exp?: number;
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: string, role: string): Promise<string> {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: 'recipe-app',
  };

  const key = await getKey();
  return await create({ alg: JWT_ALGORITHM, typ: 'JWT' }, payload, key);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<{ userId: string; role: string }> {
  try {
    const key = await getKey();
    const payload = await verify(token, key) as TokenPayload;
    
    if (!payload.userId || !payload.role) {
      throw new AuthenticationError('Invalid token payload');
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      throw new TokenExpiredError();
    }
    throw new AuthenticationError('Invalid token');
  }
}

/**
 * Middleware to validate JWT tokens
 */
export function validateToken(): AppMiddleware {
  return async (ctx: Context, next: () => Promise<unknown>): Promise<void> => {
    const authHeader = ctx.request.headers.get('Authorization');
    if (!authHeader) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: 'No authorization header' };
      return;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: 'Invalid authorization format' };
      return;
    }

    try {
      const payload = await verifyToken(token);
      ctx.state.user = payload;
      await next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        ctx.response.status = Status.Unauthorized;
        ctx.response.body = { error: 'Token expired' };
      } else {
        ctx.response.status = Status.Unauthorized;
        ctx.response.body = { error: 'Invalid token' };
      }
    }
  };
}
