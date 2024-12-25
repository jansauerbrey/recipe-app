import { hash, compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}
