# TOPLA — MVP Roadmap

Порядок разработки согласно ТЗ §36. После каждого шага: проверка компиляции,
TypeScript ошибок, миграций БД, API, авторизации, тестов, интеграции — только
затем переход к следующему шагу.

| # | Шаг | Статус | Содержимое |
|---|-----|--------|------------|
| 1 | Architecture | ✅ Готово | `docs/architecture.md`, структура monorepo, `packages/*`, `apps/*` скелеты |
| 2 | Database schema | ✅ Готово | `apps/api/prisma/schema.prisma`, `docs/database.md` |
| 3 | Backend foundation | 🔜 Далее | NestJS bootstrap, ConfigModule, PrismaModule, глобальные guard/filter/pipe, `GET /health` |
| 4 | Authentication | ⏳ | register/login/refresh/logout, password hashing (argon2/bcrypt), phone verification, OAuth skeleton |
| 5 | Catalog | ⏳ | categories (tree), brands, attributes, category_attributes |
| 6 | Products | ⏳ | products, variants, images, moderation workflow |
| 7 | Search | ⏳ | PostgreSQL FTS provider за интерфейсом `SearchProvider` |
| 8 | Cart | ⏳ | cart/cart_items, пересчёт цены на backend |
| 9 | Orders | ⏳ | checkout → order + seller_orders, order state machine |
| 10 | Payment abstraction | ⏳ | `PaymentProvider` интерфейс, Payme/Click заглушки, webhook idempotency |
| 11 | Seller Dashboard | ⏳ | `apps/admin` `/seller/*`: товары, заказы, баланс |
| 12 | Admin Dashboard | ⏳ | `apps/admin` `/admin/*`: модерация, пользователи, комиссии |
| 13 | Mobile application | ⏳ | `apps/mobile`, экраны из ТЗ §26 |
| 14 | Notifications | ⏳ | Notification Service, провайдеры Push/Email/SMS/Telegram |
| 15 | Testing | ⏳ | unit/integration/e2e/api тесты критических сценариев |
| 16 | Docker | ⏳ | `infrastructure/docker`, dev/staging/prod compose |
| 17 | Deployment | ⏳ | CI/CD pipeline: lint → test → build → security check → deploy |

После MVP (шаги 1–15 покрывают функциональность ТЗ §34, п.1–15):

- Delivery (курьеры, зоны, пункты выдачи, tracking)
- Returns (return request workflow)
- Advertising (кампании, impressions/clicks/CTR)
- Promotions (купоны, flash sales, free delivery)
- Analytics
- AI features (ТЗ §35: модерация, поиск, рекомендации, чат-бот, seller assistant,
  fraud detection, генерация описаний) — архитектура уже допускает подключение
  через отдельные сервисы/очереди без изменения核ных модулей.

## Definition of Done для шага 1 (этот коммит)

- [x] `docs/architecture.md` — модульная архитектура, поток данных, безопасность
- [x] `docs/database.md` — карта сущностей, объяснение решений схемы
- [x] `docs/api.md` — контракт v1, формат ответа/ошибки, ролевой доступ
- [x] `docs/mvp-roadmap.md` — этот файл
- [x] Структура monorepo: `apps/{api,web,admin,mobile}`, `packages/{types,ui,utils,config}`, `infrastructure/{docker,nginx}`
- [x] `apps/api/prisma/schema.prisma` — полная схема БД (41 сущность из ТЗ §23)
- [x] Корневые конфиги: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`
- [x] `apps/api` — минимальный NestJS bootstrap с `GET /health` и единым форматом ошибок
- [x] `infrastructure/docker/docker-compose.yml` — Postgres + Redis для локальной разработки

Следующий шаг (3, backend foundation) начинается с `pnpm install` в корне и
`pnpm --filter @topla/api prisma:migrate` для применения первой миграции.
