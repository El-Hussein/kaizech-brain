FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY libs ./libs
COPY apps/dashboard ./apps/dashboard

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm install
RUN pnpm --filter @kaizech/dashboard build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

