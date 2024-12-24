export interface AppConfig {
  // Server
  PORT: number;
  ENVIRONMENT: "development" | "production";

  // MongoDB
  MONGODB_URI: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRATION: number;

  // Rate Limiting
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW: number;

  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  UPLOAD_DIR: string;

  // CORS
  ALLOWED_ORIGINS: string[];

  // Logging
  LOG_LEVEL: "debug" | "info" | "warn" | "error";

  // Optional Redis Config
  REDIS_URI?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: number;

  // Optional Email Config
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
}

export function getConfig(): AppConfig {
  return {
    // Server
    PORT: parseInt(Deno.env.get("PORT") || "3000"),
    ENVIRONMENT: (Deno.env.get("ENVIRONMENT") || "development") as "development" | "production",

    // MongoDB
    MONGODB_URI: Deno.env.get("MONGODB_URI") || "mongodb://localhost:27017/recipeapp",

    // Authentication
    JWT_SECRET: Deno.env.get("JWT_SECRET") || "change-this-to-a-secure-secret",
    JWT_EXPIRATION: parseInt(Deno.env.get("JWT_EXPIRATION") || "3600"),

    // Rate Limiting
    RATE_LIMIT_MAX: parseInt(Deno.env.get("RATE_LIMIT_MAX") || "100"),
    RATE_LIMIT_WINDOW: parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60000"),

    // File Upload
    MAX_FILE_SIZE: parseInt(Deno.env.get("MAX_FILE_SIZE") || "5242880"),
    ALLOWED_FILE_TYPES: (Deno.env.get("ALLOWED_FILE_TYPES") || "image/jpeg,image/png,image/gif").split(","),
    UPLOAD_DIR: Deno.env.get("UPLOAD_DIR") || "./upload",

    // CORS
    ALLOWED_ORIGINS: (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:3000,http://127.0.0.1:3000").split(","),

    // Logging
    LOG_LEVEL: (Deno.env.get("LOG_LEVEL") || "info") as "debug" | "info" | "warn" | "error",

    // Optional Redis Config
    REDIS_URI: Deno.env.get("REDIS_URI"),
    REDIS_PASSWORD: Deno.env.get("REDIS_PASSWORD"),
    REDIS_DB: Deno.env.get("REDIS_DB") ? parseInt(Deno.env.get("REDIS_DB")!) : undefined,

    // Optional Email Config
    SMTP_HOST: Deno.env.get("SMTP_HOST"),
    SMTP_PORT: Deno.env.get("SMTP_PORT") ? parseInt(Deno.env.get("SMTP_PORT")!) : undefined,
    SMTP_USER: Deno.env.get("SMTP_USER"),
    SMTP_PASS: Deno.env.get("SMTP_PASS"),
    EMAIL_FROM: Deno.env.get("EMAIL_FROM"),
  };
}

// Validate required environment variables
export function validateConfig(config: AppConfig): void {
  const requiredVars = [
    "JWT_SECRET",
    "MONGODB_URI",
  ];

  for (const varName of requiredVars) {
    if (!config[varName as keyof AppConfig]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  // Validate PORT is a valid number
  if (isNaN(config.PORT) || config.PORT <= 0) {
    throw new Error("PORT must be a positive number");
  }

  // Validate JWT_EXPIRATION is a positive number
  if (isNaN(config.JWT_EXPIRATION) || config.JWT_EXPIRATION <= 0) {
    throw new Error("JWT_EXPIRATION must be a positive number");
  }

  // Validate rate limiting settings
  if (isNaN(config.RATE_LIMIT_MAX) || config.RATE_LIMIT_MAX <= 0) {
    throw new Error("RATE_LIMIT_MAX must be a positive number");
  }
  if (isNaN(config.RATE_LIMIT_WINDOW) || config.RATE_LIMIT_WINDOW <= 0) {
    throw new Error("RATE_LIMIT_WINDOW must be a positive number");
  }

  // Validate file upload settings
  if (isNaN(config.MAX_FILE_SIZE) || config.MAX_FILE_SIZE <= 0) {
    throw new Error("MAX_FILE_SIZE must be a positive number");
  }
  if (!config.ALLOWED_FILE_TYPES.length) {
    throw new Error("ALLOWED_FILE_TYPES must not be empty");
  }

  // Validate optional Redis settings if provided
  if (config.REDIS_URI) {
    try {
      new URL(config.REDIS_URI);
    } catch {
      throw new Error("REDIS_URI must be a valid URL");
    }
  }

  // Validate optional SMTP settings if provided
  if (config.SMTP_HOST) {
    if (!config.SMTP_PORT) {
      throw new Error("SMTP_PORT is required when SMTP_HOST is provided");
    }
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error("SMTP_USER and SMTP_PASS are required when SMTP_HOST is provided");
    }
    if (!config.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is required when SMTP_HOST is provided");
    }
  }
}
