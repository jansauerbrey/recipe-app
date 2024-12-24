// Base error class for application errors
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Authentication related errors
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super("Token has expired");
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super("Invalid token");
  }
}

// Authorization related errors
export class AuthorizationError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

// Resource related errors
export class ResourceNotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "RESOURCE_NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

// Database related errors
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, "DATABASE_ERROR", false);
  }
}

// File upload related errors
export class FileUploadError extends AppError {
  constructor(message: string) {
    super(message, 400, "FILE_UPLOAD_ERROR");
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests", 429, "RATE_LIMIT_ERROR");
  }
}

// Helper function to determine if an error is operational
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Helper function to convert unknown errors to AppError
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      500,
      "INTERNAL_SERVER_ERROR",
      false
    );
  }

  return new AppError(
    "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR",
    false
  );
}
