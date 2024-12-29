import { Application, Router } from '@oak/mod.ts';
import { load } from '@std/dotenv/mod.ts';
import { oakCors } from '@cors/mod.ts';
import { MongoClient } from '@mongo/mod.ts';
import { Status } from '@std/http/http_status.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/ensure_dir.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

// Import middleware
import {
  validateRequest,
  validateResponse,
} from './src/presentation/middleware/validation.middleware.ts';
import { rateLimitMiddleware } from './src/presentation/middleware/rate-limit.middleware.ts';
import { payloadLimitMiddleware } from './src/presentation/middleware/payload-limit.middleware.ts';
import { loggingMiddleware } from './src/presentation/middleware/logging.middleware.ts';
import { AppState } from './src/types/middleware.ts';
import { Context, Middleware, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { AppError } from './src/types/errors.ts';

// Import layers
import { RecipeRepository, UserRepository, UnitRepository, DishTypeRepository, CategoryRepository, IngredientRepository } from './src/data/mod.ts';
import { MongoTagsRepository } from './src/data/repositories/tags.repository.ts';
import { MongoDatabase } from './src/data/database.ts';
import { RecipeService, UserService, TagsService, UnitService, DishTypeService, CategoryService, IngredientService } from './src/business/mod.ts';
import { initializeRoutes } from './src/presentation/routes/mod.ts';
import { Dependencies } from './src/types/mod.ts';
import { AppConfig, getConfig } from './src/types/env.ts';

// Define middleware
const securityHeadersMiddleware: Middleware<AppState> = async (ctx: Context, next: Next) => {
  // Skip security headers for image requests
  if (ctx.request.url.pathname.startsWith('/upload/')) {
    await next();
    return;
  }

  // Set basic security headers
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  await next();
};

const errorHandlingMiddleware: Middleware<AppState> = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof AppError) {
      ctx.response.status = err.statusCode;
      ctx.response.body = { error: err.message, code: err.code };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: 'Internal Server Error' };
    }
  }
};

const staticFileMiddleware: Middleware<AppState> = async (ctx: Context, next: Next) => {
  try {
    if (ctx.request.url.pathname.startsWith('/upload/')) {
      // Only serve uploads in local development
      if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
        await ctx.send({
          root: '.',
          path: ctx.request.url.pathname,
        });
      } else {
        ctx.response.status = Status.NotFound;
        return;
      }
    } else if (ctx.request.url.pathname.startsWith('/api/')) {
      await next();
    } else {
      try {
        // Try to serve static files from public directory
        await ctx.send({
          root: './public',
          path: ctx.request.url.pathname,
          index: 'index.html', // Default index file
        });
      } catch {
        // If file not found, serve index.html for client-side routing
        await ctx.send({
          root: './public',
          path: 'index.html',
        });
      }
    }
  } catch {
    await next();
  }
};

export async function createApp(): Promise<Application> {
  // Load environment variables from .env file only in local development
  if (Deno.env.get('CI') !== 'true' && Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
    const envFile = Deno.env.get('ENVIRONMENT') === 'test' ? '.env.test' : '.env';
    await load({
      envPath: envFile,
      export: true,
      allowEmptyValues: true,
    });
  }
  // Environment variables are set:
  // - In GitHub Actions: through ci.yml
  // - In Deno Deploy: through dashboard

  const appConfig: AppConfig = getConfig();
  const logger = console;

  // Initialize MongoDB connection
  const mongoClient = new MongoClient();
  let retries = 3;
  while (retries > 0) {
    try {
      // Log connection details
      logger.info('Connecting to MongoDB...', { 
        environment: Deno.env.get('ENVIRONMENT'),
        isDeployment: !!Deno.env.get('DENO_DEPLOYMENT_ID'),
        isCI: !!Deno.env.get('CI')
      });

      await mongoClient.connect(appConfig.MONGODB_URI);
      logger.info('MongoDB connection successful');
      break;
    } catch (err: unknown) {
      logger.error('MongoDB connection error:', {
        error: err instanceof Error ? {
          name: err.name,
          message: err.message,
          stack: err.stack,
          cause: err.cause
        } : err,
        environment: Deno.env.get('ENVIRONMENT'),
        retriesLeft: retries - 1
      });
      
      if (retries === 1) {
        throw new Error(`Failed to connect to MongoDB: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }
  
  // Create database instance
  const client = new MongoDatabase(mongoClient);

  // Initialize repositories
  const userRepository = new UserRepository(client);
  const recipeRepository = new RecipeRepository(client);
  const tagsRepository = new MongoTagsRepository(client);
  const unitRepository = new UnitRepository(client);
  const dishTypeRepository = new DishTypeRepository(client);
  const categoryRepository = new CategoryRepository(client);
  const ingredientRepository = new IngredientRepository(client);

  // Initialize services
  const userService = new UserService(userRepository);
  const recipeService = new RecipeService(recipeRepository);
  const tagsService = new TagsService(tagsRepository);
  const unitService = new UnitService(unitRepository);
  const dishTypeService = new DishTypeService(dishTypeRepository);
  const categoryService = new CategoryService(categoryRepository);
  const ingredientService = new IngredientService(ingredientRepository, categoryRepository);

  // Create dependencies container
  const dependencies: Dependencies = {
    db: client,
    userService,
    recipeService,
    tagsService,
    unitService,
    userRepository,
    recipeRepository,
    unitRepository,
    dishTypeService,
    dishTypeRepository,
    categoryService,
    categoryRepository,
    ingredientService,
    ingredientRepository,
  };

  // Ensure upload directory exists in local development
  if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
    const uploadDir = join(Deno.cwd(), 'upload');
    await ensureDir(uploadDir);
    console.log('Upload directory ensured:', uploadDir);
  }

  // Initialize Oak application
  const app = new Application();
  app.state = {} as AppState;

  // Add logging middleware first to capture all requests
  app.use(loggingMiddleware);

  // CORS configuration
  const allowedOrigins = appConfig.CORS_ORIGINS;

  app.use(oakCors({
    origin: (origin: string | null | undefined) => {
      if (!origin) return allowedOrigins[0];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'AUTH',
    ],
    exposedHeaders: ['Authorization', 'AUTH'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  }));

  // Rate limiting middleware
  app.use(rateLimitMiddleware);

  // Payload size limiting middleware
  app.use(payloadLimitMiddleware);

  // Security headers middleware
  app.use(securityHeadersMiddleware);

  // Error handling middleware
  app.use(errorHandlingMiddleware);

  // Static file serving middleware (before API routes)
  app.use(staticFileMiddleware);

  // Initialize routes
  const router = new Router();
  await initializeRoutes(router, dependencies);

  // Register router middleware
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Add validation middleware after routes
  app.use(validateRequest);
  app.use(validateResponse);

  return app;
}

// Start server if this is the main module
if (import.meta.main) {
  const app = await createApp();
  const port = Number(Deno.env.get('PORT') || 8000);
  console.info(`Server running on port ${port}`);
  await app.listen({ port });
}
