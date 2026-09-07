# 已知问题与待办

记录已经确认、但当前决定不改的问题。每条写清**现象、根因、影响范围、为什么先不改、真要改怎么改**，
避免下次重新排查一遍。改掉之后把对应条目删掉。

---

## 模型广场：移动端表格横向滚动无提示

**状态**：确认存在，决定暂不修改（2026-09-07）
**位置**：`src/views/ModelPlazaView.vue` · `.plaza-pricing-table`
**相关**：`src/composables/useContentBreakpoint.ts`

### 现象

390px（iPhone 宽度）下价目表需要横向滚动 124px 才能看全，但容器**没有任何可滚动的视觉提示**。
用户第一眼看到的是「输出」列被切掉一半（`$12`、`$8.5`），容易当成渲染 bug 而不是去滑动。

### 已验证不是问题的部分

- 页面本身**从不**横向滚动：xl/lg/md/mobile 四档下 `documentElement.scrollWidth === clientWidth`
- 滚动发生在 `.plaza-pricing-table`（`overflow-x: auto`）容器内部，这是设计意图
- 滚到最右内容完整，**没有裁切**

### 列优先级降级现状

| 视口 | 档位 | 表格列 |
|---|---|---|
| ≥1280 | xl | 模型 / 输入 / 输出 / 缓存 / 折扣倍率 |
| 1024–1279 | lg | 同上 |
| 768–1023 | md | **去掉缓存列** |
| <768 | mobile | 模型 / 输入 / 输出 / 折扣倍率（不再降级，改为横滚） |

md 档主动砍掉了缓存列，mobile 档却没有继续砍，而是让它横滚 —— 断档就出在这里。

### 为什么严重性不高

被挤出视野的「折扣倍率」列**在分组卡片头部已经有徽章**（`1× 0.85x` / `1.2x`），
而且同一分组内每行的值都相同，这一列本身就是冗余展示。真正被切掉的只有「输出」列的后半截。

### 真要改的话

两个方向，倾向第二个：

1. mobile 档给容器加右侧渐隐遮罩（或「← 左右滑动」提示），保留全部列
2. **mobile 档把折扣倍率列也去掉** —— 头部徽章已经承载了这个信息，去掉后
   390px 上三列刚好放得下，完全不需要横滚，与 md 档砍缓存列是同一套逻辑的延续

改动范围限于 `ModelPlazaView` 的列优先级判断，不影响其它档位。

### 验证方式备忘

测试库里没有渠道数据（见下一条），广场页面是空的。验证列布局不需要造数据：
在浏览器里拦截 `/api/v1/model-plaza` 塞入构造响应即可，跑的是真实渲染代码，刷新即失效。
注意 axios 1.x 的 xhr adapter 走 `onloadend` + `getAllResponseHeaders()`，
只补 `onload` / `onreadystatechange` 的话请求永远不 resolve，页面会一直转圈。

---

## 测试环境模型广场无数据

**状态**：环境数据缺失，非代码问题（2026-09-07）

`model_plaza_enabled` 已开启，但页面显示「暂无可展示的分组」。原因在数据层：

```
channels               → 0 行
channel_groups         → 0 行
channel_model_pricing  → 0 行
groups                 → 3 个 active（default / composite2b / community-pool）
```

后端 `ModelPlazaService.ListGroups` 的模型来自「状态为 active 的渠道」，
最后一步 `if len(pg.Models) == 0 { continue }` 会把没有模型的分组整个丢掉。
三个分组都没绑渠道 → 全部被丢 → 接口返回 `groups: []`。

要让广场出内容：建渠道 → 配模型与定价 → 绑定到分组 → 确认渠道与分组均为 active。

---

## 未做视觉验证的范围

- **登录后的所有页面**：需要测试环境的普通用户账号，尚未提供
- **暗色模式**：只在亮色下看过

---

## 遗留的上游标识

不影响功能，用户可见程度不一，按需处理：

| 位置 | 内容 | 用户可见性 |
|---|---|---|
| `UseKeyModal.vue` 生成的 Codex/Grok 配置 | `SUB2API_API_KEY`、`[model_providers.sub2api]` | **可见** —— 用户会把这段拷进自己机器 |
| localStorage / 缓存键 | `sub2api_locale`、`sub2api-auth-token-refresh`、`sub2api_login_agreement_consent`、`sub2api:ip-geo-cache:v1` | 不可见 |
| 管理端 i18n 文案 | 插件、账号池、计费倍率相关 | 不可达（sub2site 已剥离管理端） |

`SUB2API_API_KEY` 纯粹是**用户本机的约定**：页面同时生成 `env_key = "SUB2API_API_KEY"`（配置文件）
和 `export SUB2API_API_KEY=...`（终端命令）两半，Codex CLI 读前者拿到变量名、再去环境里取值。
服务端从头到尾不认识这个名字，改名零风险，只要两半一起改（本来就在同一个组件里生成）。

建议改成中性的 `AI_GATEWAY_API_KEY` + `[model_providers.gateway]`：不带上游品牌，
也不用从站点名推导（站点名可能是中文或含空格，推导出的变量名不合法）。

localStorage 键**不建议改**：会把现有用户的登录态和协议同意记录清空，收益却是零（用户看不到）。
