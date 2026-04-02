import { Injectable } from "@nestjs/common";
import {
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";

@Injectable()
export class S3Config {
  private s3Client: S3Client;

  constructor() {
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION ,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ,
      },
    };
    this.s3Client = new S3Client(config);
  }

  getClient(): S3Client {
    return this.s3Client;
  }

  getBucketName(): string {
    return process.env.S3_BUCKET_NAME;
  }

  getMaxFileSize(): number {
    return parseInt(process.env.AWS_S3_MAX_FILE_SIZE ); 
  }

  getSignedUrlExpiry(): number {
    return parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY ); 
  }
}