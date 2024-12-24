import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.0/mod.ts";

async function generateHash() {
  const password = "jan";
  const hash = await bcrypt.hash(password);
  console.log("Password:", password);
  console.log("Generated hash:", hash);
  
  // Verify the hash works
  const isValid = await bcrypt.compare(password, hash);
  console.log("Hash verification:", isValid);
}

generateHash();
