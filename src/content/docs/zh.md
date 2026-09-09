## 快速开始

### 第一步：登录

点击首页右上角的「登录」，进入控制台。

### 第二步：创建 API 密钥

登录后进入 **控制台 → API 密钥**，点「创建密钥」。

- 给密钥起一个能认出用途的名字，比如 `笔记本-codex`、`服务器-claude`
- 选择分组。不同分组对应不同的上游与计费倍率，可在 **模型广场** 里对比
- 创建后密钥会**完整显示一次**。立刻复制保存 —— 页面关掉就只剩前几位了，找不回来只能重新建一个

密钥形如 `sk-` 开头的一长串。**它等同于你的账号凭证**，不要提交进 Git、不要贴进聊天窗口、不要写进公开仓库。

### 第三步：记下接入地址

```
{{baseUrl}}
```

后面所有客户端配置都指向它。注意两种客户端对地址的要求不同：

| 客户端 | 应填的地址 |
| --- | --- |
| Codex CLI | `{{baseUrl}}/v1` —— **要带 `/v1`** |
| Claude Code | `{{baseUrl}}` —— **不要带 `/v1`** |

填反了会报 404，这是最常见的配置错误。

---

## Codex CLI 配置

编辑 `~/.codex/config.toml`（Windows 是 `%USERPROFILE%\.codex\config.toml`）。

下面两种方式**任选其一**，区别只在密钥存放的位置。

### 方式一：密钥放环境变量（推荐）

配置文件里只写变量名，真正的密钥留在环境里。这样配置文件可以随意备份、同步、甚至提交进 dotfiles 仓库，不会连带泄露密钥。

`~/.codex/config.toml`：

```toml
model_provider = "{{providerKey}}"

[model_providers.{{providerKey}}]
name = "{{brand}}"
base_url = "{{baseUrl}}/v1"
wire_api = "responses"
# 这里写的是环境变量的「名字」，不是密钥本身
env_key = "{{envKey}}"
requires_openai_auth = false
```

然后在终端里设置这个环境变量：

```bash
# macOS / Linux
export {{envKey}}="sk-你的密钥"
```

```powershell
# Windows PowerShell
$env:{{envKey}}="sk-你的密钥"
```

```
:: Windows 命令提示符
set {{envKey}}=sk-你的密钥
```

上面这些只对当前终端窗口生效。想长期生效就写进 `~/.zshrc`、`~/.bashrc`，或在 Windows 的「系统属性 → 环境变量」里添加。

### 方式二：密钥直接写在配置文件里

不想折腾环境变量就用这种。代价是**密钥以明文躺在磁盘上**，备份或同步这个文件时要留意。

`~/.codex/config.toml`：

```toml
model_provider = "{{providerKey}}"

[model_providers.{{providerKey}}]
name = "{{brand}}"
base_url = "{{baseUrl}}/v1"
wire_api = "responses"

[model_providers.{{providerKey}}.http_headers]
Authorization = "Bearer sk-你的密钥"
```

> 两种方式不要混用。同时写了 `env_key` 和 `http_headers.Authorization`，行为取决于 Codex 版本，容易出现「改了没生效」的困惑。

### 验证

```bash
codex "用一句话说明你是什么模型"
```

有回复就说明通了。

---

## Claude Code 配置

同样是两种方式任选其一。

注意这里的地址**不带 `/v1`** —— Claude Code 会自己补上后面的路径。

### 方式一：环境变量

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="sk-你的密钥"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL="{{baseUrl}}"
$env:ANTHROPIC_AUTH_TOKEN="sk-你的密钥"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

```
:: Windows 命令提示符
set ANTHROPIC_BASE_URL={{baseUrl}}
set ANTHROPIC_AUTH_TOKEN=sk-你的密钥
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` 关掉与本服务无关的遥测与后台请求，避免产生额外调用。

### 方式二：写进配置文件

编辑 `~/.claude/settings.json`（Windows 是 `%USERPROFILE%\.claude\settings.json`）。文件不存在就新建：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {
    "ANTHROPIC_BASE_URL": "{{baseUrl}}",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的密钥",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

同样地，密钥在这里是明文存储的。

> 环境变量的优先级高于 `settings.json`。如果改了配置文件却不生效，先检查终端里是不是还残留着旧的 `ANTHROPIC_BASE_URL`。

### 验证

```bash
claude "用一句话说明你是什么模型"
```

---

## 常见问题

### 报 401 / Unauthorized

- 密钥抄漏了或多了空格，重新完整复制一遍
- 密钥已被删除或禁用，去 **控制台 → API 密钥** 确认状态
- 余额或配额用尽
- Codex 用方式一时，环境变量没生效：`echo ${{envKey}}` 看看有没有值。**换了终端窗口需要重新设置**

### 报 404 / Not Found

九成是地址带没带 `/v1` 弄反了：

- Codex 的 `base_url` **要带** `/v1`
- Claude Code 的 `ANTHROPIC_BASE_URL` **不要带** `/v1`

### 提示模型不存在

你填的模型名当前分组不支持。到 **模型广场** 查一下这个分组实际有哪些模型，模型名要一字不差。

### 改了配置没反应

- 环境变量的改动只对**新开的**终端窗口生效
- 检查是不是同时用了两种配置方式（比如 `env_key` 和 `http_headers` 都写了）
- 确认改的是 `~/.codex/config.toml` 而不是别的目录下的同名文件

### 想查某个密钥用了多少

首页页脚的「密钥查询」可以直接用密钥查用量，不必登录。登录后在 **控制台 → 用量统计** 能看到更完整的明细。
