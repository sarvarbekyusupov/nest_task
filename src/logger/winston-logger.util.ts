import { LoggerService } from './logger.service';

// Custom Winston Logger for NestJS
export class CustomLogger {
  constructor(private readonly logger: LoggerService) {}

  log(message: any, context?: string) {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, context);
  }

  logRequest(method: string, url: string, statusCode: number, responseTime: number) {
    this.logger.logRequest(method, url, statusCode, responseTime);
  }

  logError(error: Error, context?: string, additionalInfo?: any) {
    this.logger.logError(error, context, additionalInfo);
  }

  logAuthAttempt(username: string, success: boolean, ip: string) {
    this.logger.logAuthAttempt(username, success, ip);
  }

  logDatabaseQuery(query: string, time: number) {
    this.logger.logDatabaseQuery(query, time);
  }

  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.logPerformance(operation, duration, metadata);
  }
}