import { Context, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";
import { getConfig } from "../../types/env.ts";

interface JWTPayload {
  sub: string; // user id
  role: string;
  exp: number;
}

const JWT_SECRET = getConfig().JWT_SECRET;

export async function authMiddleware(ctx: Context, next: () => Promise<void>) {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (ctx.request.headers.get("Access-Control-Request-Method")) {
    await next();
    return;
  }

  try {
    const token = getAuthToken(ctx);
    if (!token) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: "No authorization token provided" };
      return;
    }

    try {
      const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      if (!payload || !payload.sub) {
        throw new Error("Invalid token payload");
      }

      // Add user info to context state
      ctx.state.user = {
        id: payload.sub,
        role: payload.role as string,
      };

      await next();
    } catch (error) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: "Invalid token" };
    }
  } catch (error) {
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: "Authentication error" };
  }
}

function getAuthToken(ctx: Context): string | null {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");
  if (!token) return null;
  if (type !== "Bearer" && type !== "AUTH") return null;

  return token;
}

// Middleware to check if user has admin role
export async function adminOnly(ctx: Context, next: () => Promise<void>) {
  const user = ctx.state.user;
  if (!user || user.role !== "admin") {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = { error: "Admin access required" };
    return;
  }

  await next();
}

// Helper to generate JWT token (used in auth service)
export async function generateToken(userId: string, role: string): Promise<string> {
  try {
    const payload: JWTPayload = {
      sub: userId,
      role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    };

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET));
    return `AUTH ${token}`;
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to generate authentication token");
  }
}
