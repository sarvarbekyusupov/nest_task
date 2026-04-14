import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { AuthMiddleware } from "./middleware/auth.middleware";
import { ExampleController } from "./decorators/example.controller";
import { ResponseInterceptor } from "./interceptors/response.interceptor";

@Module({
  controllers: [ExampleController],
  providers: [ResponseInterceptor],
  exports: [ResponseInterceptor],
})
export class CommonModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply AuthMiddleware to all routes
    consumer.apply(AuthMiddleware).forRoutes("*");
  }
}
