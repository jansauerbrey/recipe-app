import winston from 'winston';
import expressWinston from 'express-winston';
import { v4 as uuidv4 } from 'uuid';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.metadata(),
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'recipe-app' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

// Request logging middleware
export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  requestWhitelist: ['headers', 'query', 'body'],
  responseWhitelist: ['body'],
  dynamicMeta: (req) => {
    const meta = {
      requestId: req.headers['x-request-id'] || uuidv4(),
    };
    if (req.user) {
      meta.userId = req.user.id;
    }
    return meta;
  },
});

// Error logging middleware
export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{err.message}}',
  expressFormat: true,
  colorize: false,
  requestWhitelist: ['headers', 'query', 'body'],
  responseWhitelist: ['body'],
  dynamicMeta: (req, _res, err) => {
    const meta = {
      requestId: req.headers['x-request-id'] || uuidv4(),
      stackTrace: err.stack,
    };
    if (req.user) {
      meta.userId = req.user.id;
    }
    return meta;
  },
});

export default {
  logger,
  requestLogger,
  errorLogger,
};
