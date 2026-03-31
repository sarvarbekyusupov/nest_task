import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task, TaskDocument } from "./entities/task.entity";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private readonly logger: LoggerService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Creating task: ${createTaskDto.title}`, 'TaskService');

      const newTask = new this.taskModel(createTaskDto);
      const result = await newTask.save();

      const duration = Date.now() - startTime;
      this.logger.logPerformance('Task creation', duration, { taskId: result._id });

      return result;
    } catch (error) {
      this.logger.logError(error as Error, 'TaskService', {
        operation: 'create',
        data: createTaskDto,
      });
      throw new BadRequestException("Failed to create task: " + error.message);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    completed?: boolean,
    search?: string
  ): Promise<{ data: Task[]; total: number; page: number; totalPages: number }> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Fetching tasks: page=${page}, limit=${limit}, completed=${completed}, search=${search}`, 'TaskService');

      const skip = (page - 1) * limit;
      const query: any = {};

      // Filter by completion status
      if (completed !== undefined) {
        query.completed = completed;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const [data, total] = await Promise.all([
        this.taskModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.taskModel.countDocuments(query).exec()
      ]);

      const duration = Date.now() - startTime;
      this.logger.logPerformance('Task findAll', duration, {
        page,
        totalResults: total,
        returnedResults: data.length,
      });

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.logError(error as Error, 'TaskService', {
        operation: 'findAll',
        params: { page, limit, completed, search },
      });
      throw new BadRequestException("Failed to retrieve tasks: " + error.message);
    }
  }

  async findOne(id: string): Promise<Task> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Fetching task: ${id}`, 'TaskService');

      const task = await this.taskModel.findById(id).exec();
      if (!task) {
        this.logger.warn(`Task not found: ${id}`, 'TaskService');
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const duration = Date.now() - startTime;
      this.logger.logPerformance('Task findOne', duration, { taskId: id });
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error as Error, 'TaskService', {
        operation: 'findOne',
        taskId: id,
      });
      throw new BadRequestException("Failed to retrieve task: " + error.message);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Updating task: ${id}`, 'TaskService');

      const task = await this.taskModel.findByIdAndUpdate(
        id,
        { ...updateTaskDto, updatedAt: new Date() },
        { new: true },
      ).exec();

      if (!task) {
        this.logger.warn(`Task not found for update: ${id}`, 'TaskService');
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const duration = Date.now() - startTime;
      this.logger.logPerformance('Task update', duration, {
        taskId: id,
        updatedFields: Object.keys(updateTaskDto),
      });
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error as Error, 'TaskService', {
        operation: 'update',
        taskId: id,
        data: updateTaskDto,
      });
      throw new BadRequestException("Failed to update task: " + error.message);
    }
  }

  async remove(id: string): Promise<Task> {
    try {
      this.logger.debug(`Deleting task: ${id}`, 'TaskService');

      const task = await this.taskModel.findByIdAndDelete(id).exec();

      if (!task) {
        this.logger.warn(`Task not found for deletion: ${id}`, 'TaskService');
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      this.logger.log(`Task deleted: ${id}`, 'TaskService');
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error as Error, 'TaskService', {
        operation: 'remove',
        taskId: id,
      });
      throw new BadRequestException("Failed to delete task: " + error.message);
    }
  }
}
