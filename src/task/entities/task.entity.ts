import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type TaskDocument = Task & Document;

@Schema()
export class Task {
  @ApiProperty({
    description: 'Unique task identifier',
    example: '641d1234567890abcdef1234'
  })
  _id: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Complete project documentation',
    maxLength: 200
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Write comprehensive documentation for the new API',
    maxLength: 1000
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'Task completion status',
    example: false,
    default: false
  })
  @Prop({ default: false })
  completed: boolean;

  @ApiProperty({
    description: 'Task creation date',
    example: '2024-01-15T10:30:00.000Z'
  })
  @Prop({ default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'Task last update date',
    example: '2024-01-15T14:20:00.000Z'
  })
  @Prop({ default: Date.now })
  updatedAt: Date;

  @ApiProperty({
    description: 'Task owner (user ID)',
    example: '641d9876543210fedcba9876'
  })
  @Prop({ required: false })
  userId?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
