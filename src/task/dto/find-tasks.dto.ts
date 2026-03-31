import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class FindTasksDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by completion status',
    example: false
  })
  @IsOptional()
  completed?: string | boolean;

  @ApiPropertyOptional({
    description: 'Search in title and description',
    example: 'documentation'
  })
  @IsOptional()
  @IsString()
  search?: string;
}