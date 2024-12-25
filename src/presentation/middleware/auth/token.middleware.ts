import { Context } from 'oak';
import { create, verify } from 'djwt';
import { getConfig } from '../../../types/env.ts';
import { AuthenticationError, TokenExpiredError, InvalidTokenError } from '../../../types/errors.ts';

interface JWTPayload {
  sub: string; // user id
  role: string;
  exp: number;
}

const JWT_SECRET = new TextEncoder().encode(getConfig().JWT_SECRET);

export async function validateToken(ctx: Context) {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthenticationError('No authorization token provided');
  }

  const [type, token] = authHeader.split(' ');
  if (!token || (type !== 'Bearer' && type !== 'AUTH')) {
    throw new InvalidTokenError();
  }

  try {
    const payload = await verify(token, JWT_SECRET) as JWTPayload;
    
    // Check if token is expired
    if (payload.exp < Date.now() / 1000) {
      throw new TokenExpiredError();
    }

    // Add user info to context state
    ctx.state.user = {
      id: payload.sub,
      role: payload.role,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw error;
    }
    throw new InvalidTokenError();
  }
}

// Helper to generate JWT token
export async function generateToken(userId: string, role: string): Promise<string> {
  const payload: JWTPayload = {
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  try {
    const token = await create(header, payload, JWT_SECRET);
    return `AUTH ${token}`;
  } catch (error) {
    throw new AuthenticationError('Failed to generate token');
  }
}
