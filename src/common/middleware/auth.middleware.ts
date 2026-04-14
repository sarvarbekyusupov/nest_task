import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

/**
 * Simple authentication middleware that extracts user info from headers
 * and attaches it to the request object.
 *
 * This is a demonstration middleware. In production, you would typically use
 * Passport strategies with JWT validation.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Example: Extract user ID from a custom header or JWT token
    const userId = req.headers["x-user-id"] as string;

    if (userId) {
      // Attach user information to the request
      req["user"] = {
        userId: userId,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`User authenticated: ${userId}`);
    }

    next();
  }
}
