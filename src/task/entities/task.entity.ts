import { ApiProperty } from "@nestjs/swagger";

export class Task {
  @ApiProperty({
    description: "Unique task identifier",
    example: "641d1234567890abcdef1234",
  })
  _id: string;

  @ApiProperty({
    description: "Task title",
    example: "Complete project documentation",
    maxLength: 200,
  })
  title: string;

  @ApiProperty({
    description: "Task description",
    example: "Write comprehensive documentation for the new API",
    maxLength: 1000,
  })
  description: string;

  @ApiProperty({
    description: "Task completion status",
    example: false,
    default: false,
  })
  completed: boolean;

  @ApiProperty({
    description: "Task creation date",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "Task last update date",
    example: "2024-01-15T14:20:00.000Z",
  })
  updatedAt: string;

  @ApiProperty({
    description: "Task owner (user ID)",
    example: "641d9876543210fedcba9876",
  })
  userId?: string;
}
