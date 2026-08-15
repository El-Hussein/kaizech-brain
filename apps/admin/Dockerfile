FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tailwind.preset.js ./
COPY libs ./libs
COPY apps/admin ./apps/admin

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm install
RUN pnpm --filter @kaizech/admin build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY --from=builder /app/apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


