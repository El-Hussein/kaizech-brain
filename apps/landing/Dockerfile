FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY libs ./libs
COPY apps/landing ./apps/landing

RUN pnpm install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm --filter @kaizech/landing build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=builder /app /app

EXPOSE 3000

CMD ["pnpm", "--filter", "@kaizech/landing", "start"]
