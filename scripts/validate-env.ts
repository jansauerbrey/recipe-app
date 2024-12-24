import { getConfig, validateConfig } from "../src/types/env.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

async function validateEnvironment() {
  try {
    // Load environment variables
    await load({ export: true });

    // Get and validate configuration
    const config = getConfig();
    validateConfig(config);

    // Helper to mask credentials in URIs
    const maskURI = (uri: string) => 
      uri.includes("@") ? uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : uri;

    console.log("✅ Environment configuration is valid");
    console.log("\nConfiguration:");
    console.log("-------------");
    console.log(`Environment: ${config.ENVIRONMENT}`);
    console.log(`Port: ${config.PORT}`);
    console.log(`MongoDB URI: ${maskURI(config.MONGODB_URI)}`);
    console.log(`Upload Directory: ${config.UPLOAD_DIR}`);
    console.log(`Max File Size: ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Rate Limit: ${config.RATE_LIMIT_MAX} requests per ${config.RATE_LIMIT_WINDOW / 1000}s`);
    console.log(`Log Level: ${config.LOG_LEVEL}`);
    
    if (config.REDIS_URI) {
      console.log("\nRedis Configuration:");
      console.log(`URI: ${maskURI(config.REDIS_URI)}`);
      console.log(`Database: ${config.REDIS_DB ?? 0}`);
    }

    if (config.SMTP_HOST) {
      console.log("\nEmail Configuration:");
      console.log(`SMTP Host: ${config.SMTP_HOST}`);
      console.log(`SMTP Port: ${config.SMTP_PORT}`);
      console.log(`From Address: ${config.EMAIL_FROM}`);
      console.log("SMTP User: ***");
      console.log("SMTP Password: ***");
    }

    console.log("\nAllowed Origins:");
    config.ALLOWED_ORIGINS.forEach(origin => console.log(`- ${origin}`));

    console.log("\nAllowed File Types:");
    config.ALLOWED_FILE_TYPES.forEach(type => console.log(`- ${type}`));

  } catch (error) {
    console.error("❌ Environment configuration error:");
    console.error(error.message);
    Deno.exit(1);
  }
}

// Run validation if script is executed directly
if (import.meta.main) {
  validateEnvironment();
}
