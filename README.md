# sub2site

面向终端用户的前端站点。独立部署、独立域名，只提供用户侧功能（登录注册、密钥管理、
用量查询、模型广场、充值订阅等），**不包含任何管理端页面**。

后端网关与管理端由 [sub2api](https://github.com/Wei-Shaw/sub2api) 提供，本项目通过
HTTP API 与其对接，不修改也不依赖其源码。

## 与上游的关系（许可证声明）

本项目基于 sub2api 的前端（`frontend/`）派生而来，原项目采用
**GNU Lesser General Public License v3.0 or later**。

- 原项目：sub2api — https://github.com/Wei-Shaw/sub2api
- 许可证：LGPL-3.0-or-later，全文见本仓库 [LICENSE](./LICENSE)（与上游逐字节一致）

作为派生作品，本项目同样以 LGPL-3.0-or-later 分发。这一条适用于源码，也适用于
构建产物 —— 包括发布到 Docker Hub 的镜像。

主要改动：剥离管理端、重做落地页与设计系统（语义化 token + Tailwind 映射）、
去除硬编码品牌与指向上游仓库的链接、改为纯静态托管 + edge-nginx 统一入口的部署形态。

> LGPL-3.0 的正文在法律上并入 GPL-3.0 的条款（"incorporates the terms and conditions
> of version 3 of the GNU General Public License"）。上游仓库只随附了 LGPL 全文，
> 本仓库保持一致。若要做到完全严格，可另行补上 GPL-3.0 全文（惯例是 `COPYING` +
> `COPYING.LESSER` 两个文件）。

## 架构

```
                    ┌─────────────┐
   浏览器 ─────────▶│  edge-nginx │  持有域名与证书，按路径分流
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
   /api/*     │              其余路径    │
   /v1 /v1beta│                         │
   /antigravity                         │
   /backend-api                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  sub2api    │          │  sub2site   │
       │   :8080     │          │  nginx :80  │
       └─────────────┘          └─────────────┘
         网关 + 管理端              静态文件
```

sub2site 容器只做静态文件服务，不暴露宿主端口，也不含任何反代规则。
`/api/v1/admin/*` 在 edge 层直接返回 404 —— 即便持有管理员凭证也无法从用户端域名
调用管理接口。换域名或调整路由只改 edge 的配置，不需要重建镜像。

## 开发

```bash
pnpm install
pnpm dev          # 开发服务器
pnpm typecheck    # vue-tsc --noEmit
pnpm test:run     # vitest
pnpm build        # 产物在 dist/
```

## 部署

```bash
docker compose up -d --build
```

`docker-compose.yml` 里的 `SITE_NAME` 会被注入到 `index.html` 的 `<title>`，
让首次访问的用户第一帧就看到正确品牌 —— 静态托管没有后端渲染那一层，
详见 [deploy/nginx.conf.template](./deploy/nginx.conf.template) 里的说明。
它应与后台设置中的 `site_name` 保持一致，改了需要重启容器。

镜像本身不含任何品牌信息：站点名、Logo、副标题、API 域名全部来自
`/api/v1/settings/public`，同一个镜像可供不同部署方复用。
