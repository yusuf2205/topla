# TOPLA — Архитектура платформы

## 1. Обзор

TOPLA — мультивендорный marketplace для рынка Узбекистана. Система состоит из пяти
клиентских поверхностей и одного backend API, объединённых в единый monorepo.

| Поверхность       | Технология              | Потребитель          |
|-------------------|--------------------------|----------------------|
| Customer Web      | Next.js + TypeScript     | Покупатели           |
| Mobile (Android/iOS) | React Native + TypeScript | Покупатели         |
| Seller Dashboard  | Next.js + TypeScript     | Продавцы             |
| Admin Dashboard   | Next.js + TypeScript     | Модераторы/админы    |
| API               | NestJS + TypeScript      | Все клиенты (REST v1)|

Все клиенты работают **только** через версионированный REST API (`/api/v1/...`).
Frontend никогда не выполняет бизнес-расчёты (цена, скидка, комиссия, остаток,
сумма заказа) — они всегда пересчитываются backend перед фиксацией любой операции.

## 2. Monorepo

```
topla/
├── apps/
│   ├── api/        # NestJS backend (REST API v1)
│   ├── web/        # Next.js customer web
│   ├── admin/      # Next.js admin + seller dashboard (см. §2.1)
│   └── mobile/     # React Native app
├── packages/
│   ├── types/      # Общие enum'ы и контракты (Role, OrderStatus, ...)
│   ├── ui/         # Общие UI-примитивы для web/admin (React)
│   ├── utils/      # Общие чистые функции (money, pagination, slugify)
│   └── config/     # Общие eslint/tsconfig пресеты
├── infrastructure/
│   ├── docker/     # docker-compose, Dockerfile'ы
│   └── nginx/      # reverse proxy конфигурация
└── docs/
```

Пакетный менеджер — **pnpm** (workspaces), т.к. даёт строгие, дедуплицированные
node_modules и быстрый CI. Каждый `apps/*` и `packages/*` — независимый пакет с
собственным `package.json`, который может импортировать `@topla/types`,
`@topla/utils`, `@topla/ui`, `@topla/config` через workspace-протокол.

### 2.1 Seller Dashboard vs Admin Dashboard

ТЗ перечисляет 5 платформ, включая отдельные Seller Dashboard и Admin Dashboard.
На старте они реализуются как **два независимых Next.js route-scope внутри одного
приложения `apps/admin`** (`/seller/...` и `/admin/...`) с общим билдом, но полностью
разделённым RBAC на backend и разными layout'ами. Это снижает эксплуатационные
расходы на MVP; при росте нагрузки любой из scope можно вынести в отдельный `apps/*`
без изменения backend — контракт API не меняется.

## 3. Backend: модульная структура (NestJS)

```
apps/api/src/
├── main.ts                 # bootstrap, Swagger, global pipes/filters
├── app.module.ts
├── config/                 # env-based конфигурация (ConfigModule)
├── common/                 # общие guard'ы, filter'ы, decorators, DTO-обёртки
├── health/                 # GET /health
└── modules/
    ├── auth/                # регистрация, login, refresh, OAuth, восстановление
    ├── users/                # профиль, адреса
    ├── rbac/                 # roles, permissions
    ├── sellers/               # sellers, stores, seller_documents
    ├── catalog/               # categories, brands, attributes
    ├── products/              # products, variants, images, moderation
    ├── inventory/             # inventory, inventory_movements
    ├── search/                # PG FTS сегодня → OpenSearch завтра
    ├── cart/                  # carts, cart_items
    ├── orders/                # orders, seller_orders, order_items, state machine
    ├── payments/               # payment providers, webhooks, transactions
    ├── delivery/               # couriers, zones, pickup points, tracking
    ├── returns/                 # return requests
    ├── reviews/                 # reviews, review_images
    ├── chat/                    # realtime chat (WebSocket gateway)
    ├── promotions/               # coupons, discounts, flash sales
    ├── advertising/               # ad campaigns, impressions/clicks
    ├── finance/                    # commissions, seller_balances, payouts
    ├── notifications/               # push/email/sms/telegram fan-out
    └── admin/                        # admin-only агрегирующие endpoint'ы
```

Каждый модуль — самостоятельная NestJS-фича (`*.module.ts`, `*.controller.ts`,
`*.service.ts`, `dto/`, `entities|repository`), не знает о внутренностях других
модулей и общается с ними только через публичные сервисы/события (`EventEmitter2`
или очередь BullMQ для асинхронных side-effect'ов — уведомления, пересчёт баланса,
индексация в поиск).

## 4. Данные и инфраструктура

