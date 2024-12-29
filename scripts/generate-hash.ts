import { hashPassword, verifyPassword } from '../src/utils/crypto.ts';

async function generateHash() {
  const password = 'jan';
  const hash = await hashPassword(password);
  console.log('Password:', password);
  console.log('Generated hash:', hash);
  
  // Verify the hash works
  const isValid = await verifyPassword(password, hash);
  console.log('Hash verification:', isValid);
}

generateHash();
