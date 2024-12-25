export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  error?: unknown;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

export class Logger {
  private static instance: Logger;
  private environment: string;

  private constructor() {
    this.environment = Deno.env.get('ENVIRONMENT') || 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        environment: this.environment,
        ...context,
      },
    };
  }

  private output(entry: LogEntry): void {
    // In production, we might want to send logs to a logging service
    // For now, we'll just write to stdout/stderr
    const output = JSON.stringify(entry);

    if (entry.level === LogLevel.ERROR) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.environment === 'development') {
      this.output(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context: LogContext = {}): void {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, context: LogContext = {}): void {
    if (context.error instanceof Error) {
      context = {
        ...context,
        errorName: context.error.name,
        errorMessage: context.error.message,
        errorStack: context.error.stack,
      };
    }
    this.output(this.formatLog(LogLevel.ERROR, message, context));
  }

  // Helper method for HTTP request logging
  logRequest(
    requestId: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context: LogContext = {},
  ): void {
    this.info(`HTTP ${method} ${path}`, {
      requestId,
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  // Helper method for error logging
  logError(
    message: string,
    error: unknown,
    context: LogContext = {},
  ): void {
    this.error(message, {
      ...context,
      error,
    });
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();
