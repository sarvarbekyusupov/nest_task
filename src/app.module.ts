import { Module, ValidationPipe } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { TaskModule } from "./task/task.module";
import { LoggerModule } from "./logger/logger.module";
import { AllExceptionsFilter } from "./logger/all-exceptions.filter";
import { SentryModule } from "@sentry/nestjs/setup";
import { CommonModule } from "./common/common.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { S3Module } from "./s3/s3.module";

@Module({
  imports: [
    LoggerModule,
    CommonModule,
    SentryModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/danads",
    ),
    TaskModule,
    S3Module,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
