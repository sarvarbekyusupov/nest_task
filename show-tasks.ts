import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TaskService } from './src/task/task.service';

async function show() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const taskService = app.get(TaskService);

  console.log('📋 Current Items in DynamoDB "tasks" table:\n');

  try {
    const result = await taskService.findAll(1, 100, undefined, undefined, 'user_123');
    console.log(JSON.stringify(result.data, null, 2));
    console.log(`\nTotal tasks for user_123: ${result.total}`);
  } catch (error) {
    console.error('❌ Failed to fetch tasks:', error);
  } finally {
    await app.close();
  }
}

show();
