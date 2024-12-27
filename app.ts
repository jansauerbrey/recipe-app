import { Application, Router } from '@oak/mod.ts';
import { load } from '@std/dotenv/mod.ts';
import { oakCors } from '@cors/mod.ts';
import { MongoClient } from '@mongo/mod.ts';
import { Status } from '@std/http/http_status.ts';

// Import middleware
import {
  validateRequest,
  validateResponse,
} from './src/presentation/middleware/validation.middleware.ts';
import { rateLimitMiddleware } from './src/presentation/middleware/rate-limit.middleware.ts';
import { payloadLimitMiddleware } from './src/presentation/middleware/payload-limit.middleware.ts';
import { loggingMiddleware } from './src/presentation/middleware/logging.middleware.ts';
import { AppState, createMiddleware } from './src/types/middleware.ts';
import { AppError } from './src/types/errors.ts';

// Import layers
import { RecipeRepository, UserRepository } from './src/data/mod.ts';
import { MongoTagsRepository } from './src/data/repositories/tags.repository.ts';
import { MongoDatabase } from './src/data/database.ts';
import { RecipeService, UserService, TagsService } from './src/business/mod.ts';
import { initializeRoutes } from './src/presentation/routes/mod.ts';
import { Dependencies } from './src/types/mod.ts';
import { AppConfig, getConfig } from './src/types/env.ts';

export async function createApp(): Promise<Application> {
  // Load environment variables
  await load({
    envPath: '.env',
    export: true,
    allowEmptyValues: true,
  });

  const appConfig: AppConfig = getConfig();
  const logger = console;

  // Initialize MongoDB connection
  const mongoClient = new MongoClient();
  try {
    logger.info('Connecting to MongoDB...', { uri: appConfig.MONGODB_URI });
    await mongoClient.connect(appConfig.MONGODB_URI);
    logger.info('MongoDB connection successful');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    Deno.exit(1);
  }
  
  // Create database instance
  const client = new MongoDatabase(mongoClient);

  // Initialize repositories
  const userRepository = new UserRepository(client);
  const recipeRepository = new RecipeRepository(client);
  const tagsRepository = new MongoTagsRepository(client);

  // Initialize services
  const userService = new UserService(userRepository);
  const recipeService = new RecipeService(recipeRepository);
  const tagsService = new TagsService(tagsRepository);

  // Create dependencies container
  const dependencies: Dependencies = {
    db: client,
    userService,
    recipeService,
    tagsService,
    userRepository,
    recipeRepository,
  };

  // Initialize Oak application
  const app = new Application();
  app.state = {} as AppState;

  // Add logging middleware first to capture all requests
  app.use(loggingMiddleware);

  // CORS configuration
  const allowedOrigins = appConfig.ENVIRONMENT === 'production'
    ? ['https://www.rezept-planer.de']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://www.rezept-planer.de'];

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
  app.use(createMiddleware(async (ctx, next) => {
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
  }));

  // Error handling middleware
  app.use(createMiddleware(async (ctx, next) => {
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
  }));

  // Initialize routes
  const router = new Router();
  await initializeRoutes(router, dependencies);

  // Register router middleware
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Add validation middleware after routes
  app.use(validateRequest);
  app.use(validateResponse);

  // Static file serving middleware
  app.use(createMiddleware(async (ctx, next) => {
    try {
      if (ctx.request.url.pathname.startsWith('/upload/')) {
        await ctx.send({
          root: Deno.cwd(),
          path: ctx.request.url.pathname,
        });
      } else {
        await ctx.send({
          root: `${Deno.cwd()}/public`,
          index: 'index.html',
        });
      }
    } catch {
      await next();
    }
  }));

  return app;
}

// Start server if this is the main module
if (import.meta.main) {
  const app = await createApp();
  const port = Number(Deno.env.get('PORT') || 8000);
  console.info(`Server running on port ${port}`);
  await app.listen({ port });
}
