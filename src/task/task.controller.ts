import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { FindTasksDto } from "./dto/find-tasks.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";

@ApiTags("tasks")
@Controller("task")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  @ApiResponse({
    status: 201,
    description: "Task created successfully",
    type: Object,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all tasks with pagination and filtering" })
  @ApiResponse({
    status: 200,
    description: "Tasks retrieved successfully",
    type: Object,
  })
  findAll(@Query() query: FindTasksDto) {
    return this.taskService.findAll(
      query.page,
      query.limit,
      query.completed,
      query.search,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific task by ID" })
  @ApiParam({
    name: "id",
    description: "Task ID",
    example: "641d1234567890abcdef1234",
  })
  @ApiResponse({ status: 200, description: "Task found", type: Object })
  @ApiResponse({ status: 404, description: "Task not found" })
  findOne(@Param("id") id: string) {
    return this.taskService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a task" })
  @ApiParam({
    name: "id",
    description: "Task ID",
    example: "641d1234567890abcdef1234",
  })
  @ApiResponse({
    status: 200,
    description: "Task updated successfully",
    type: Object,
  })
  @ApiResponse({ status: 404, description: "Task not found" })
  update(@Param("id") id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a task" })
  @ApiParam({
    name: "id",
    description: "Task ID",
    example: "641d1234567890abcdef1234",
  })
  @ApiResponse({
    status: 200,
    description: "Task deleted successfully",
    type: Object,
  })
  @ApiResponse({ status: 404, description: "Task not found" })
  remove(@Param("id") id: string) {
    return this.taskService.remove(id);
  }
}
