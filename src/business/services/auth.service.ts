import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const SECRET_KEY = Deno.env.get('JWT_SECRET') || 'your-secret-key';

export async function generateToken(userId: string, role: string = 'user'): Promise<string> {
  const payload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  const secret = new TextEncoder().encode(SECRET_KEY);
  const alg = 'HS256';

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .sign(secret);

  return jwt;
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
