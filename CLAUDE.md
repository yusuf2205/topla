# TOPLA — контекст для Claude Code

Мультивендорный marketplace-платформа для Узбекистана (монорепо: Next.js web,
React Native mobile, NestJS API, PostgreSQL/Prisma). Полное ТЗ — `Toplaa.md`
(и идентичный `Topla.pdf`) в корне репозитория. Архитектура, схема БД, API
контракты и roadmap — в `docs/`.

## Статус

Завершён **ШАГ 1** из `docs/mvp-roadmap.md` (архитектура, структура monorepo,
Prisma-схема, API-контракты, NestJS-скелет с health-check). Следующий —
ШАГ 3 (backend foundation) / ШАГ 4 (Authentication). Работать строго
итеративно по шагам из `docs/mvp-roadmap.md`, не перескакивать, пока
предыдущий шаг не в рабочем состоянии.

## Правило: репозиторий живёт в трёх местах

Каждый push (и вообще все проекты пользователя, не только этот) должен уходить
в три remote — делать это по умолчанию, не дожидаясь напоминания:

- `origin` → `git@github.com:yusuf2205/topla.git` (GitHub, по SSH)
- `nas` → `ssh://git@192.168.1.105:222/joseph/Topla.git` (домашний NAS,
  Gitea, по локальной сети, по SSH)
- `mygithub` → `https://mygithub.uz/joseph/Topla.git` (тот же Gitea на NAS,
  проброшенный наружу через Cloudflare Tunnel — публичный HTTPS с токеном)

Важно: `nas` и `mygithub` — это **один и тот же** физический сервер (Gitea на
Ugreen DXP4800 Plus, IP `192.168.1.105`), просто два разных способа до него
достучаться. Пуш в оба — не лишняя паранойя, а просто соответствие тому, как
пользователь просил, но по факту это две независимые копии (GitHub + NAS), не
три.

Технические детали (порт 222 когда-то был сломан из-за опечатки в
`docker-compose.yaml` на NAS — `222:222` вместо `222:22` — уже исправлено;
Gitea требует токен/SSH-ключ даже для чтения публичных репо из-за
`REQUIRE_SIGNIN_VIEW=true`) — в памяти Claude Code для этого проекта
(`~/.claude/projects/.../memory/reference_nas_gitea_infra.md`) на компьютере,
где это настраивалось. При работе с новой машины эти детали нужно будет
восстановить заново при следующей необходимости чинить NAS/Gitea — сюда
попадает только то, что нужно каждой сессии сразу.

## Технологии

Frontend Web/Admin: Next.js + TypeScript. Mobile: React Native + TypeScript.
Backend: NestJS + TypeScript, Prisma + PostgreSQL, Redis, BullMQ. Монорепо на
pnpm workspaces: `apps/{api,web,admin,mobile}`, `packages/{types,ui,utils,config}`.

Не использовать `any` без необходимости, не хардкодить цены/комиссии/секреты,
все критические расчёты (цена, скидка, остаток, комиссия, сумма заказа) —
только на backend, никогда не доверять данным с frontend.
