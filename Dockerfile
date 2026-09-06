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

# 走官方镜像的模板机制：启动时 envsubst 渲染到 conf.d/default.conf。
# 目的是把站点名注入 <title>，见模板里的 sub_filter 说明。
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template

# 只替换 SITE_ 开头的变量，避免 envsubst 把 $uri / $host 这类 nginx 变量吃掉。
ENV NGINX_ENVSUBST_FILTER="^SITE_"
# 默认值就是 index.html 里那个不间断空格，替换成自身 = 无操作。
# 镜像本身因此不带任何品牌，名字由部署方在 compose 里给 SITE_NAME。
# 不能用空串：那会让 <title> 真的为空，浏览器转而拿域名+路径当标签名。
ENV SITE_NAME="&#160;"

EXPOSE 80
