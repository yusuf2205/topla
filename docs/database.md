# TOPLA — Схема базы данных

Источник истины: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).
Этот документ — навигация по схеме и объяснение решений, которые не очевидны из
самого файла.

ORM: **Prisma** (типобезопасный клиент, декларативные миграции, хорошо ложится
на TypeScript strict mode из ШАГ 37 ТЗ).

## 1. Соглашения

- Первичные ключи — `UUID` (`@default(uuid())`).
- Все таблицы — `snake_case` через `@@map`, поля — `snake_case` через `@map`,
  модели/поля в Prisma-клиенте — `camelCase`.
- `createdAt`/`updatedAt` — на каждой таблице, где есть изменяемое состояние.
- Soft delete (`deletedAt`) — только там, где запись может понадобиться после
  "удаления" для истории заказов/отзывов: `users`, `stores`, `products`.
  Остальные таблицы (логи, транзакции, связи) — real delete или immutable.
- Денежные суммы — `Decimal`, никогда `Float` (исключает ошибки округления).
- Внешние ключи — везде, где есть связь; составные уникальные индексы — там,
  где бизнес-правило требует уникальности пары (например, один отзыв на одну
  покупку: `@@unique([userId, orderItemId])`).

## 2. Карта сущностей ТЗ → модель Prisma

| Сущность из ТЗ (§23)   | Модель Prisma            | Примечание |
|-------------------------|---------------------------|------------|
| users                   | `User`                    | RBAC через `roleId → Role` |
| user_profiles           | `UserProfile`             | 1:1 с User |
| roles                   | `Role`                    | |
| permissions             | `Permission`              | many-to-many через `RolePermission` |
| sellers                 | `Seller`                  | верификация, статус |
| stores                  | `Store`                   | публичная витрина, 1:1 с Seller |
| seller_documents        | `SellerDocument`          | |
| categories              | `Category`                | self-relation, неограниченная вложенность |
| brands                  | `Brand`                   | |
| products                | `Product`                 | |
| product_variants        | `ProductVariant`          | SKU, цена, остаток — на уровне варианта |
| product_images          | `ProductImage`            | флаг `isVideo` покрывает и видео |
| product_attributes      | `ProductAttributeValue`   | EAV поверх `Attribute` + `CategoryAttribute` |
| inventory               | `Inventory`               | 1:1 с вариантом |
| inventory_movements     | `InventoryMovement`       | аудит движений остатка |
| carts                   | `Cart`                    | 1:1 с пользователем |
| cart_items              | `CartItem`                | |
| orders                  | `Order`                   | уровень покупателя |
| order_items             | `OrderItem`               | привязаны к `SellerOrder`, не к `Order` |
| seller_orders           | `SellerOrder`             | разбиение по продавцам, §8 ТЗ |
| payments                | `Payment`                 | 1:1 с `Order` |
| payment_transactions    | `PaymentTransaction`      | idempotency ключ для webhook |
| addresses               | `Address`                 | |
| deliveries              | `Delivery`                | 1:1 с `SellerOrder` |
| couriers                | `Courier`                 | |
| pickup_points           | `PickupPoint`             | |
| favorites               | `Favorite`                | составной PK |
| reviews                 | `Review`                  | привязан к `orderItemId` — доказательство покупки |
| review_images           | `ReviewImage`             | |
| chats                   | `Chat`                    | пара customer↔store уникальна |
| chat_messages           | `ChatMessage`             | |
| notifications           | `Notification`            | |
| promotions              | `Promotion`                | |
| coupons                 | `Coupon` + `CouponUsage`  | |
| advertising_campaigns   | `AdvertisingCampaign` + `AdEvent` | сырые события → агрегаты |
| commissions             | `Commission`              | scope: global/category/seller/product |
| seller_balances         | `SellerBalance`           | проекция над `SellerTransaction` |
| payouts                 | `Payout`                  | |
| returns                 | `Return`                  | |
| return_items            | `ReturnItem`              | |
| complaints              | `Complaint`               | |
| audit_logs              | `AuditLog`                | |

Дополнительно (не в явном списке ТЗ, но требуется функционалом разделов 15–19):
`SellerTransaction` (ledger для баланса), `AdEvent` (сырые ad-события).

## 3. Ключевые решения

### 3.1 Категории и динамические характеристики

`Category` — self-relation (`parentId`) для бесконечной вложенности.
Характеристики не привязаны жёстко к категории кодом — связь настраивается
данными через `CategoryAttribute` (many-to-many `Category ↔ Attribute` с флагами
`isRequired`/`isFilterable`). Значение конкретного товара — `ProductAttributeValue`.
Так один и тот же `Attribute` (например "Материал") можно переиспользовать между
категориями "Одежда" и "Мебель" без дублирования схемы.

### 3.2 Товар и SKU

`Product` — карточка (название, описание, категория, модерация).
`ProductVariant` — фактический SKU: своя цена, `oldPrice`, остаток (`Inventory`
1:1). Товар без вариаций всё равно имеет ровно один `ProductVariant` с
`isDefault: true` — это исключает раздвоение логики "товар с вариантами" /
"товар без вариантов" на уровне API и корзины.

### 3.3 Корзина → заказ → seller orders

`CartItem` ссылается на `variantId`. При оформлении заказа backend группирует
позиции корзины по `Store` каждого варианта и создаёт `Order` +
N `SellerOrder` (по одному на магазин) + `OrderItem` внутри каждого
`SellerOrder`. `OrderItem` хранит снэпшот цены/названия/SKU на момент покупки —
изменение товара продавцом после продажи не искажает историю заказа.

### 3.4 Order state machine

Модель БД не содержит логики переходов — только текущий `status` (`OrderStatus`)
на `Order` и независимо на каждом `SellerOrder` (доставка одного продавца может
отставать от другого). Валидация переходов — в коде
(`modules/orders/order-state-machine.ts`), см. `docs/architecture.md §5.2`.

### 3.5 Финансы продавца

`SellerTransaction` — неизменяемый ledger (append-only). `SellerBalance` —
кэш текущего состояния, пересчитываемый воркером при каждой новой транзакции
(`availableAmount`/`pendingAmount`). Это даёт одновременно быстрый доступ к
балансу и полный audit trail для разбора спорных начислений.

### 3.6 Платежи и идемпотентность webhook

`PaymentTransaction.idempotencyKey` — уникальный индекс. Обработчик webhook
сначала пытается вставить запись с этим ключом; при конфликте уникальности —
событие уже обработано, повторный побочный эффект (двойное зачисление,
двойное уведомление) не происходит.

### 3.7 Отзывы без накрутки

`Review` уникален по паре `(userId, orderItemId)` и обязан ссылаться на
существующий `OrderItem` — оставить отзыв без подтверждённой покупки
технически невозможно на уровне схемы, а не только проверкой в контроллере.

## 4. Поиск (переход на OpenSearch)

MVP использует `products.search_document` (`tsvector`, добавляется миграцией
и GIN-индексом, не управляется напрямую Prisma Client) с триггером
обновления при изменении `name`/`description`/атрибутов. Модуль `search/`
скрывает это за интерфейсом `SearchProvider`, поэтому переход на
OpenSearch/Elasticsearch — это новая реализация интерфейса и job переиндексации,
без изменения контроллеров или DTO.

## 5. Миграции

```bash
pnpm --filter @topla/api prisma:migrate   # создать/применить миграцию в dev
pnpm --filter @topla/api prisma:generate  # сгенерировать Prisma Client
pnpm --filter @topla/api prisma:deploy    # применить миграции в проде (CI/CD)
```
