import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../../utils/logger.ts';
import { AppError } from '../../types/errors.ts';

// Generate a random request ID
function generateRequestId(): string {
  return crypto.randomUUID();
}

export const loggingMiddleware = async (ctx: Context, next: () => Promise<unknown>) => {
  const requestId = generateRequestId();
  const startTime = performance.now();
  const method = ctx.request.method;
  const path = ctx.request.url.pathname;
  const ip = ctx.request.ip;
  const userAgent = ctx.request.headers.get('user-agent') || 'unknown';

  // Add request ID to response headers
  ctx.response.headers.set('X-Request-ID', requestId);

  try {
    // Log request
    logger.debug('Request received', {
      requestId,
      method,
      path,
      ip,
      userAgent,
    });

    // Process request
    await next();

    // Calculate duration
    const duration = performance.now() - startTime;

    // Log successful response
    logger.logRequest(
      requestId,
      method,
      path,
      ctx.response.status,
      duration,
      {
        ip,
        userAgent,
        userId: ctx.state.user?.id,
      },
    );
  } catch (error) {
    // Calculate duration for error case
    const duration = performance.now() - startTime;

    // Determine status code and error details
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const errorCode = error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR';

    // Log error with full context
    logger.logError(
      'Request failed',
      error,
      {
        requestId,
        method,
        path,
        statusCode,
        errorCode,
        duration,
        ip,
        userAgent,
        userId: ctx.state.user?.id,
      },
    );

    // Re-throw the error for the error handling middleware
    throw error;
  }
};
