import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { logger } from "./logger.ts";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, keyLength: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const params = {
    name: "PBKDF2",
    salt: salt,
    iterations: iterations,
    hash: "SHA-512"
  };

  const derivedBits = await crypto.subtle.deriveBits(
    params,
    passwordKey,
    keyLength * 8
  );

  return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
  try {
    logger.debug('Generating password hash');
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    
    // Generate hash
    const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH);
    
    // Combine salt and hash
    const combined = new Uint8Array(salt.length + hash.length);
    combined.set(salt);
    combined.set(hash, salt.length);
    
    // Convert to base64 for storage
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    
    logger.debug('Password hash generated successfully');
    return `${saltHex}:${hashHex}`;
  } catch (error) {
    logger.error('Error generating password hash', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    logger.debug('Verifying password');
    
    // Split hash into salt and key
    const [saltHex, hashHex] = storedHash.split(':');
    
    // Convert hex strings back to Uint8Arrays
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const storedHashBytes = new Uint8Array(hashHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Generate hash with same salt
    const newHash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH);
    
    // Compare hashes
    if (newHash.length !== storedHashBytes.length) {
      return false;
    }
    
    // Use constant-time comparison
    let result = 0;
    for (let i = 0; i < newHash.length; i++) {
      result |= newHash[i] ^ storedHashBytes[i];
    }
    
    const isValid = result === 0;
    logger.debug('Password verification complete', { isValid });
    return isValid;
  } catch (error) {
    logger.error('Error verifying password', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
