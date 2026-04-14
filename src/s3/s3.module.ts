import { Module } from "@nestjs/common";
import { S3Service } from "./s3.service";
import { S3Controller } from "./s3.controller";
import { S3Config } from "./s3.config";
import { LoggerModule } from "../logger/logger.module";

@Module({
  imports: [LoggerModule],
  controllers: [S3Controller],
  providers: [S3Service, S3Config],
  exports: [S3Service],
})
export class S3Module {}
