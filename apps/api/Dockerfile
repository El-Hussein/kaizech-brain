FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY libs ./libs
COPY apps/api ./apps/api

RUN pnpm install
RUN pnpm --filter @kaizech/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=builder /app /app

EXPOSE 3000

CMD ["pnpm", "--filter", "@kaizech/api", "start:prod"]



