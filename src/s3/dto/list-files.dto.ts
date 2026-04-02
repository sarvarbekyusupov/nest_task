import { IsOptional, IsInt, Min, Max, IsString } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListFilesDto {
  @ApiPropertyOptional({
    description: "Prefix to filter files by",
    example: "uploads/2024/04"
  })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({
    description: "Maximum number of files to return (default: 20, max: 100)",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: "Continuation token for pagination",
    example: "eyJjb250aW51YXRpb24tdG9rZW4iOiAiZXlKaGJHY2lPaUpTV..."
  })
  @IsOptional()
  @IsString()
  continuationToken?: string;
}