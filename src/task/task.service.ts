import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task } from "./entities/task.entity";
import { LoggerService } from "../logger/logger.service";
import { DynamoDBService } from "../dynamodb/dynamodb.service";
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

@Injectable()
export class TaskService {
  private readonly tableName = process.env.DYNAMODB_TASKS_TABLE || "tasks";
  private readonly updatedAtIndexName = "UpdatedAtIndex"; // LSI for updatedAt

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly logger: LoggerService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      const startTime = Date.now();
      const userId = createTaskDto.userId || "anonymous"; // Fallback if no user
      this.logger.debug(`Creating task for user: ${userId}`, "TaskService");

      const newTask: Task = {
        _id: randomUUID(),
        ...createTaskDto,
        userId,
        completed: createTaskDto.completed ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.dynamoDBService.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: newTask,
        }),
      );

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Task creation", duration, {
        taskId: newTask._id,
      });

      return newTask;
    } catch (error) {
      this.logger.logError(error as Error, "TaskService", {
        operation: "create",
        data: createTaskDto,
      });
      throw new BadRequestException("Failed to create task: " + error.message);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    completed?: boolean,
    search?: string,
    userId: string = "anonymous",
    sortBy: "createdAt" | "updatedAt" = "createdAt",
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const startTime = Date.now();
      this.logger.debug(
        `Querying tasks for user: ${userId} sorted by ${sortBy}`,
        "TaskService",
      );

      // Now we use Query instead of Scan because we have a Partition Key (userId)
      // This is MUCH faster and cheaper than Scan.
      const queryParams: any = {
        TableName: this.tableName,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
      };

      // Use LSI if sorting by updatedAt
      if (sortBy === "updatedAt") {
        queryParams.IndexName = this.updatedAtIndexName;
      }

      // Add filters for completed status
      if (completed !== undefined) {
        queryParams.FilterExpression = "#completed = :completed";
        queryParams.ExpressionAttributeNames = { "#completed": "completed" };
        queryParams.ExpressionAttributeValues[":completed"] = completed;
      }

      const result = await this.dynamoDBService.docClient.send(
        new QueryCommand(queryParams),
      );

      let allItems = (result.Items as Task[]) || [];

      // Manual search filter (DynamoDB contains() is only for Scan or FilterExpression)
      if (search) {
        const lowerSearch = search.toLowerCase();
        allItems = allItems.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerSearch) ||
            item.description.toLowerCase().includes(lowerSearch),
        );
      }

      const total = allItems.length;
      const skip = (page - 1) * limit;
      const data = allItems.slice(skip, skip + limit);

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Task findAll", duration, {
        userId,
        sortBy,
        totalResults: total,
      });

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.logError(error as Error, "TaskService", {
        operation: "findAll",
        params: { userId, sortBy },
      });
      throw new BadRequestException(
        "Failed to retrieve tasks: " + error.message,
      );
    }
  }

  async findOne(id: string): Promise<Task> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Searching for task ID: ${id} via Scan`, "TaskService");

      // Without IdIndex, we must Scan the table to find the item by its _id
      const result = await this.dynamoDBService.docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "#id = :id",
          ExpressionAttributeNames: {
            "#id": "_id",
          },
          ExpressionAttributeValues: {
            ":id": id,
          },
        }),
      );

      const task = result.Items?.[0] as Task;
      if (!task) {
        this.logger.warn(`Task not found: ${id}`, "TaskService");
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Task findOne (Scan)", duration, {
        taskId: id,
      });
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error as Error, "TaskService", {
        operation: "findOne",
        taskId: id,
      });
      throw new BadRequestException(
        "Failed to retrieve task: " + error.message,
      );
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      const startTime = Date.now();
      const existingTask = await this.findOne(id);

      const updateExpression: string[] = [];
      const expressionAttributeValues: any = {};
      const expressionAttributeNames: any = {};

      const updates = { ...updateTaskDto, updatedAt: new Date().toISOString() };

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          const attrName = `#${key}`;
          const attrVal = `:${key}`;
          updateExpression.push(`${attrName} = ${attrVal}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrVal] = value;
        }
      });

      const result = await this.dynamoDBService.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            userId: existingTask.userId,
            createdAt: existingTask.createdAt,
          },
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        }),
      );

      const task = result.Attributes as Task;

      const duration = Date.now() - startTime;
      this.logger.logPerformance("Task update", duration, { taskId: id });
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to update task: " + error.message);
    }
  }

  async remove(id: string): Promise<Task> {
    try {
      const task = await this.findOne(id);

      await this.dynamoDBService.docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            userId: task.userId,
            createdAt: task.createdAt,
          },
        }),
      );

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to delete task: " + error.message);
    }
  }
}

