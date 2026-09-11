import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { ApiResponseBuilder } from "../dto/api-response.dto";

/**
 * Единственная точка преобразования любого исключения в формат
 * { success: false, error: { code, message, details } } — docs/api.md §3.
 * Ловит как HttpException (валидация, guard'ы, бизнес-ошибки NestJS), так
 * и непредвиденные ошибки, не раскрывая internals клиенту.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const { code, message, details } = this.normalize(body, exception.message);
      response.status(status).json(ApiResponseBuilder.error(code, message, details));
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponseBuilder.error("INTERNAL_SERVER_ERROR", "Unexpected server error"));
  }

  private normalize(
    body: unknown,
    fallbackMessage: string,
  ): { code: string; message: string; details?: Record<string, unknown> } {
    if (typeof body === "object" && body !== null) {
      const record = body as Record<string, unknown>;
      const message = Array.isArray(record.message) ? record.message.join("; ") : String(record.message ?? fallbackMessage);
      const code = typeof record.code === "string" ? record.code : this.deriveCode(record);
      return { code, message, details: record.details as Record<string, unknown> | undefined };
    }
    return { code: "ERROR", message: fallbackMessage };
  }

  private deriveCode(record: Record<string, unknown>): string {
    const error = typeof record.error === "string" ? record.error : "ERROR";
    return error.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  }
}
