import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: statusCode >= 200 && statusCode < 300,
        data,
        message: this.getMessage(statusCode),
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private getMessage(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return "Success";
    if (statusCode >= 400 && statusCode < 500) return "Client Error";
    if (statusCode >= 500) return "Server Error";
    return "Unknown";
  }
}
