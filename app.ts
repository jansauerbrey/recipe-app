import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { Status } from "https://deno.land/std@0.208.0/http/http_status.ts";
import { parse } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { swaggerMiddleware } from "./src/presentation/middleware/swagger.middleware.ts";
import { validateRequest, validateResponse } from "./src/presentation/middleware/validation.middleware.ts";

// Import layers
import { UserRepository, RecipeRepository } from "src/data/mod.ts";
import { UserService, RecipeService } from "src/business/mod.ts";
import { initializeRoutes } from "src/presentation/routes/mod.ts";
import { Dependencies } from "src/types/mod.ts";
import { getConfig, AppConfig } from "src/types/env.ts";

async function bootstrap() {
  // Load environment variables
  const env = await load();
  const appConfig: AppConfig = getConfig();

  // Initialize MongoDB connection
  const client = new MongoClient();
  try {
    await client.connect(appConfig.MONGODB_URI);
    console.log("MongoDB connection successful");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    Deno.exit(1);
  }

  // Initialize repositories
  const userRepository = new UserRepository(client);
  const recipeRepository = new RecipeRepository(client);

  // Initialize services
  const userService = new UserService(userRepository);
  const recipeService = new RecipeService(recipeRepository);

  // Create dependencies container
  const dependencies: Dependencies = {
    db: client,
    userService,
    recipeService,
    userRepository,
    recipeRepository,
  };

  // Initialize Oak application
  const app = new Application();

  // Serve API documentation
  app.use(swaggerMiddleware());

  // CORS configuration
  const allowedOrigins = appConfig.ENVIRONMENT === "production"
    ? ["https://www.rezept-planer.de"]
    : ["http://localhost:3000", "http://127.0.0.1:3000", "https://www.rezept-planer.de"];

  app.use(oakCors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    credentials: true,
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "AUTH"],
    exposedHeaders: ["Authorization", "AUTH"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400 // 24 hours
  }));

  // Security headers middleware
  app.use(async (ctx, next) => {
    // Skip security headers for image requests
    if (ctx.request.url.pathname.startsWith("/upload/")) {
      await next();
      return;
    }

    // Only set basic security headers
    ctx.response.headers.set("X-XSS-Protection", "1; mode=block");
    ctx.response.headers.set("X-Content-Type-Options", "nosniff");
    ctx.response.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
    await next();
  });

  // Static file serving
  app.use(async (ctx, next) => {
    try {
      if (ctx.request.url.pathname.startsWith("/upload/")) {
        await ctx.send({
          root: Deno.cwd(),
          path: ctx.request.url.pathname,
        });
      } else {
        await ctx.send({
          root: `${Deno.cwd()}/cordova-app/www`,
          index: "index.html",
        });
      }
    } catch {
      await next();
    }
  });

  // Error handling middleware
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.error(err);
      ctx.response.status = err.status || Status.InternalServerError;
      ctx.response.body = {
        error: {
          message: err.message || "Internal Server Error",
          status: err.status || Status.InternalServerError,
        },
      };
    }
  });

  // Initialize routes
  const router = new Router();
  await initializeRoutes(router, dependencies);

  // Add validation middleware
  app.use(validateRequest());
  app.use(validateResponse());

  // Register router middleware
  app.use(router.routes());
  app.use(router.allowedMethods({
    throw: true,
    notImplemented: () => new Response(null, { status: 200 }),
    methodNotAllowed: () => new Response(null, { status: 200 })
  }));

  // Start server
  console.log(`Server running on port ${appConfig.PORT}`);
  await app.listen({ port: appConfig.PORT });
}

// Bootstrap application
bootstrap().catch(console.error);
