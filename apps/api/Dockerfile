FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY node_modules ./node_modules
COPY libs ./libs
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["pnpm", "start:dev"]
