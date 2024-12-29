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
  private logLevel: LogLevel;

  private constructor() {
    this.environment = Deno.env.get('ENVIRONMENT') || 'development';
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const configuredLevel = Deno.env.get('LOG_LEVEL')?.toLowerCase();
    switch (configuredLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        // Default to INFO in production, DEBUG in development
        return this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configuredIndex = logLevels.indexOf(this.logLevel);
    const messageIndex = logLevels.indexOf(level);
    return messageIndex >= configuredIndex;
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
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog(LogLevel.WARN, message, context));
    }
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.ERROR)) {
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
