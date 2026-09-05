# ---- 构建阶段 ----
# node20 而非 node22：目标机 CentOS7 kernel 3.10，Node22 的 libuv 会 EPERM
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.6 --activate

# 先装依赖，利用层缓存
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set node-linker hoisted && pnpm install --frozen-lockfile

COPY . .

# VITE_API_BASE_URL 不设 -> 默认相对路径 /api/v1，走同源 nginx 反代
RUN pnpm build

# ---- 运行阶段 ----
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
