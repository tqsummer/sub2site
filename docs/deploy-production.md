# 生产部署清单（换机器可直接照做）

面向「一台全新的空机器」，把 sub2api + sub2site + edge-nginx 整套拉起来。

**当前生产**：`ec2-user@18.222.226.206`，密钥 `D:\Data\Payun\18.222.226.206-token.pem`
**域名**：`cloud.airouterx.com`（用户端）· `sub-api.airouterx.com`（网关 + 管理端）

---

## 阶段 0 ⚠ 旧机器还活着的时候，先把这些取出来

**这一步没做，后面全是不可逆的损失。** 2026-09-08 换机就栽在这里 —— 旧机
`18.227.203.197` 下线后 SSH 已经连不上，下面每一项都取不回来了。

| 要取的东西 | 命令 / 位置 | 丢了的后果 |
|---|---|---|
| **数据库全量 dump** | `docker exec sub2api-postgres pg_dump -U sub2api -Fc sub2api > sub2api-$(date +%F).dump` | 用户、密钥、分组、上游账号、订阅、账单全部归零，无法重建 |
| **`.env`** | `sub2api-deploy/.env` | 见下面三项密钥 |
| `TOTP_ENCRYPTION_KEY` | `.env` | **换了值，所有已绑 TOTP 的用户永久登不进来** —— 库里的 secret 是用它加密的，解不开 |
| `JWT_SECRET` | `.env` | 换了值全体用户被登出。可接受，但要提前通知 |
| `POSTGRES_PASSWORD` | `.env` | 恢复 dump 时可以另设新值，不算硬伤 |
| **edge nginx 配置** | `edge-deploy/nginx.conf` + `docker-compose.yml` | 可从本仓库 `deploy/` 与测试机重建，但域名/证书路径要重填 |
| **TLS 证书与私钥** | `edge-deploy/certs/` | 可重新签发；用 Let's Encrypt 的话本就无所谓 |
| 正在运行的镜像 tag | `docker ps --format '{{.Image}}'` | 决定新机器拉哪一版，也是回滚目标 |

> 落地建议：把 dump 和 `.env` 一起传到 S3 或本地，**不要只留在那台机器上**。
> 更省事的做法是给 EBS 卷开定期快照 —— 机器没了卷还在。

---

## 阶段 1 前置核对（动手前逐项确认）

| # | 项目 | 怎么查 | 期望 |
|---|---|---|---|
| 1 | SSH 能进 | `ssh -i <key> ec2-user@<ip> hostname` | 返回主机名 |
| 2 | 密钥权限 | Windows 下 OpenSSH 有时会拒绝过宽的权限 | 能连上即可 |
| 3 | 机器规格 | `nproc; free -g; df -h /` | ≥2 核 / ≥4G / ≥30G 可用 |
| 4 | 安全组 | AWS 控制台 | 放行 22、80、443；**不要**放行 8080 |
| 5 | DNS | 在**服务器上**执行 `getent hosts <域名>` | 两个域名都指向新机器公网 IP |
| 6 | 数据库 dump | 阶段 0 的产物 | 有，或明确接受从零开始 |
| 7 | 三把密钥 | 阶段 0 的 `.env` | 有，或明确接受用户重新注册 |

> 第 5 项一定要**在服务器上查**。本地解析器可能缓存着旧记录（实测 TTL 47 分钟），
> 本地查到旧 IP 不代表没切成功。

---

## 阶段 2 系统基础

Amazon Linux 2023 上装 Docker（AL2 / CentOS 请换对应包管理器）：

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# compose v2 插件
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

**验证**（`usermod` 后需要重新登录才生效）：

```bash
docker --version && docker compose version && docker run --rm hello-world
```

---

## 阶段 3 sub2api（数据库 + Redis + 网关 + 管理端）

```bash
mkdir -p ~/sub2api-deploy && cd ~/sub2api-deploy
# 从 sub2api 仓库的 deploy/ 拷入 docker-compose.yml 与 .env.example
cp .env.example .env
```

编辑 `.env`，**必改项**：

| 变量 | 说明 |
|---|---|
| `POSTGRES_PASSWORD` | 随机强口令 |
| `JWT_SECRET` | 恢复旧库就用旧值；全新部署用 `openssl rand -hex 32` |
| `TOTP_ENCRYPTION_KEY` | **恢复旧库必须用旧值**，否则 TOTP 用户全部锁死 |
| `ADMIN_EMAIL` | 管理员邮箱 |
| `ADMIN_PASSWORD` | 留空则首次启动自动生成，**只打印在日志里一次** |

