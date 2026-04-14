import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TaskService } from './src/task/task.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const taskService = app.get(TaskService);

  console.log('🚀 Starting DynamoDB Integration Test...\n');

  try {
    // 1. Create a task
    console.log('1. Creating a new task...');
    const task = await taskService.create({
      title: 'Test DynamoDB',
      description: 'Testing multiple sort keys',
      userId: 'user_123',
    });
    console.log('✅ Created:', task._id, '\n');

    // 2. Find by ID (using your GSI)
    console.log('2. Finding task by ID...');
    const found = await taskService.findOne(task._id);
    console.log('✅ Found:', found.title, '\n');

    // 3. List tasks for user (Sorted by CreatedAt)
    console.log('3. Listing tasks for user (Sort: CreatedAt)...');
    const listCreated = await taskService.findAll(1, 10, undefined, undefined, 'user_123', 'createdAt');
    console.log(`✅ Found ${listCreated.data.length} tasks sorted by CreatedAt\n`);

    // 4. Update task (Changes updatedAt)
    console.log('4. Updating task to trigger updatedAt change...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a sec
    const updated = await taskService.update(task._id, { completed: true });
    console.log('✅ Updated at:', updated.updatedAt, '\n');

    // 5. List tasks for user (Sorted by UpdatedAt using your GSI)
    console.log('5. Listing tasks for user (Sort: UpdatedAt)...');
    const listUpdated = await taskService.findAll(1, 10, undefined, undefined, 'user_123', 'updatedAt');
    console.log(`✅ Found ${listUpdated.data.length} tasks sorted by UpdatedAt\n`);

    console.log('✨ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

test();
