import type { PaginationMeta } from "@topla/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function normalizePagination(page?: number, limit?: number): { page: number; limit: number; skip: number } {
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit ?? DEFAULT_LIMIT)));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
