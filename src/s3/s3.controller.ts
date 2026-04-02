import {
  Controller,
  Post,
  Get,
  Delete,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Query,
  Param,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { S3Service } from "./s3.service";
import { ListFilesDto } from "./dto/list-files.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { FileMetadata } from "./dto/file-metadata.dto";
import { MulterFile } from "./types/multer-file.interface";

@ApiTags("files")
@Controller("s3")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a file to S3" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "File uploaded successfully", type: FileMetadata })
  @ApiResponse({ status: 400, description: "Bad request - validation failed or invalid file type" })
  uploadFile(@UploadedFile() file: MulterFile): Promise<FileMetadata> {
    return this.s3Service.uploadFile(file);
  }

  @Get("list")
  @ApiOperation({ summary: "List files in S3 with optional filtering" })
  @ApiQuery({ name: "prefix", required: false, description: "Prefix to filter files by" })
  @ApiQuery({ name: "limit", required: false, description: "Maximum number of files to return", example: 20 })
  @ApiQuery({ name: "continuationToken", required: false, description: "Continuation token for pagination" })
  @ApiResponse({ status: 200, description: "Files retrieved successfully", type: Object })
  listFiles(@Query() query: ListFilesDto): Promise<{ files: FileMetadata[]; continuationToken?: string }> {
    return this.s3Service.listFiles(query.prefix, query.limit, query.continuationToken);
  }

  @Get("download/:key")
  @ApiOperation({ summary: "Get a signed URL to download a file" })
  @ApiParam({ name: "key", description: "The S3 object key (URL-encoded)", example: "uploads/2024/04/01/1711934400000-abc123-def456.jpg" })
  @ApiQuery({ name: "expiresIn", required: false, description: "URL expiration time in seconds", example: 3600 })
  @ApiResponse({ status: 200, description: "Signed URL generated successfully", type: String })
  @ApiResponse({ status: 404, description: "File not found" })
  async getSignedUrl(
    @Param("key") key: string,
    @Query("expiresIn") expiresIn?: number
  ): Promise<{ url: string }> {
    const url = await this.s3Service.getSignedUrl(decodeURIComponent(key), expiresIn);
    return { url };
  }

  @Delete("delete/:key")
  @ApiOperation({ summary: "Delete a file from S3" })
  @ApiParam({ name: "key", description: "The S3 object key (URL-encoded)", example: "uploads/2024/04/01/1711934400000-abc123-def456.jpg" })
  @ApiResponse({ status: 200, description: "File deleted successfully", type: Object })
  @ApiResponse({ status: 404, description: "File not found" })
  deleteFile(@Param("key") key: string): Promise<{ message: string }> {
    return this.s3Service.deleteFile(decodeURIComponent(key)).then(() => ({
      message: "File deleted successfully",
    }));
  }

  @Get("metadata/:key")
  @ApiOperation({ summary: "Get metadata for a file without downloading it" })
  @ApiParam({ name: "key", description: "The S3 object key (URL-encoded)", example: "uploads/2024/04/01/1711934400000-abc123-def456.jpg" })
  @ApiResponse({ status: 200, description: "File metadata retrieved successfully", type: FileMetadata })
  @ApiResponse({ status: 404, description: "File not found" })
  getFileMetadata(@Param("key") key: string): Promise<FileMetadata> {
    return this.s3Service.getFileMetadata(decodeURIComponent(key));
  }
}