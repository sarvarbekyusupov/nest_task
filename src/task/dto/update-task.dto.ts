import { PartialType } from "@nestjs/mapped-types";
import { IsString, IsBoolean, MaxLength } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Updated task title',
    maxLength: 200
  })
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Updated task description',
    maxLength: 1000
  })
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Task completion status',
    example: true
  })
  @IsBoolean()
  completed?: boolean;
}