- **PostgreSQL** — основное хранилище (нормализованная схема, см. `docs/database.md`).
- **Redis** — кэш (каталог, сессии rate-limit) + backend для BullMQ.
- **BullMQ** — асинхронные задачи: пересчёт seller balance, отправка уведомлений,
  генерация webhook-обработки, переиндексация товара в поиск, начисление комиссии.
- **S3-compatible storage** — изображения/видео товаров, документы продавцов,
  фото отзывов и возвратов. Backend отдаёт presigned URL, сами файлы не проходят
  через API-сервер.
- **WebSocket (NestJS Gateway)** — чат Customer ↔ Seller и live-статусы заказа.
- **Search** — MVP: PostgreSQL Full Text Search (`tsvector` + GIN индекс на
  `products.search_document`). Архитектурно изолировано за интерфейсом
  `SearchProvider` в модуле `search/`, чтобы заменить реализацию на
  OpenSearch/Elasticsearch без изменений в остальной кодовой базе.

## 5. Ключевые бизнес-процессы

### 5.1 Cart → Order splitting

Корзина покупателя может содержать товары разных продавцов. При оформлении заказа
backend создаёт один `Order` (уровень покупателя) и по одному `SellerOrder` на
каждого продавца, представленного в корзине. Каждый `SellerOrder` имеет собственный
подстатус доставки/обработки, но платёж и общая сумма считаются на уровне `Order`.

```
Order (customer-level)
 ├─ SellerOrder A → OrderItem[] (товары продавца A)
 └─ SellerOrder B → OrderItem[] (товары продавца B)
```

### 5.2 Order state machine

Статусы (`OrderStatus`) и переходы между ними валидируются исключительно на
backend через явную transition-таблицу (`modules/orders/order-state-machine.ts`).
Любой запрос на смену статуса, не входящий в разрешённые переходы для текущей
роли и текущего статуса, отклоняется с `409 CONFLICT`.

```
CREATED → PAYMENT_PENDING → PAID → CONFIRMED → PROCESSING → PACKED
        → READY_FOR_PICKUP → SHIPPED → IN_DELIVERY → DELIVERED → COMPLETED
CREATED|PAYMENT_PENDING|PAID|CONFIRMED → CANCELLED
DELIVERED|COMPLETED → RETURN_REQUESTED → RETURNED → REFUNDED
```

### 5.3 Комиссия и баланс продавца

При переходе `SellerOrder` в статус `COMPLETED` асинхронный worker считает:

```
sale_amount − marketplace_commission − refunds = seller_balance_delta
```

Комиссия разрешается по приоритету: `product override → seller override →
category default → global default` (таблица `commissions`, поле `scope`).
Результат — неизменяемая запись в `seller_transactions`, баланс продавца —
проекция (сумма транзакций), что даёт полный audit trail.

### 5.4 Платежи

`payments/` не хранит card data. Каждый провайдер (Payme, Click, карты) реализует
общий интерфейс `PaymentProvider` (create charge, verify webhook, refund).
Webhook-эндпоинты идемпотентны: каждое входящее уведомление сохраняется в
`payment_transactions` с уникальным `idempotencyKey` до обработки; повторная
доставка того же webhook не создаёт повторного побочного эффекта.

## 6. Безопасность

- JWT access + refresh tokens, ротация refresh при каждом использовании.
- RBAC на уровне guard'ов NestJS (`@Roles()` + `RolesGuard`), проверка permission
  для тонких прав внутри роли.
- Rate limiting (`@nestjs/throttler`) на auth- и webhook-эндпоинтах.
- Валидация и sanitization всех DTO (`class-validator`/`class-transformer`,
  `whitelist: true, forbidNonWhitelisted: true`).
- Secure headers (`helmet`), строгий CORS allowlist, CSRF-защита для
  cookie-based сессий admin/seller dashboard.
- Все секреты — через переменные окружения/secret manager, никогда в git.
- `audit_logs` — запись каждого чувствительного действия (изменение статуса
  заказа, выплата, модерация, изменение роли).

## 7. Масштабирование

- API — stateless, горизонтально масштабируется за Nginx/Load Balancer.
- Тяжёлые операции (пересчёт баланса, отправка уведомлений, индексация) вынесены
  в BullMQ workers — отдельный процесс, масштабируется независимо от API.
- PostgreSQL — read-replica для аналитики/поиска на следующем этапе роста.
- Search — миграция PG FTS → OpenSearch без изменения контракта `SearchProvider`.
- Кэширование каталога и популярных выборок в Redis с TTL и явной инвалидацией
  при изменении товара/остатка.

## 8. Порядок реализации

См. `docs/mvp-roadmap.md` — 17 шагов согласно ТЗ, начиная с архитектуры (этот
документ) и заканчивая деплоем.
