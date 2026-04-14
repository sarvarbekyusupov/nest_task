# Custom Authentication Decorator

## @CurrentUser() Decorator

A custom decorator to extract authenticated user information from the request object.

### Usage

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller('task')
export class TaskController {

  // Get entire user object
  @Get()
  findAll(@CurrentUser() user: any) {
    console.log(user); // { userId: '123', timestamp: '2026-03-31...' }
    return `Hello user ${user.userId}`;
  }

  // Get specific property
  @Get('my-tasks')
  getMyTasks(@CurrentUser('userId') userId: string) {
    // Use userId to fetch user-specific data
    return this.taskService.findByUserId(userId);
  }
}
```

### Middleware

The decorator works with the `AuthMiddleware` that extracts user information from HTTP headers:

```typescript
// Example request headers
x-user-id: 12345
```

### Features

- ✅ Extracts user object from request
- ✅ Supports extracting specific properties
- ✅ Type-safe when using TypeScript interfaces
- ✅ Works with any authentication strategy

### File Structure

```
src/common/
├── decorators/
│   ├── current-user.decorator.ts    # Main decorator
│   └── example.controller.ts        # Usage examples
├── middleware/
│   └── auth.middleware.ts           # Authentication middleware
├── common.module.ts                 # Module configuration
└── README.md                        # This file
```

### Testing

Test the decorator using the example endpoints:

```bash
# Get current user info
curl -H "x-user-id: test-user-123" http://localhost:3000/example/user

# Get user ID only
curl -H "x-user-id: test-user-123" http://localhost:3000/example/user-id

# Get user timestamp
curl -H "x-user-id: test-user-123" http://localhost:3000/example/user-timestamp

# Get user tasks
curl -H "x-user-id: test-user-123" http://localhost:3000/example/tasks
```

### Integration with Real Authentication

In production, replace the simple header-based middleware with proper JWT authentication using Passport strategies:

```typescript
// Use Passport JWT strategy
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('task')
@UseGuards(JwtAuthGuard)
export class TaskController {
  @Get()
  findAll(@CurrentUser() user: any) {
    // user will contain decoded JWT payload
  }
}
```
