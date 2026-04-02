import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggingMiddleware } from './logging.middleware';

@Module({
  providers: [LoggerService, AllExceptionsFilter, LoggingMiddleware],
  exports: [LoggerService, AllExceptionsFilter, LoggingMiddleware],
})
export class LoggerModule {}