declare interface AppState {
  user?: {
    id: string;
    role: string;
  };
}

declare interface AppError extends Error {
  status?: number;
}

declare interface EnvConfig {
  PORT: string;
  MONGODB_URI: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  ENVIRONMENT: "development" | "production";
  JWT_SECRET: string;
}

declare interface RequestError extends Error {
  status: number;
  expose: boolean;
}

// Extend Oak's Context state
declare module "oak" {
  interface State extends AppState {}
}
