# Claude Design 第二轮返工提示词（最终轮）

> 整段复制下面代码块内的内容贴给 Claude Design。

---

```
上一轮返工完成度很高，大部分要求都达标，可访问性和危险操作确认甚至超出了要求。这是最后一轮，只修剩余问题，不要改动已经做对的部分。

下面按严重度排列。第 1 项是唯一的阻塞缺陷，必须优先修。

═══════════════════════════════════════
【P0】断点判断依据错误 —— 这是本轮唯一的阻塞项
═══════════════════════════════════════

## 问题

列优先级的代码写得完全正确：
  cId: cell(1440), cIp: cell(1440), cCreated: cell(1440), cRate: cell(1280), cLast: cell(1280)

但触发条件是错的。console-shell.js 第 39 行：

  const autoLayout = measured < 1024 ? 'mobile' : measured < 1280 ? '1024'
                   : measured < 1440 ? '1280' : 'desktop';

`measured` 是 window.innerWidth（视口宽度），既没有减去侧栏宽度，也完全不受 collapsed 状态影响。

后果：侧栏展开时内容区 = 视口 − 260px，但列显隐仍按视口判断。视口 1440 + 侧栏展开时内容区只有 1180px，却仍按 1440 档显示全部 13 列，必然放不下。

第 52 行还有连带问题：

  const frameWidth = explicit && tier ? tier + 'px' : '100%';

显式选「1280 档」时，把 1280px 分配给「侧栏 + 内容」整体，实际内容区只有 1020px。也就是说三档出图本身系统性少算了 260px，之前所有断点截图都不可信。

## 修复（请照抄，注意有循环依赖需要打破）

注意：mobile 依赖 layout，layout 依赖 autoLayout，而修复后 autoLayout 需要知道侧栏宽度，侧栏宽度又依赖 mobile。必须先用视口判断是否进抽屉态来打破这个环。

console-shell.js 第 39 行替换为：

  // 视口 < 1024 直接进抽屉态，此时侧栏不占据内容宽度
  const viewportMobile = measured < 1024;
  // 侧栏实际占位（与第 48 行的 width 保持一致）
  const sidebarW = viewportMobile ? 0 : (collapsed ? 72 : 260);
  // 内容区可用宽度 —— 断点必须基于这个值
  const contentW = measured - sidebarW;
  const autoLayout =
      viewportMobile    ? 'mobile'
    : contentW < 1280   ? '1024'
    : contentW < 1440   ? '1280'
    :                     'desktop';

第 52 行替换为：

  // 显式档位指的是内容区宽度，画布总宽需加上侧栏
  const frameWidth = explicit && tier ? (tier + sidebarW) + 'px' : '100%';

## 同时修 window.apLayout（第 122-126 行）

页面侧通过 window.apLayout() 取档位，但它是全局函数，拿不到 shell 的 collapsed 状态，所以同样算错。

让 shell 把生效档位写到 DOM，在组件内加一个 effect：

  React.useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.dataset.apTier = layout;
  }, [layout]);

然后把 window.apLayout 替换为：

  window.apLayout = function (prop) {
    if (prop && prop !== 'desktop') return prop;
    const t = typeof document !== 'undefined' && document.documentElement.dataset.apTier;
    if (t) return t;
    // shell 尚未挂载时的兜底：按侧栏展开估算
    const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const c = w - 260;
    return w < 1024 ? 'mobile' : c < 1280 ? '1024' : c < 1440 ? '1280' : 'desktop';
  };

## 修完后必须重新出图

之前的断点截图全部作废，请按新逻辑重新导出，每档两张（侧栏展开 + 侧栏折叠），共 6 张：

  内容区 1024 档 · 侧栏展开 / 折叠
  内容区 1280 档 · 侧栏展开 / 折叠
  内容区 1440 档 · 侧栏展开 / 折叠

自查：1024 档应该只见 8 列（隐藏 ID / 最后 IP / 创建 / 速率限制 / 最后使用），1280 档 10 列，1440 档 13 列。如果侧栏展开和折叠两张图的列数相同，说明没修对。

## 补 CSS 兜底

目前响应式完全依赖 JS，全库除了 prefers-reduced-motion 之外没有任何 media query。请为关键布局（指标卡网格列数、图表区分栏、表单双列）补 CSS media query 兜底，避免 JS 未执行时布局崩坏。

═══════════════════════════════════════
【P1】新引入的焦点陷阱缺陷
═══════════════════════════════════════

AIProxy API Keys.dc.html 第 307 行的 openResetQuota / openResetRate 只设置了 confirm 状态，没有清除 modal 状态。

后果：从编辑弹窗内点「重置用量」时，编辑表单和确认框会同时存在两个 [data-dialog] 元素。而第 231 行的焦点陷阱用的是 document.querySelector('[data-dialog]')，只取第一个 —— 焦点被锁在下层的编辑表单上，而不是上层的确认框；第 230 行的 Escape 还会一次性关掉两层。

请二选一修复：

方案 A（推荐，交互更清晰）：打开确认框前先关闭编辑弹窗
  openResetQuota / openResetRate 里先 setModal('none') 再 setConfirm(...)
  确认或取消后，如果需要回到编辑态，再重新 setModal('edit')

方案 B（保留层叠）：让焦点陷阱取最后一个 dialog
  把 querySelector('[data-dialog]') 改为
    const dialogs = document.querySelectorAll('[data-dialog]');
    const dlg = dialogs[dialogs.length - 1];
  并让 Escape 只关闭最上层

═══════════════════════════════════════
【P1】Logo 插槽只做了一半
═══════════════════════════════════════

组件实现是对的 —— console-shell.js 第 22-27 行的横版支持（maxWidth: size*4）和缺失降级（首字母方块）都符合要求。但没有推广开：

1. **落地页 3 处 Logo 完全没接插槽**：AIProxy Landing.dc.html 第 17 行（顶部导航）、第 59 行（首屏主视觉卡）、第 192 行（页脚），仍是硬编码的 CSS 方块，只是把字母换成了 {{ initial }}。Landing 画板里 logoUrl 出现 0 次。
   → 请让这三处使用与 console-shell 相同的 Logo 逻辑（支持 logoUrl 图片 / 最宽 4:1 / 缺失降级），并在 Landing 的 data-props 里加上 logoUrl。

2. **window.BrandLogo 导出后零使用**：console-shell.js 第 27 行导出了 BrandLogo，但全库没有任何地方调用它。
   → 要么让落地页复用它，要么删掉这个导出，不要留悬空 API。

3. **三个画板没有 logoUrl prop**：API Keys / Usage / Subscriptions 的 data-props 里没有 logoUrl，导致这三屏永远只能看到首字母降级态，无法预览真实 Logo 效果。
   → 补上 logoUrl prop，默认值留空（展示降级态），但要能切换。

═══════════════════════════════════════
【P1】间距清理剩余 188 处
═══════════════════════════════════════

阶梯已经定义好了（--space-2 到 --space-48，九档带用途说明），Console 和 Design System 两个画板也清零了。但其余画板还有 188 处非阶梯值（6 / 10 / 14 / 18 / 22px）。

按残留量排序，请逐个清理：

  AIProxy Dashboard.dc.html      —— 几乎未动（:18 padding:16px 18px、:19 padding:18px;gap:14px、:42 padding:14px 等）
  AIProxy Usage.dc.html          —— 几乎未动（:13, :18-21, :25, :34, :51, :54, :57）
  AIProxy Landing.dc.html        —— 几乎未动（:17, :24, :33, :44, :57, :58, :60, :82, :90, :97）
  AIProxy Subscriptions.dc.html  —— 几乎未动（:29 gap:14px、:32 padding:16px 18px 14px、:43、:57 padding:22px 18px;gap:18px）
  AIProxy Components.dc.html     —— 大量（:27-51 的 padding:0 14px / gap:10px）
  AIProxy API Keys.dc.html       —— 仅剩 2 处（:29 padding:0 6px、:30 gap:6px）
  console-shell.js               —— 3 处（:87 margin:'0 6px'、:88 和 :93 padding:'0 10px'）

就近取阶梯值即可（6→4 或 8，10→8 或 12，14→12 或 16，18→16 或 20，22→20 或 24）。如果某个值确实需要保留（比如视觉补偿），请在 Design System 里补进阶梯并说明用途。

═══════════════════════════════════════
【P2】表格排序与列优先级不完整
═══════════════════════════════════════

1. **Usage 两张表完全没有排序**：AIProxy Usage.dc.html 第 68、74 行的 th 既没有 aria-sort 也没有排序控件，而且没有做列优先级（API Keys 做了，两屏体验不一致）。
   → 请为 Usage 的用量表（13 列）和错误表（11 列）补排序控件 + aria-sort，并定义列优先级：
     用量表常驻：时间 · 模型 · 花费
     错误表常驻：时间 · 状态码 · 错误消息
     其余按信息价值排序，1280 和 1024 各隐藏一批（参考 API Keys 的做法）

2. **API Keys 只有名称列可排序**：第 67 行只给了名称列排序按钮，其余 12 列没有入口。
   → 至少给这些列补上排序：用量、并发、过期时间、状态、最后使用、创建时间。不可排序的列（API Key、分组、操作）保持现状。

═══════════════════════════════════════
【P2】ARIA 语义误用三处
═══════════════════════════════════════

上一轮补了 167 处 ARIA，绝大部分正确，但有三处角色用错了：

1. AIProxy API Keys.dc.html 第 137 行：分组选择浮层标了 role="dialog" aria-modal="true"，但它是一个带搜索的下拉选择器，不是模态对话框。
   → 改为 role="listbox"（选项用 role="option" + aria-selected），或者用 combobox 模式。不要用 dialog + aria-modal，那会让屏幕阅读器误以为是模态。

2. console-shell.js 第 97 行：余额浮层标了 role="dialog" 但没有 aria-modal，与上一处不一致。
   → 它是 hover 展开的信息卡，应该用 role="tooltip"（如果只读）或 role="group" + aria-label。

3. AIProxy API Keys.dc.html 第 37 行：列设置按钮标了 aria-haspopup="true"（隐含 menu），但第 39 行弹出的是 role="group"。
   → 改为 aria-haspopup="menu" + 弹层 role="menu"，选项用 role="menuitemcheckbox" + aria-checked；或者按钮改用 aria-expanded 而不是 aria-haspopup。

═══════════════════════════════════════
【P2】表格行高被撑高
═══════════════════════════════════════

AIProxy API Keys.dc.html 第 83 行 tr 用了 vertical-align:top，而第 90 行的速率限制列每个密钥要渲染 3 个窗口（5h / 1d / 7d，各含标题 + 进度条 + 重置文案）约 130px，第 89 行的用量列也有 4 行 + 进度条。

结果：行高被最高的单元格撑到约 150px，而名称、ID、API Key 这些短单元格顶对齐，下方留大片空白。截图 01-keys4.jpg 可以直接看到。

这个问题旧版就有，不是新引入的，但一直没处理。请从以下方向解决（选一种或组合）：

  · 速率限制列改为紧凑形态：三个窗口横向排列而非纵向堆叠，或只显示最紧张的一个窗口 + hover 展开其余
  · 短单元格改为 vertical-align: middle，只让多行单元格顶对齐
  · 给行高设上限，超出内容用展开行（accordion）承载

请在设计稿中明确表格行高的目标值（Design System 里写的是 36px，但实际远超）。

═══════════════════════════════════════
【P3】收尾项
═══════════════════════════════════════

1. **删除 _ds/nocturne-*/ 目录**：8 个画板对它的引用已全部解除，但目录文件仍原封不动留在交付包里（styles.css 13KB、readme.md、_adherence.oxlintrc.json、_ds_manifest.json）。它规定的是紫色单暗色、主按钮描边、禁止非 Inter 字体，与现在的设计完全矛盾。留着会误导后续开发者，请删除。

2. **删除确认的输入框与按钮无联动**：AIProxy API Keys.dc.html 第 185-186 行，要求输入密钥名才能确认，但确认按钮没有根据输入内容禁用。请加上：输入不匹配时按钮 disabled。

3. **落地页「故障转移 < 200ms」**：AIProxy Landing.dc.html 第 63 行首屏主视觉卡里的这个数字，后端没有对应字段支撑。请改成有据可查的表述，或者去掉具体数值。

4. **清理过期截图**：screens/ 下的 dash.jpg、dash2.jpg、keys.jpg 三张与旧版字节完全相同，是返工前的图，容易误导。请删除或用新图替换。另外 01-keys2.jpg 也是返工前的状态（缺少「时间为 UTC+8」底注），一并处理。

═══════════════════════════════════════
验收标准
═══════════════════════════════════════

  □ 六张断点图（三档 × 侧栏展开/折叠）已重出，且展开与折叠的列数不同
  □ 1024 档 8 列 / 1280 档 10 列 / 1440 档 13 列，与底注声明一致
  □ 关键布局有 CSS media query 兜底
  □ 从编辑弹窗内触发重置确认，焦点正确落在确认框，Escape 只关一层
  □ 落地页 3 处 Logo 支持 logoUrl；BrandLogo 有实际调用或已删除
  □ API Keys / Usage / Subscriptions 三画板可切换 logoUrl 预览
  □ 非阶梯间距值清零（或已补进阶梯并说明用途）
  □ Usage 两张表有排序 + aria-sort + 列优先级
  □ 三处 ARIA 角色误用已修正
  □ 表格行高有明确目标值，短单元格不再大片留白
  □ _ds/ 目录已删除
  □ screens/ 里没有返工前的过期截图
```

---

## 关于 4 张缺失页面

第二轮提示词只覆盖**修复**，不含新增页面。按原计划还有 4 张高价值页没画：

| 页面 | 为什么需要设计稿 |
|---|---|
| 充值 / 订阅 | 转化关键页，支付状态机 7 种状态，工程侧凭空实现容易做砸 |
| 模型广场 | 对外报价页，双层表头宽表是设计难点 |
| 个人资料 | 11 个子组件，含 TOTP 三步向导与 Passkey 管理 |
| 渠道状态 | 两套形态（状态页 / 运维仪表盘） |

其余 8 页（可用渠道、批量图片、我的订单、兑换码、推广返利、密钥查询、法律页、404）结构简单，工程侧按设计系统实现即可。

**建议**：等这轮修复验收通过、断点机制确认可靠之后，再单独提补页需求。理由是补页会大量使用表格和响应式布局，如果断点机制还没修对，新画的页面会重复同样的错误，等于返工两次。
