import {
  Context,
  Middleware,
  Next,
  RouterContext,
  State,
} from 'https://deno.land/x/oak@v12.6.1/mod.ts';

export interface AppState extends State {
  user?: {
    id: string;
    role: string;
  };
}

export type AppContext = Context<AppState>;
export type AppRouterContext = RouterContext<string, Record<string, string>, AppState>;
export type AppMiddleware = Middleware<AppState>;

export interface ErrorResponse {
  error: string;
  status: number;
  message?: string;
}

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown): ErrorResponse {
  if (isAppError(error)) {
    return {
      error: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  return {
    error: 'An unknown error occurred',
    status: 500,
  };
}

export function createMiddleware(
  handler: (ctx: AppRouterContext, next: Next) => Promise<void>,
): AppMiddleware {
  return async (ctx: AppContext, next: Next) => {
    try {
      await handler(ctx as AppRouterContext, next);
    } catch (error) {
      const { status, error: message } = handleError(error);
      ctx.response.status = status;
      ctx.response.body = { error: message, status };
    }
  };
}
