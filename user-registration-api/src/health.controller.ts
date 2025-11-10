import { Controller, Get } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get("db")
  async db() {
    try {
      // Test basic connectivity
      const startTime = Date.now();
      const result = await this.dataSource.query(
        "SELECT 1 AS ok, NOW() AS current_time"
      );
      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        db: {
          status: "connected",
          responseTime: `${responseTime}ms`,
          currentTime: result?.[0]?.current_time,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      const error = e as Error;
      let errorType = "unknown";
      let userMessage = "Database health check failed";

      if (error.message) {
        const message = error.message.toLowerCase();

        if (message.includes("connect") && message.includes("refused")) {
          errorType = "connection_refused";
          userMessage = "Database server is not accepting connections";
        } else if (message.includes("timeout")) {
          errorType = "timeout";
          userMessage = "Database connection timed out";
        } else if (message.includes("authentication")) {
          errorType = "authentication";
          userMessage = "Database authentication failed";
        } else if (message.includes("does not exist")) {
          errorType = "database_not_found";
          userMessage = "Specified database does not exist";
        } else if (
          message.includes("permission") ||
          message.includes("access")
        ) {
          errorType = "permission_denied";
          userMessage = "Insufficient database permissions";
        } else {
          userMessage = "Database query failed";
        }
      }

      return {
        status: "unhealthy",
        db: {
          status: "disconnected",
          errorType,
          message: userMessage,
        },
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === "development" && {
          debug: error.message,
        }),
      };
    }
  }
}