拉起：

```bash
docker compose up -d
docker compose logs -f sub2api | head -50   # 留空 ADMIN_PASSWORD 的话在这里抓初始密码
```

### 恢复数据库（有 dump 才做）

```bash
docker compose up -d postgres          # 只起库
docker cp sub2api-YYYY-MM-DD.dump sub2api-postgres:/tmp/d.dump
docker exec sub2api-postgres pg_restore -U sub2api -d sub2api --clean --if-exists /tmp/d.dump
docker compose up -d                   # 再起全部
```

**验证**：

```bash
docker ps --filter name=sub2api --format '{{.Names}}\t{{.Status}}'   # 三个容器 healthy
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/      # 200
docker exec sub2api-postgres psql -U sub2api -d sub2api -c "select count(*) from users;"
```

---

## 阶段 4 sub2site（用户端静态站）

镜像在**测试机**上构建后推 Docker Hub，生产只拉不建 —— 生产 2 核，
`pnpm install + vite build` 会和正在服务的容器抢资源（实测 load 从 0.27 冲到 1.51，SSH 被挤断）。

测试机上：

```bash
cd /root/sub2site && DOCKER_BUILDKIT=0 docker compose build
docker tag sub2site:latest tqsummer/sub2site:$(date +%Y-%m-%d)-1
docker push tqsummer/sub2site:$(date +%Y-%m-%d)-1
```

生产上 `~/sub2site/docker-compose.yml`：

```yaml
services:
  sub2site:
    image: tqsummer/sub2site:2026-09-08-1   # 用版本 tag，不要 :latest —— 否则回滚没有目标可指
    container_name: sub2site
    restart: unless-stopped
    environment:
      SITE_NAME: "AiRouterX"                # 注入首屏 <title>，须与后台 site_name 一致
    networks: [sub2api-net]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
networks:
  sub2api-net:
    external: true
    name: sub2api-deploy_sub2api-network    # 复用 sub2api 的网络，edge 才能按容器名解析
```

**不暴露端口** —— 暴露了会绕过 edge 的管理接口拦截。

**验证**：

```bash
docker compose up -d && docker exec sub2site wget -qO- http://127.0.0.1/healthz   # ok
```

---

## 阶段 5 edge-nginx（统一入口）

生产 80/443 由它独占，按域名分流。配置模板见本仓库 `deploy/nginx.conf.template`
的注释与测试机 `/root/edge-deploy/nginx.conf`。

路由规则（两个域名共四类路径）：

| Host | 路径 | 去向 |
|---|---|---|
| cloud.airouterx.com | `/api/v1/admin` | **404**（纵深防御：拿到管理员 JWT 也调不动）|
| cloud.airouterx.com | `/api/` | sub2api:8080 |
| cloud.airouterx.com | `~ ^/(v1beta\|v1\|antigravity\|backend-api)(/\|$)` | sub2api:8080 |
| cloud.airouterx.com | `/` | sub2site:80 |
| sub-api.airouterx.com | `/` | sub2api:8080（含管理端）|
| 未匹配域名 / 直接用 IP 访问 | — | `return 444` 断开，不暴露任何服务 |

关键点：

- `proxy_set_header Host $host` —— 传用户实际访问的域名，不是后端域名。
  sub2api 的 `CanonicalizeReturnURL` 用它做同源校验，传错 OAuth/支付回跳会失败
- `resolver 127.0.0.11 ipv6=off valid=10s` —— 用 Docker 内嵌 DNS 运行时解析，
  后端容器重启换 IP 时 edge 不用跟着重启
- `proxy_buffering off` —— SSE 流式响应必须关
- `proxy_read_timeout 3600s` · `client_max_body_size 256m` —— AI 网关特性

**验证**（改端口映射必须 `up -d` 重建，改配置用 `nginx -t` + `reload`）：

```bash
docker run --rm -v $PWD/nginx.conf:/etc/nginx/nginx.conf:ro nginx:1.24-alpine nginx -t
docker compose up -d
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: cloud.airouterx.com'   http://127.0.0.1/                      # 200
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: sub-api.airouterx.com' http://127.0.0.1/                      # 200
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: cloud.airouterx.com'   http://127.0.0.1/api/v1/admin/users    # 404
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: cloud.airouterx.com'   http://127.0.0.1/api/v1/settings/public # 200
curl -s --max-time 5 http://<公网IP>/ ; echo "退出码 $?"                                                          # 应断开
```

---

## 阶段 6 HTTPS（Let's Encrypt + 自动续期）

