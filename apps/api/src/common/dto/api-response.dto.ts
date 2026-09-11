import type { ApiErrorResponse, ApiSuccessResponse, PaginationMeta } from "@topla/types";

/** Хелперы для сборки унифицированного формата ответа (docs/api.md §2-3). */
export class ApiResponseBuilder {
  static success<T>(data: T, meta?: PaginationMeta): ApiSuccessResponse<T> {
    return { success: true, data, ...(meta ? { meta } : {}) };
  }

  static error(code: string, message: string, details?: Record<string, unknown>): ApiErrorResponse {
    return { success: false, error: { code, message, ...(details ? { details } : {}) } };
  }
}
