# TOPLA — API контракты (v1)

Базовый путь: `/api/v1`. Документация в рантайме: `GET /api/v1/docs` (Swagger UI,
сгенерирован из декораторов NestJS `@nestjs/swagger`).

## 1. Общие правила

- Все тела запросов/ответов — JSON.
- Аутентификация — `Authorization: Bearer <accessToken>` (JWT).
- Пагинация — query-параметры `page` (default 1) и `limit` (default 20, max 100).
- Сортировка — `sortBy` + `sortOrder` (`asc`|`desc`).
- Фильтрация — специфичные для ресурса query-параметры, задокументированные
  в Swagger для каждого endpoint'а.
- Идемпотентные side-effect запросы (платёжные webhook'и) принимают заголовок
  `Idempotency-Key` либо провайдер-специфичный transaction id, который backend
  сохраняет и проверяет перед обработкой (см. `docs/database.md §3.6`).

## 2. Формат успешного ответа

```jsonc
{
  "success": true,
  "data": { /* ресурс или массив */ },
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 } // только для списков
}
```

## 3. Формат ошибки

Единый для всего API (ТЗ §38):

```json
{
  "success": false,
  "error": {
    "code": "ORDER_STATUS_TRANSITION_NOT_ALLOWED",
    "message": "Cannot move order from PACKED to DELIVERED directly",
    "details": { "currentStatus": "PACKED", "requestedStatus": "DELIVERED" }
  }
}
```

`code` — стабильный машиночитаемый идентификатор (`SCREAMING_SNAKE_CASE`),
`message` — человекочитаемое описание (en, для логов/поддержки),
`details` — опциональный контекст для frontend (что именно не так).

HTTP статус коды используются согласно семантике (400/401/403/404/409/422/429/500),
`code` в теле даёт точную причину поверх статуса.

## 4. Модули и основные endpoint'ы (MVP)

### auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/phone/verify/request
POST   /api/v1/auth/phone/verify/confirm
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
GET    /api/v1/auth/oauth/:provider
GET    /api/v1/auth/oauth/:provider/callback
```

### users
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/addresses
POST   /api/v1/users/me/addresses
PATCH  /api/v1/users/me/addresses/:id
DELETE /api/v1/users/me/addresses/:id
```

### catalog
```
GET    /api/v1/categories                 # дерево или плоский список (?flat=true)
GET    /api/v1/categories/:slug
GET    /api/v1/categories/:id/attributes
GET    /api/v1/brands
```

### products
```
GET    /api/v1/products                   # каталог с фильтрами/сортировкой/пагинацией
GET    /api/v1/products/:slug
POST   /api/v1/seller/products            # SELLER
PATCH  /api/v1/seller/products/:id        # SELLER, только свои
POST   /api/v1/seller/products/:id/images # SELLER, presigned upload
POST   /api/v1/seller/products/:id/submit # отправка на модерацию
```

### search
```
GET    /api/v1/search?q=...               # autocomplete + full search
```

### cart
```
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
```

### orders
```
POST   /api/v1/orders                     # checkout: cart → order + N seller_orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
GET    /api/v1/seller/orders              # SELLER, только свои seller_orders
PATCH  /api/v1/seller/orders/:id/status   # SELLER, только разрешённые переходы
```

### payments
```
POST   /api/v1/payments/:orderId/initiate
POST   /api/v1/payments/webhook/payme
POST   /api/v1/payments/webhook/click
```

### reviews
```
POST   /api/v1/products/:id/reviews       # только при наличии подтверждённой покупки
GET    /api/v1/products/:id/reviews
```

### seller (dashboard)
```
POST   /api/v1/sellers/register
GET    /api/v1/sellers/me/store
PATCH  /api/v1/sellers/me/store
GET    /api/v1/sellers/me/balance
GET    /api/v1/sellers/me/transactions
POST   /api/v1/sellers/me/payouts
```

### admin
```
GET    /api/v1/admin/moderation/products
PATCH  /api/v1/admin/moderation/products/:id/approve
PATCH  /api/v1/admin/moderation/products/:id/reject   # requires reason
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/role
GET    /api/v1/admin/commissions
POST   /api/v1/admin/commissions
GET    /api/v1/admin/payouts
PATCH  /api/v1/admin/payouts/:id/status
```

### notifications
```
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
```

### health
```
GET    /health
```

Полный контракт (расширенные модули: delivery, returns, promotions, advertising)
описывается в Swagger по мере реализации соответствующих ШАГ 5–17 (см.
`docs/mvp-roadmap.md`) — здесь фиксируется только MVP-поверхность.

## 5. Авторизация по ролям

Каждый endpoint помечен `@Roles(...)` + защищён `JwtAuthGuard` и `RolesGuard`.
Публичные (без токена): `GET /products`, `GET /categories`, `GET /search`,
`POST /auth/*`, `GET /health`. Все остальные требуют валидный access token;
владение ресурсом (например, "своя" запись `seller_order`) проверяется в
сервисе, а не только на уровне роли.