已在 18.222.226.206 上完整跑通，以下步骤照做即可。证书 90 天有效，certbot 在
剩余 30 天内自动续。

### ⚠ 先理解一件事：80 端口不能关

只提供 HTTPS 是对的，但 **80 必须继续监听**。Let's Encrypt 的 HTTP-01 质询在
每次续签时会明文访问 `http://域名/.well-known/acme-challenge/xxx` —— 关掉 80
等于自动续期失效，证书 90 天后过期、站点直接挂，而且不会有任何预警。

正确做法是 80 上只保留两个 location：ACME 质询原样返回，其余一律跳 HTTPS。
用户感知就是"只能用 HTTPS"，续期不受影响。

安全组要同时放行 80 和 443。

### 1. 先验证质询路径能通（省下无谓的失败重试）

```bash
sudo mkdir -p ~/edge-deploy/acme-webroot/.well-known/acme-challenge
echo ok | sudo tee ~/edge-deploy/acme-webroot/.well-known/acme-challenge/probe.txt
sudo chmod -R a+rX ~/edge-deploy/acme-webroot
```

从**外网**（不是服务器本机）访问，两个域名都要返回 `ok`：

```bash
curl http://cloud.airouterx.com/.well-known/acme-challenge/probe.txt
curl http://sub-api.airouterx.com/.well-known/acme-challenge/probe.txt
```

不通就别往下走 —— Let's Encrypt 有失败频率限制，盲试会把额度耗掉。

### 2. 签发

```bash
sudo dnf install -y certbot
sudo certbot certonly --webroot -w /home/ec2-user/edge-deploy/acme-webroot \
     -d cloud.airouterx.com -d sub-api.airouterx.com \
     --email <邮箱> --agree-tos --no-eff-email --non-interactive
```

- 两个域名写在同一条命令 = **一张 SAN 证书**，目录名取第一个 `-d` 的值，
  即 `/etc/letsencrypt/live/cloud.airouterx.com/`。nginx 里两个 server 块引用同一份。
- 不想留邮箱就把 `--email`/`--no-eff-email` 换成 `--register-unsafely-without-email`。
  代价：**续期万一静默失败，你收不到任何告警**，得自己定期查到期时间。

### 3. 打开 443

`edge-deploy/docker-compose.yml`：

```yaml
ports:
  - "443:443"
  - "80:80"          # 保留，见上面的说明
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro    # 整个目录，不能只挂 live/
```

> `live/` 下全是指向 `archive/` 的软链接，只挂 `live/` 容器里会读不到实际文件。

nginx 配置直接用仓库里的 `deploy/edge-nginx.conf.example`，它已经是 HTTPS 版本。

**改了端口映射必须 `docker compose up -d` 重建，`reload` 不够。**

### 4. 配置续签后的 reload 钩子（最容易漏的一步）

certbot 跑在宿主上，不知道 nginx 在容器里。没有这个钩子，证书虽然续上了，
**nginx 仍然拿着旧证书直到下次重启**：

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-edge.sh >/dev/null <<'SH'
#!/bin/sh
docker exec edge-nginx nginx -s reload
SH
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-edge.sh
```

### 5. 启用定时器并演练

```bash
sudo systemctl enable --now certbot-renew.timer
systemctl list-timers certbot-renew.timer
sudo certbot renew --dry-run --no-random-sleep-on-renew
```

- AL2023 的 certbot 包自带 `certbot-renew.timer`，但**默认是 disabled**，必须手动启用
- **一定要加 `--no-random-sleep-on-renew`**：不加的话 certbot 会先随机 sleep 最多
  几百秒（实测 374 秒），SSH 会话会先超时断开，进程还在后台占着锁，
  下次再跑报 `Another instance of Certbot is already running`
- `--dry-run` 走 Let's Encrypt 的演练环境，不消耗签发额度，可以放心多跑

### 6. 验收

```bash
# HTTPS 通，证书有效（ssl_verify_result 为 0）
curl -s -o /dev/null -w "%{http_code} %{ssl_verify_result}\n" https://cloud.airouterx.com/
curl -s -o /dev/null -w "%{http_code} %{ssl_verify_result}\n" https://sub-api.airouterx.com/

# 80 跳转且保留路径
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://cloud.airouterx.com/keys

# ACME 路径必须仍是明文 200、不跳转 —— 这条挂了自动续期就废了
curl -s -o /dev/null -w "%{http_code} redirect=[%{redirect_url}]\n" \
     http://cloud.airouterx.com/.well-known/acme-challenge/probe.txt

