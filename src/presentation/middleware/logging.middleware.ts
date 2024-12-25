import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../../utils/logger.ts';
import { AppError } from '../../types/errors.ts';
import { AppMiddleware } from '../../types/middleware.ts';

interface LogContext {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  statusCode?: number;
  errorCode?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Generate a random request ID using crypto.randomUUID
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Middleware to log requests and responses with detailed context
 */
export const loggingMiddleware: AppMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> => {
  const requestId = generateRequestId();
  const startTime = performance.now();
  const method = ctx.request.method;
  const path = ctx.request.url.pathname;
  const ip = ctx.request.ip;
  const userAgent = ctx.request.headers.get('user-agent') ?? 'unknown';

  // Add request ID to response headers
  ctx.response.headers.set('X-Request-ID', requestId);

  // Base log context
  const baseContext: LogContext = {
    requestId,
    method,
    path,
    ip,
    userAgent,
    userId: ctx.state.user?.id,
  };

  try {
    // Log request
    logger.debug('Request received', baseContext);

    // Process request
    await next();

    // Calculate duration
    const duration = performance.now() - startTime;

    // Log successful response with duration
    logger.logRequest(
      requestId,
      method,
      path,
      ctx.response.status,
      duration,
      baseContext,
    );
  } catch (error: unknown) {
    // Calculate duration for error case
    const duration = performance.now() - startTime;

    // Determine status code and error details
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const errorCode = error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR';

    // Create error context
    const errorContext: LogContext = {
      ...baseContext,
      statusCode,
      errorCode,
      duration,
    };

    // Log error with full context
    logger.logError(
      'Request failed',
      error instanceof Error ? error : new Error(String(error)),
      errorContext,
    );

    // Re-throw the error for the error handling middleware
    throw error;
  }
};
