import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLogger } from './winston-logger.util';
import { LoggerService } from './logger.service';
import * as Sentry from "@sentry/node";

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const customLogger = new CustomLogger(new LoggerService());

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Log the HTTP exception
      customLogger.logError(exception as Error, 'HttpException', {
        statusCode: status,
        path: request.url,
        method: request.method,
        requestId: request['requestId'],
      });

      // Send to Sentry
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setContext('http', {
          url: request.url,
          method: request.method,
          statusCode: status,
          requestId: request['requestId'],
        });
        Sentry.captureException(exception);
      });

      // Send error response
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message,
        error: exception.message,
        requestId: request['requestId'],
      });

      return;
    }

    // Handle all other exceptions
    const status =
      exception instanceof Error && (exception as any).code === 'ENOENT'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the exception
    customLogger.logError(exception as Error, 'UnhandledException', {
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId: request['requestId'],
      stack: (exception as Error).stack,
    });

    // Send to Sentry
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setContext('http', {
        url: request.url,
        method: request.method,
        statusCode: status,
        requestId: request['requestId'],
      });
      Sentry.captureException(exception);
    });

    // Send error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
      error: exception instanceof Error ? exception.message : 'Unknown error',
      requestId: request['requestId'],
      stack: process.env.NODE_ENV === 'development' && exception instanceof Error ? exception.stack : undefined,
    });
  }
}