# 证书覆盖两个域名
echo | openssl s_client -connect cloud.airouterx.com:443 -servername cloud.airouterx.com 2>/dev/null \
  | openssl x509 -noout -dates -ext subjectAltName
```

### 两个坑

- **`http2` 的写法跟 nginx 版本走**：1.25+ 是 `listen 443 ssl;` + 独立的 `http2 on;`；
  1.24 及以下必须写成 `listen 443 ssl http2;`，写 `http2 on;` 会报 unknown directive。
  生产用 1.27（内核 6.x 无 seccomp 限制），测试机 CentOS 7 只能用 1.24 —— **两边写法不同**。
- **HTTP→HTTPS 跳转先用 302，稳定几天再换 301。** 301 会被浏览器永久缓存，
  一旦要回退，你没有任何办法远程清掉用户的缓存 —— 上次就是这么把 HTTP 访问搞挂的。

---

## 阶段 7 上线验收

| # | 检查项 | 期望 |
|---|---|---|
| 1 | `docker ps` | sub2api / postgres / redis / sub2site / edge-nginx 全部 healthy |
| 2 | 浏览器打开 `cloud.airouterx.com` | 落地页正常，标签页标题是站点名 |
| 3 | 首帧标题 | 是 `AiRouterX` 而非空白 —— 验证 `SITE_NAME` 注入生效 |
| 4 | favicon / 左上角 Logo | 无上游品牌残留 |
| 5 | 登录 → 密钥页 | 能列出密钥 |
| 6 | 实际调一次模型 | `curl -H "Authorization: Bearer sk-..." <域名>/v1/messages` 通 |
| 7 | `cloud` 域名调管理接口 | 404 |
| 8 | `sub-api` 域名进管理端 | 能登录 |
| 9 | 用公网 IP 直接访问 | 连接断开 |
| 10 | 磁盘 | `df -h /` 留有余量 |
| 11 | HTTPS 证书 | `ssl_verify_result` 为 0，SAN 覆盖两个域名 |
| 12 | 80 跳转 | 302 到 https，且**保留原路径** |
| 13 | ACME 路径 | 明文 80 上仍返回 200 且不跳转 |
| 14 | 续期定时器 | `systemctl is-enabled certbot-renew.timer` 为 enabled |
| 15 | 续期演练 | `certbot renew --dry-run --no-random-sleep-on-renew` 通过 |
| 16 | reload 钩子 | `/etc/letsencrypt/renewal-hooks/deploy/reload-edge.sh` 存在且可执行 |

**后台配置**（全新库是出厂默认值，不配的话页面上显示的是 `Sub2API`）：
登录管理端设置站点名、Logo、副标题、`api_base_url`（填 `https://sub-api.airouterx.com`）、
模型广场开关。注意 `SITE_NAME` 环境变量与后台的 `site_name` 是两处配置，要保持一致。

---

## 收尾

```bash
docker image prune -f      # 每次发版后清理，别等磁盘满
```

发版失败时优先怀疑磁盘：老生产 20G 曾因写满导致构建失败，现象是莫名其妙的报错。

**回滚**：把 compose 里的 image tag 改回上一版，`docker compose up -d`。
这就是为什么不能用 `:latest` —— 它无法回答「现在跑的到底是哪一版」。

---

## 附：机器规格与踩过的坑

| 项 | 老生产 18.227.203.197 | 新生产 18.222.226.206 |
|---|---|---|
| 系统 | Amazon Linux | Amazon Linux 2023 |
| 内核 | — | 6.18 |
| 规格 | 2 核 / 7.6G / **20G** | 2 核 / 7G / **40G** |
| docker | — | 25.0.14 |
| compose | v0.12.1（buildx 太旧，`compose build` 直接报错）| v5.5.1，无此问题 |
| nginx (edge) | 1.24-alpine | 1.27-alpine（`http2 on;` 写法）|
| certbot | 未装（一直跑 HTTP）| 2.6.0，webroot 模式 + systemd timer |

- 老生产的 buildx 版本不够（`compose build requires buildx 0.17.0 or later`），
  这也是「镜像在测试机构建后推 Docker Hub」这个流程的由来。新机器新装的 compose 没这问题，
  但**构建仍应放在测试机** —— 理由是 CPU 争抢，不是版本。
- 测试机 `192.168.33.209` 是 CentOS 7 / 内核 3.10，nginx **必须** 1.24-alpine，
  1.25+ 会被 seccomp 拦截。生产没有这个限制，两边镜像版本可以不同，
  但 HTTPS 的 `http2` 写法要跟着镜像版本走。
