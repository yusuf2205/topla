/**
 * Общие enum'ы, используемые всеми клиентами (web/admin/mobile) и backend.
 *
 * Источник истины для значений — apps/api/prisma/schema.prisma.
 * Эти enum'ы обязаны оставаться в синхронизации со схемой БД: любое изменение
 * набора статусов вносится в обоих местах в одном PR.
 */

export enum UserRoleName {
  CUSTOMER = "CUSTOMER",
  SELLER = "SELLER",
  COURIER = "COURIER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum ModerationStatus {
  DRAFT = "DRAFT",
  PENDING_MODERATION = "PENDING_MODERATION",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

export enum OrderStatus {
  CREATED = "CREATED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAID = "PAID",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  PACKED = "PACKED",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  SHIPPED = "SHIPPED",
  IN_DELIVERY = "IN_DELIVERY",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURNED = "RETURNED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
}

export enum PaymentProvider {
  PAYME = "PAYME",
  CLICK = "CLICK",
  CARD = "CARD",
  OTHER = "OTHER",
}

export enum ReturnStatus {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  IN_RETURN = "IN_RETURN",
  RECEIVED = "RECEIVED",
  REFUNDED = "REFUNDED",
}

export enum PayoutStatus {
  REQUESTED = "REQUESTED",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  REJECTED = "REJECTED",
}

export enum DeliveryType {
  SELLER_DELIVERY = "SELLER_DELIVERY",
  MARKETPLACE_DELIVERY = "MARKETPLACE_DELIVERY",
  PICKUP_POINT = "PICKUP_POINT",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETURNED = "RETURNED",
}

export enum NotificationChannel {
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
  TELEGRAM = "TELEGRAM",
}

export enum CommissionScope {
  GLOBAL = "GLOBAL",
  CATEGORY = "CATEGORY",
  SELLER = "SELLER",
  PRODUCT = "PRODUCT",
}

/** Разрешённые переходы order-статусов. Используется и backend (валидация),
 * и frontend (какие кнопки действий показать). Финальная проверка — всегда
 * на backend, это только источник для UI. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PACKED],
  [OrderStatus.PACKED]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED],
  [OrderStatus.SHIPPED]: [OrderStatus.IN_DELIVERY],
  [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED],
  [OrderStatus.COMPLETED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};
