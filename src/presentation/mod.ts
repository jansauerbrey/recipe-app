// Export controllers
export * from "./controllers/base.controller.ts";
export * from "./controllers/user.controller.ts";
export * from "./controllers/recipe.controller.ts";

// Export routes
export * from "./routes/mod.ts";

// Export middleware
export * from "./middleware/auth.middleware.ts";

// Export types
export interface RequestUser {
  id: string;
  role: string;
}

// Extend Oak's Context state
declare module "oak" {
  interface State {
    user?: RequestUser;
  }
}
