import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

/**
 * Example controller demonstrating the @CurrentUser() decorator usage.
 * This shows different ways to use the decorator.
 */
@Controller('example')
export class ExampleController {

  /**
   * Example 1: Get the entire user object
   * Use @CurrentUser() without any parameter to get the full user object
   */
  @Get('user')
  getCurrentUser(@CurrentUser() user: any) {
    return {
      message: 'Current user information',
      user: user,
    };
  }

  /**
   * Example 2: Get specific user property
   * Use @CurrentUser('userId') to get only the userId field
   */
  @Get('user-id')
  getUserId(@CurrentUser('userId') userId: string) {
    return {
      message: 'User ID extracted',
      userId: userId,
    };
  }

  /**
   * Example 3: Get timestamp from user object
   * Extract the timestamp property from the user object
   */
  @Get('user-timestamp')
  getUserTimestamp(@CurrentUser('timestamp') timestamp: string) {
    return {
      message: 'User login timestamp',
      timestamp: timestamp,
    };
  }

  /**
   * Example 4: Use with existing functionality
   * This shows how you might use the decorator in a real scenario
   */
  @Get('tasks')
  getUserTasks(@CurrentUser('userId') userId: string) {
    // In a real application, you would query the database for tasks belonging to this user
    return {
      message: 'Tasks for user',
      userId: userId,
      tasks: [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ],
    };
  }
}
