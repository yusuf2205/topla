# Multi-stage build для apps/web (Next.js customer web).
#   docker build -f infrastructure/docker/web.Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/web ./apps/web
RUN pnpm --filter @topla/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next ./apps/web/.next
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json
WORKDIR /repo/apps/web
EXPOSE 3001
CMD ["pnpm", "start"]
