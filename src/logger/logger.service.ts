// Logger service for Winston logging
import { Injectable, Logger as NestLogger } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService extends NestLogger {
  private logger: winston.Logger;

  constructor() {
    super();

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context || 'Application'}] ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for better context handling
  logRequest(method: string, url: string, statusCode: number, responseTime: number) {
    this.logger.info(`${method} ${url} ${statusCode} (${responseTime}ms)`, { context: 'HTTP' });
  }

  logError(error: Error, context?: string, additionalInfo?: any) {
    this.logger.error(error.message, {
      context: context || 'Error',
      stack: error.stack,
      ...additionalInfo,
    });
  }

  logAuthAttempt(username: string, success: boolean, ip: string) {
    if (success) {
      this.logger.info(`User login successful`, { context: 'Auth', username, ip });
    } else {
      this.logger.warn(`Failed login attempt`, { context: 'Auth', username, ip });
    }
  }

  logDatabaseQuery(query: string, time: number) {
    if (time > 1000) {
      this.logger.warn(`Slow database query: ${query} (${time}ms)`, { context: 'Database' });
    } else {
      this.logger.debug(`Database query: ${query} (${time}ms)`, { context: 'Database' });
    }
  }

  logPerformance(operation: string, duration: number, metadata?: any) {
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
    this.logger[level](`${operation} completed (${duration}ms)`, {
      context: 'Performance',
      ...metadata,
    });
  }
}