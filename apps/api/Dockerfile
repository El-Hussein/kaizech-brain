FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tenant_documentation.html ./
COPY libs ./libs
COPY apps/api ./apps/api

RUN pnpm install
RUN pnpm --filter @kaizech/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install Chromium dependencies for headless rendering in Alpine Linux
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app /app

EXPOSE 3000

CMD ["pnpm", "--filter", "@kaizech/api", "start:prod"]
