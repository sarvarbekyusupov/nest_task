import { ApiProperty } from "@nestjs/swagger";

export class FileMetadata {
  @ApiProperty({
    description: "The unique key of the file in S3",
    example: "uploads/2024/04/01/1711934400000-abc123-def456.jpg"
  })
  key: string;

  @ApiProperty({
    description: "The original name of the file",
    example: "image.jpg"
  })
  fileName: string;

  @ApiProperty({
    description: "The size of the file in bytes",
    example: 102400
  })
  fileSize: number;

  @ApiProperty({
    description: "The MIME type of the file",
    example: "image/jpeg"
  })
  mimeType: string;

  @ApiProperty({
    description: "The timestamp when the file was uploaded",
    example: "2024-04-01T12:00:00.000Z"
  })
  uploadedAt: Date;

  @ApiProperty({
    description: "The signed URL to access the file",
    example: "https://danads-files.s3.amazonaws.com/uploads/2024/04/01/1711934400000-abc123-def456.jpg?AWSAccessKeyId=..."
  })
  url: string;
}