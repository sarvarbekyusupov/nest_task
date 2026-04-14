import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Custom decorator to extract the current authenticated user from the request.
 *
 * Usage example:
 * @Controller('task')
 * export class TaskController {
 *   @Get()
 *   findAll(@CurrentUser() user: any) {
 *     return `Hello ${user.userId}`;
 *   }
 * }
 *
 * The decorator expects the request to have a 'user' property,
 * which would typically be set by an authentication middleware or guard.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // If no data parameter is provided, return the entire user object
    if (!data) {
      return request.user;
    }

    // If a specific property is requested, return just that property
    return request.user?.[data];
  },
);
