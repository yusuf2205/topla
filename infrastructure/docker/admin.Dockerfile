# Multi-stage build для apps/admin (Seller + Admin dashboards).
#   docker build -f infrastructure/docker/admin.Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/admin ./apps/admin
RUN pnpm --filter @topla/admin build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/admin/.next ./apps/admin/.next
COPY --from=build /repo/apps/admin/public ./apps/admin/public
COPY --from=build /repo/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=build /repo/apps/admin/package.json ./apps/admin/package.json
WORKDIR /repo/apps/admin
EXPOSE 3002
CMD ["pnpm", "start"]
