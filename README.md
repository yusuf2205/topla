# TOPLA

Мультивендорный marketplace для рынка Узбекистана. Web + Android/iOS +
Seller Dashboard + Admin Dashboard на едином NestJS/PostgreSQL backend.

## Структура

```
apps/
  api/      NestJS backend (REST API v1)
  web/      Next.js customer web
  admin/    Next.js seller + admin dashboards
  mobile/   React Native приложение
packages/
  types/    Общие enum'ы и контракты
  ui/       Общие UI-компоненты
  utils/    Общие чистые функции
  config/   Общие eslint/tsconfig пресеты
infrastructure/
  docker/   docker-compose и Dockerfile'ы
  nginx/    reverse proxy конфигурация
docs/       Архитектура, схема БД, API-контракты, roadmap
```

## Документация

- [Архитектура](docs/architecture.md)
- [Схема базы данных](docs/database.md)
- [API контракты](docs/api.md)
- [MVP Roadmap](docs/mvp-roadmap.md)

## Быстрый старт (локальная разработка)

```bash
pnpm install

cp .env.example apps/api/.env
# заполните apps/api/.env реальными значениями

docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis

pnpm prisma:migrate
pnpm prisma:generate

pnpm dev:api      # http://localhost:3000/api/v1
pnpm dev:web      # http://localhost:3001
pnpm dev:admin    # http://localhost:3002
```

Требования: Node.js ≥ 20, pnpm ≥ 9, Docker.

## Статус проекта

Сейчас завершён **ШАГ 1** из `docs/mvp-roadmap.md` — архитектура, структура
monorepo, схема базы данных, API-контракты. Дальнейшая реализация ведётся
итеративно по шагам, без пропуска нерабочих промежуточных состояний.
