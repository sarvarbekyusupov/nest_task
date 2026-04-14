import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { LoggerService } from "./logger.service";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "";
    const startTime = Date.now();

    // Log request
    this.logger.log(`Incoming ${method} ${originalUrl}`, "HTTP");

    // Add custom headers for tracking
    req["requestId"] = this.generateRequestId();
    req["startTime"] = startTime;

    // Listen for response finish to log response time
    res.on("finish", () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Log request/response cycle
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} (${responseTime}ms)`,
        "HTTP",
      );

      // Log slow requests (>1s)
      if (responseTime > 1000) {
        this.logger.warn(
          `Slow request detected: ${originalUrl} (${responseTime}ms)`,
          "Performance",
        );
      }

      // Log 4xx and 5xx errors
      if (statusCode >= 400) {
        if (statusCode >= 500) {
          this.logger.error(
            `${method} ${originalUrl} - ${statusCode}`,
            undefined,
            "HTTP",
          );
        } else {
          this.logger.warn(`${method} ${originalUrl} - ${statusCode}`, "HTTP");
        }
      }
    });

    next();
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
