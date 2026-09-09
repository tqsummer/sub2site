# 使用文档页设计

**日期**：2026-09-09
**状态**：已实现

## 目标

在 sub2site 增加一个面向新用户的使用文档：登录 → 创建 API 密钥 → 在 Codex CLI
和 Claude Code 里配好并跑通。首页导航要有入口。

## 为什么不用现成的机制

评估过站内已有的两套「文档」能力，都不适用：

| 机制 | 为什么不行 |
| --- | --- |
| 自定义页面 `/custom/:id` | 内容存在 sub2api 容器的 `data/pages/*.md`，管理端**只能列出、不能编辑**（无写接口）；接口带 `jwtAuth`，**必须登录才能读**；菜单项只出现在登录后的侧边栏，落地页不消费。而这份文档的读者按定义还没登录 |
| 后台 `doc_url` 设置 | 只是一个跳转到站外文档站的链接，本身不承载内容 |

`doc_url` 的能力保留：配了就跳外站，没配用站内页。

## 架构

```
LandingView 导航 / 页脚
        │  doc_url 有值 → <a> 跳外站
        │  doc_url 为空 → <router-link to="/docs">
        ▼
  /docs（公开路由，requiresAuth: false）
        │
   DocsView.vue
        │  1. 按 locale 选 zh.md / en.md（Vite ?raw 导入）
        │  2. 替换 {{占位符}}
        ▼
   MarkdownDoc.vue（共享组件）
           marked → DOMPurify → 注入标题 id → 目录 + 滚动高亮 + 复制按钮
```

## 组件划分

**`MarkdownDoc.vue`**（新，`components/common/`）
输入一段 Markdown 字符串，输出带目录的文档。不关心内容来源。
从 `CustomPageView` 抽出——那里原本有约 120 行渲染/目录/滚动/复制逻辑加 100 行
样式，新页需要一模一样的东西，复制一份就是两处各自演化的开始。
`CustomPageView` 同步改为使用它，只保留自己特有的部分（取接口、把相对图片地址
改写成 `/pages/{slug}/images/...`）。

**`DocsView.vue`**（新，`views/public/`）
公开页外壳：顶栏 + MarkdownDoc。负责选语言和替换占位符。

**`PublicNavBar.vue`**（由 `modelPlaza/PlazaNavBar.vue` 改名迁移）
现在服务两个公开页，继续叫 Plaza 会误导。顺带把登录跳转从写死的
`/model-plaza` 改成当前路由，登录后回到用户原本在看的页面。

## 内容与占位符

正文在 `src/content/docs/{zh,en}.md`。**改文档只改 `.md`，不碰组件代码。**
长篇散文不进 i18n 的 `.ts` 字典——难写也难 review；i18n 只留一个标题键 `docs.title`。

渲染前替换占位符，镜像里不留品牌与域名：

| 占位符 | 来源 | 规则 |
| --- | --- | --- |
| `{{brand}}` | `site_name` | 空则 `AI Gateway` |
| `{{baseUrl}}` | `api_base_url` | 剥掉尾部 `/v1` 与斜杠；空则回落当前 origin |
| `{{providerKey}}` | `site_name` | 小写后只留 `[a-z0-9]`；结果为空则 `gateway` |
| `{{envKey}}` | `providerKey` | 大写 + `_API_KEY` |

`providerKey` 必须规范化：TOML 表名和环境变量名只允许字母数字下划线，而站点名
可能是中文或带空格（如「云豆智能」），直接拿来用会生成非法配置。

未知占位符原样保留，方便发现文档里的笔误。

## 内容要点

两种客户端对地址的要求不同，这是排障高发区，文档里显式对照：

- Codex CLI `base_url` = `{{baseUrl}}/v1`，**带** `/v1`
- Claude Code `ANTHROPIC_BASE_URL` = `{{baseUrl}}`，**不带** `/v1`

密钥存放两种方式都写，让用户自己选：

1. **环境变量**（推荐）——`env_key` 只写变量名，配置文件可安全备份/同步
2. **直接写配置文件**——`http_headers.Authorization`，密钥明文落盘

明确提醒不要混用：同时写了 `env_key` 和 `http_headers`，行为取决于 Codex 版本。

## 测试

`DocsView.spec.ts`（10 例）：占位符替换、中文站点名回落 `gateway`、
`api_base_url` 为空回落 origin、`/v1` 去重、两种客户端地址形态、两种密钥方式、
中英切换、无上游品牌残留、目录生成。

`LandingView.docsEntry.spec.ts`（3 例）：`doc_url` 空/非空两种入口目标、
站外链接带 `noopener`、两种情况入口都存在。

## 已知取舍

- 改文档需要重新构建发版。接受——配置示例本就该跟产品版本走，改错了 review 能拦住
- `PublicNavBar` 仍用 `modelPlaza.nav.*` 的 i18n 键。两处措辞一致，为改命名去动
  双语文件不划算；有第三个公开页时再统一
- 文档里的 `envKey` 是 `AIROUTERX_API_KEY`，而 `UseKeyModal` 生成的仍是
  `SUB2API_API_KEY`。两者互不依赖（都是用户本机的约定），但用户同时看到会疑惑。
  见 `docs/known-issues.md` 的遗留标识条目
