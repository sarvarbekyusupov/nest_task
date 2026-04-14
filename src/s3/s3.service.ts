import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Config } from "./s3.config";
import { LoggerService } from "../logger/logger.service";
import { FileMetadata } from "./dto/file-metadata.dto";
import { MulterFile } from "./types/multer-file.interface";

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly maxFileSize: number;
  private readonly signedUrlExpiry: number;

  // Allowed file types
  private readonly allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  private readonly allowedVideoTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];
  private readonly allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
  ];

  constructor(
    private readonly logger: LoggerService,
    private readonly s3Config: S3Config,
  ) {
    this.s3Client = s3Config.getClient();
    this.bucketName = s3Config.getBucketName();
    this.maxFileSize = s3Config.getMaxFileSize();
    this.signedUrlExpiry = s3Config.getSignedUrlExpiry();
  }

  async uploadFile(file: MulterFile): Promise<FileMetadata> {
    try {
      const startTime = Date.now();
      this.logger.debug(
        `Uploading file: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        "S3Service",
      );

      // Validate file size
      if (file.size > this.maxFileSize) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
        );
      }

      // Validate file type
      if (!this.isValidFileType(file)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: images (jpg, jpeg, png, gif, webp) and videos (mp4, mov, avi, webm)`,
        );
      }

      // Generate unique key
      const key = this.generateFileKey(file.originalname);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Generate signed URL
      const url = await this.generateSignedUrl(key);

      const metadata: FileMetadata = {
        key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        url,
      };

      const duration = Date.now() - startTime;
      this.logger.logPerformance("File upload", duration, {
        fileName: file.originalname,
        fileSize: file.size,
        key,
      });

      return metadata;
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.warn(
          `File validation failed: ${file.originalname}`,
          "S3Service",
        );
        throw error;
      }

      this.logger.logError(error as Error, "S3Service", {
        operation: "uploadFile",
        fileName: file.originalname,
      });
      throw new BadRequestException(
        `Failed to upload file: ${(error as Error).message}`,
      );
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = this.signedUrlExpiry,
  ): Promise<string> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Generating signed URL for key: ${key}`, "S3Service");

      const url = await this.generateSignedUrl(key, expiresIn);

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Signed URL generation", duration, { key });

      return url;
    } catch (error) {
      this.logger.logError(error as Error, "S3Service", {
        operation: "getSignedUrl",
        key,
      });
      throw new BadRequestException(
        `Failed to generate signed URL: ${(error as Error).message}`,
      );
    }
  }

  async listFiles(
    prefix?: string,
    maxKeys?: number,
    continuationToken?: string,
  ): Promise<{ files: FileMetadata[]; continuationToken?: string }> {
    try {
      const startTime = Date.now();
      this.logger.debug(
        `Listing files: prefix=${prefix}, maxKeys=${maxKeys}`,
        "S3Service",
      );

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix || "",
        MaxKeys: maxKeys || 20,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);

      const files: FileMetadata[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (!object.Key || object.Size === undefined) continue;

          const fileName = object.Key.split("/").pop() || object.Key;
          const url = await this.generateSignedUrl(object.Key);

          files.push({
            key: object.Key,
            fileName,
            fileSize: object.Size,
            mimeType: this.getMimeTypeFromExtension(fileName),
            uploadedAt: object.LastModified || new Date(),
            url,
          });
        }
      }

      const duration = Date.now() - startTime;
      this.logger.logPerformance("File listing", duration, {
        fileCount: files.length,
        prefix,
      });

      return {
        files,
        continuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      this.logger.logError(error as Error, "S3Service", {
        operation: "listFiles",
        prefix,
        maxKeys,
      });
      throw new BadRequestException(
        `Failed to list files: ${(error as Error).message}`,
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file: ${key}`, "S3Service");

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`, "S3Service");
    } catch (error) {
      this.logger.logError(error as Error, "S3Service", {
        operation: "deleteFile",
        key,
      });
      throw new BadRequestException(
        `Failed to delete file: ${(error as Error).message}`,
      );
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Getting file metadata: ${key}`, "S3Service");

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.ContentType || response.ContentLength === undefined) {
        throw new NotFoundException(`File with key ${key} not found`);
      }

      const metadata: FileMetadata = {
        key,
        fileName: key.split("/").pop() || key,
        fileSize: response.ContentLength,
        mimeType: response.ContentType,
        uploadedAt: response.LastModified || new Date(),
        url: await this.generateSignedUrl(key),
      };

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Get file metadata", duration, { key });

      return metadata;
    } catch (error) {
      if ((error as any).name === "NotFound") {
        this.logger.warn(`File not found: ${key}`, "S3Service");
        throw new NotFoundException(`File with key ${key} not found`);
      }

      this.logger.logError(error as Error, "S3Service", {
        operation: "getFileMetadata",
        key,
      });
      throw new BadRequestException(
        `Failed to get file metadata: ${(error as Error).message}`,
      );
    }
  }

  private async generateSignedUrl(
    key: string,
    expiresIn?: number,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.signedUrlExpiry,
    });
  }

  private generateFileKey(originalName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const timestamp = now.getTime();
    const uuid = this.generateUUID();
    const extension = this.getFileExtension(originalName);

    return `uploads/${year}/${month}/${day}/${timestamp}-${uuid}${extension}`;
  }

  private getFileExtension(filename: string): string {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    return this.allowedExtensions.includes(ext) ? ext : ".bin";
  }

  private getMimeTypeFromExtension(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".webm": "video/webm",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  private isValidFileType(file: MulterFile): boolean {
    // Check MIME type
    const isValidMime =
      this.allowedImageTypes.includes(file.mimetype) ||
      this.allowedVideoTypes.includes(file.mimetype);

    if (!isValidMime) {
      return false;
    }

    // Check file extension as additional validation
    const extension = this.getFileExtension(file.originalname);
    return this.allowedExtensions.includes(extension);
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
