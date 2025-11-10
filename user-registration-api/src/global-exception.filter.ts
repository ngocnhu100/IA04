import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Response } from "express";
import { ValidationError } from "class-validator";
import { QueryFailedError } from "typeorm";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = "Internal server error";
    let message = "An unexpected error occurred. Please try again later.";
    let field = "general";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        if (responseObj.message) {
          message = responseObj.message;
        }
        if (responseObj.error) {
          error = responseObj.error;
        }
        if (responseObj.field) {
          field = responseObj.field;
        }
      }
    } else if (exception instanceof BadRequestException) {
      // Handle validation errors specifically
      status = HttpStatus.BAD_REQUEST;
      error = "Validation failed";

      const exceptionResponse = exception.getResponse() as any;
      if (
        exceptionResponse.message &&
        Array.isArray(exceptionResponse.message)
      ) {
        // Transform validation errors into user-friendly format
        const validationMessages = exceptionResponse.message.map((msg: any) => {
          if (typeof msg === "string") {
            return msg;
          }
          // Handle nested validation errors
          return this.formatValidationError(msg);
        });

        message = validationMessages.join("; ");
      } else if (exceptionResponse.message) {
        message = exceptionResponse.message;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database-specific errors with more detailed messages
      const dbError = exception as any;

      if (dbError.code === "23505" || dbError.code === "ER_DUP_ENTRY") {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        error = "Duplicate entry";
        message =
          "This email address is already registered. Please use a different email or try logging in instead.";
        field = "email";
      } else if (dbError.code === "23503") {
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        error = "Invalid reference";
        message =
          "The requested operation references invalid or non-existent data.";
        field = "general";
      } else if (dbError.code === "23502") {
        // Not null constraint violation
        status = HttpStatus.BAD_REQUEST;
        error = "Missing required data";
        message =
          "Some required information is missing. Please check your input and try again.";
        field = "general";
      } else if (dbError.code === "42703") {
        // Undefined column
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = "Database schema error";
        message =
          "A database configuration issue occurred. Please contact support if this persists.";
      } else if (dbError.code === "42P01") {
        // Undefined table
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = "Database schema error";
        message =
          "A database configuration issue occurred. Please contact support if this persists.";
      } else if (
        dbError.code === "ECONNREFUSED" ||
        dbError.code === "ENOTFOUND"
      ) {
        // Connection refused or host not found
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = "Database connection failed";
        message =
          "Unable to connect to the database. Our team has been notified and is working to resolve this issue.";
      } else if (dbError.code === "ETIMEDOUT" || dbError.code === "TIMEOUT") {
        // Connection timeout
        status = HttpStatus.REQUEST_TIMEOUT;
        error = "Database timeout";
        message =
          "The database operation took too long to complete. Please try again in a few moments.";
      } else if (dbError.code === "08003" || dbError.code === "08006") {
        // Connection does not exist or connection failure
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = "Database unavailable";
        message =
          "The database service is temporarily unavailable. Please try again later.";
      } else if (dbError.code === "53300") {
        // Too many connections
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = "Database overloaded";
        message =
          "The database is experiencing high load. Please try again in a few minutes.";
      } else {
        // Generic database error
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = "Database operation failed";
        message =
          "A database error occurred while processing your request. Please try again later.";
      }
    } else if (exception instanceof Error) {
      // Handle other types of errors with more specific messages
      const errorMessage = exception.message.toLowerCase();

      if (errorMessage.includes("connect ECONNREFUSED")) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = "Connection refused";
        message =
          "Unable to establish a connection. Please check your network and try again.";
      } else if (errorMessage.includes("timeout")) {
        status = HttpStatus.REQUEST_TIMEOUT;
        error = "Request timeout";
        message = "The operation timed out. Please try again.";
      } else if (errorMessage.includes("invalid input syntax")) {
        status = HttpStatus.BAD_REQUEST;
        error = "Invalid input";
        message =
          "The provided data contains invalid characters or format. Please check your input.";
      } else if (errorMessage.includes("permission denied")) {
        status = HttpStatus.FORBIDDEN;
        error = "Permission denied";
        message = "You don't have permission to perform this action.";
      } else if (
        errorMessage.includes("disk full") ||
        errorMessage.includes("no space left")
      ) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = "Storage full";
        message = "The server storage is full. Please contact support.";
      } else {
        // Keep the generic message for unknown errors
      }
    }

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Exception caught by GlobalExceptionFilter:", {
        exception:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        status,
        error,
        message,
      });
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      field,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && {
        debug:
          exception instanceof Error ? exception.message : String(exception),
      }),
    });
  }

  private formatValidationError(error: any): string {
    if (typeof error === "string") {
      return error;
    }

    if (error.constraints) {
      // Get the most appropriate constraint message
      const constraintKeys = Object.keys(error.constraints);
      if (constraintKeys.length > 0) {
        // Prioritize certain constraints for better user experience
        const priorityOrder = [
          "isEmail",
          "isNotEmpty",
          "minLength",
          "maxLength",
          "isString",
        ];
        for (const priority of priorityOrder) {
          if (constraintKeys.includes(priority)) {
            return error.constraints[priority];
          }
        }
        // Fallback to first available constraint
        return error.constraints[constraintKeys[0]];
      }
    }

    if (error.children && error.children.length > 0) {
      // Handle nested validation errors
      return error.children
        .map((child: any) => this.formatValidationError(child))
        .join("; ");
    }

    return "Invalid input provided";
  }
}
