export default {
  batchImageGuide: {
    title: '图片批量生成',
    description: '一次提交多条提示词，任务完成后可统一下载图片结果'
  },
  // Home Page
  home: {
    viewOnGithub: '在 GitHub 上查看',
    viewDocs: '查看文档',
    docs: '文档',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    dashboard: '控制台',
    login: '登录',
    getStarted: '立即开始',
    goToDashboard: '进入控制台',
    // 新增：面向用户的价值主张
    heroSubtitle: '一个密钥，畅用多个 AI 模型',
    heroDescription: '无需管理多个订阅账号，一站式接入 Claude、GPT、Gemini 等主流 AI 服务',
    tags: {
      subscriptionToApi: '订阅转 API',
      stickySession: '会话保持',
      realtimeBilling: '按量计费'
    },
    // 用户痛点区块
    painPoints: {
      title: '你是否也遇到这些问题？',
      items: {
        expensive: {
          title: '订阅费用高',
          desc: '每个 AI 服务都要单独订阅，每月支出越来越多'
        },
        complex: {
          title: '多账号难管理',
          desc: '不同平台的账号、密钥分散各处，管理起来很麻烦'
        },
        unstable: {
          title: '服务不稳定',
          desc: '单一账号容易触发限制，影响正常使用'
        },
        noControl: {
          title: '用量无法控制',
          desc: '不知道钱花在哪了，也无法限制团队成员的使用'
        }
      }
    },
    // 解决方案区块
    solutions: {
      title: '我们帮你解决',
      subtitle: '简单三步，开始省心使用 AI'
    },
    features: {
      unifiedGateway: '一键接入',
      unifiedGatewayDesc: '获取一个 API 密钥，即可调用所有已接入的 AI 模型，无需分别申请。',
      multiAccount: '稳定可靠',
      multiAccountDesc: '智能调度多个上游账号，自动切换和负载均衡，告别频繁报错。',
      balanceQuota: '用多少付多少',
      balanceQuotaDesc: '按实际使用量计费，支持设置配额上限，团队用量一目了然。'
    },
    // 优势对比
    comparison: {
      title: '为什么选择我们？',
      headers: {
        feature: '对比项',
        official: '官方订阅',
        us: '本平台'
      },
      items: {
        pricing: {
          feature: '付费方式',
          official: '固定月费，用不完也付',
          us: '按量付费，用多少付多少'
        },
        models: {
          feature: '模型选择',
          official: '单一服务商',
          us: '多模型随意切换'
        },
        management: {
          feature: '账号管理',
          official: '每个服务单独管理',
          us: '统一密钥，一站管理'
        },
        stability: {
          feature: '服务稳定性',
          official: '单账号易触发限制',
          us: '多账号池，自动切换'
        },
        control: {
          feature: '用量控制',
          official: '无法限制',
          us: '可设配额、查明细'
        }
      }
    },
    providers: {
      title: '已支持的 AI 模型',
      description: '一个 API，多种选择',
      supported: '已支持',
      soon: '即将推出',
      claude: 'Claude',
      gemini: 'Gemini',
      antigravity: 'Antigravity',
      more: '更多'
    },
    // CTA 区块
    cta: {
      title: '准备好开始了吗？',
      description: '注册即可获得免费试用额度，体验一站式 AI 服务',
      button: '免费注册'
    },
    footer: {
      allRightsReserved: '保留所有权利。'
    }
  },

  // Key Usage Query Page
  keyUsage: {
    title: 'API Key 用量查询',
    subtitle: '输入您的 API Key 以查看实时消费金额与使用状态',
    placeholder: 'sk-ant-mirror-xxxxxxxxxxxx',
    query: '查询',
    querying: '查询中...',
    privacyNote: '您的 Key 仅在浏览器本地处理，不会被存储',
    dateRange: '统计范围:',
    dateRangeToday: '今日',
    dateRange7d: '7 天',
    dateRange30d: '30 天',
    dateRange90d: '90 天',
    dateRangeCustom: '自定义',
    apply: '应用',
    used: '已使用',
    detailInfo: '详细信息',
    tokenStats: 'Token 统计',
    dailyDetail: '按日明细',
    modelStats: '模型用量统计',
    // Table headers
    date: '日期',
    model: '模型',
    requests: '请求数',
    inputTokens: '输入 Tokens',
    outputTokens: '输出 Tokens',
    cacheCreationTokens: '缓存创建',
    cacheReadTokens: '缓存读取',
    cacheWriteTokens: '缓存写入',
    totalTokens: '总 Tokens',
    cost: '费用',
    // Status
    quotaMode: 'Key 限额模式',
    walletBalance: '钱包余额',
    // Ring card titles
    totalQuota: '总额度',
    limit5h: '5 小时限额',
    limitDaily: '日限额',
    limit7d: '7 天限额',
    limitWeekly: '周限额',
    limitMonthly: '月限额',
    // Detail rows
    remainingQuota: '剩余额度',
    expiresAt: '过期时间',
    todayExpires: '(今日到期)',
    daysLeft: '({days} 天)',
    usedQuota: '已用额度',
    resetNow: '即将重置',
    subscriptionType: '订阅类型',
    subscriptionExpires: '订阅到期',
    // Usage stat cells
    todayRequests: '今日请求',
    todayInputTokens: '今日输入',
    todayOutputTokens: '今日输出',
    todayTokens: '今日 Tokens',
    todayCacheCreation: '今日缓存创建',
    todayCacheRead: '今日缓存读取',
    todayCost: '今日费用',
    rpmTpm: 'RPM / TPM',
    totalRequests: '累计请求',
    totalInputTokens: '累计输入',
    totalOutputTokens: '累计输出',
    totalTokensLabel: '累计 Tokens',
    totalCacheCreation: '累计缓存创建',
    totalCacheRead: '累计缓存读取',
    totalCost: '累计费用',
    avgDuration: '平均耗时',
    // Messages
    enterApiKey: '请输入 API Key',
    querySuccess: '查询成功',
    queryFailed: '查询失败',
    queryFailedRetry: '查询失败，请稍后重试',
    noDailyUsage: '暂无按日用量数据',
  },

  // Setup Wizard
  setup: {
    title: 'Sub2API 安装向导',
    description: '配置您的 Sub2API 实例',
    database: {
      title: '数据库配置',
      description: '连接到您的 PostgreSQL 数据库',
      host: '主机',
      port: '端口',
      username: '用户名',
      password: '密码',
      databaseName: '数据库名称',
      sslMode: 'SSL 模式',
      passwordPlaceholder: '密码',
      ssl: {
        disable: '禁用',
        require: '要求',
        verifyCa: '验证 CA',
        verifyFull: '完全验证'
      }
    },
    redis: {
      title: 'Redis 配置',
      description: '连接到您的 Redis 服务器',
      host: '主机',
      port: '端口',
      username: '用户名（可选）',
      password: '密码（可选）',
      database: '数据库',
      usernamePlaceholder: '默认用户留空',
      passwordPlaceholder: '密码',
      enableTls: '启用 TLS',
      enableTlsHint: '连接 Redis 时使用 TLS（公共 CA 证书）'
    },
    admin: {
      title: '管理员账户',
      description: '创建您的管理员账户',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      passwordPlaceholder: '至少 8 个字符',
      confirmPasswordPlaceholder: '确认密码',
      passwordMismatch: '密码不匹配'
    },
    ready: {
      title: '准备安装',
      description: '检查您的配置并完成安装',
      database: '数据库',
      redis: 'Redis',
      adminEmail: '管理员邮箱'
    },
    status: {
      testing: '测试中...',
      success: '连接成功',
      testConnection: '测试连接',
      installing: '安装中...',
      completeInstallation: '完成安装',
      completed: '安装完成！',
      redirecting: '正在跳转到登录页面...',
      restarting: '服务正在重启，请稍候...',
      timeout: '服务重启时间超出预期，请手动刷新页面。'
    }
  },


  // ===== 新版落地页（LandingView.vue）=====
  // 文案原则：只写系统里真实存在的能力。厂商列表与模型价格来自 /model-plaza 公开接口，
  // 未接入上游时对应区块整块不渲染，页面不会出现没有支撑的宣传。
  landingV2: {
    nav: {
      modelPlaza: '模型广场',
      keyUsage: '密钥查询',
      docs: '文档',
      login: '登录',
      console: '控制台',
      start: '免费开始',
      toggleTheme: '切换明暗模式'
    },
    hero: {
      chip: '兼容 OpenAI 与 Anthropic 协议',
      title: '按模型名自动路由，不用换 Key',
      subtitle: '同一密钥按请求的模型名转发到对应上游。客户端只改 base_url，协议和模型名都不用动。',
      primary: '免费开始',
      secondary: '查看模型与价格',
      note1: '无需绑卡',
      note2: '5 分钟接入',
      demoRouted: '已路由',
      demoTokens: '本次计量'
    },
    vendors: {
      title: '已接入的模型厂商',
      hint: '实时读取自模型广场，随上游接入情况变化',
      // 尚未接入任何上游时的口径：讲「支持接入」而不是「已接入」，
      // 列表取自代码里真实支持的平台枚举，不虚构。
      supportedTitle: '支持接入的模型厂商',
      supportedHint: '上游接入后，此处将显示本站实际可调用的厂商'
    },
    billing: {
      eyebrow: '计费模式',
      title: '两种付费方式，按团队的用量形态选',
      subtitle: '两种模式可并存：订阅额度先用，超出部分自动走按量余额。',
      payg: {
        name: '按量计费',
        en: 'Pay as you go',
        desc: '按 token 实时扣减余额，用多少算多少。',
        f1: '每个密钥可单独设配额上限',
        f2: '每个密钥可设允许调用的模型范围',
        f3: '用量按密钥、模型、时间三个维度归因',
        fit: '适合：用量波动大、多模型混用、需要精细成本归因的团队。'
      },
      sub: {
        name: '订阅套餐',
        en: 'Subscription',
        desc: '按周期购买额度，额度内按倍率折算用量。',
        f1: '固定预算，用量可预期',
        f2: '可设日 / 周 / 月三档限额',
        f3: '额度用尽后可继续走按量余额',
        fit: '适合：用量稳定、需要预算封顶的产品团队与个人开发者。'
      },
      footnote: '具体价格与可选套餐请登录后在「充值 / 订阅」页查看。'
    },
    capability: {
      eyebrow: '核心能力',
      title: '基础设施级的稳定与可见',
      c1: { title: '多账号调度', desc: '同一分组下挂多个上游账号，请求自动分发，单账号触发限制不影响整体可用性。' },
      c2: { title: '自动故障转移', desc: '上游异常时自动切换到同组其他账号，无需客户端重试。' },
      c3: { title: '逐 token 计量', desc: '每次调用的输入、输出、缓存 token 分别记账，可逐条追溯。' },
      c4: { title: '密钥级管控', desc: '每个密钥可独立设置配额、并发、速率窗口与模型白名单。' }
    },
    devx: {
      eyebrow: '开发者接入',
      title: '改一行 base_url，其余不用动',
      subtitle: '兼容 OpenAI 与 Anthropic 协议，现有 SDK 与工具链直接切换。',
      s1: { n: '01', title: '注册并创建 API Key', desc: '可设名称、配额与允许调用的模型。' },
      s2: { n: '02', title: '替换 base_url 与 api_key', desc: '协议不变，模型名沿用各厂商原始命名。' },
      s3: { n: '03', title: '在控制台查看用量与成本', desc: '逐条调用记录，按密钥、模型、时间归因。' },
      copy: '复制',
      copied: '已复制'
    },
    pricing: {
      eyebrow: '价格透明',
      title: '全部模型价格公开，注册前即可比价',
      subtitle: '模型广场列出每个模型的输入 / 输出单价与倍率，按厂商筛选。',
      cta: '前往模型广场 →',
      colModel: '模型',
      colIn: '输入 / 1M',
      colOut: '输出 / 1M',
      colVendor: '厂商',
      more: '共 {count} 个模型，前往模型广场查看全部'
    },
    cta: {
      title: '今天就把模型接入切到一个入口',
      subtitle: '注册后即可创建密钥并查看全部模型价格。',
      primary: '免费开始',
      contact: '联系我们'
    },
    footer: {
      product: '产品',
      developer: '开发者',
      legal: '法律',
      terms: '服务条款',
      privacy: '隐私政策',
      rights: '保留所有权利。'
    }
  },

  // Common
}
