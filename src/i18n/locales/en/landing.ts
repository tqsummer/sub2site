export default {
  batchImageGuide: {
    title: 'Batch Image Generation',
    description: 'Submit multiple prompts in one job and download the generated images when complete'
  },
  // Home Page
  home: {
    viewOnGithub: 'View on GitHub',
    viewDocs: 'View Documentation',
    docs: 'Docs',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    dashboard: 'Dashboard',
    login: 'Login',
    getStarted: 'Get Started',
    goToDashboard: 'Go to Dashboard',
    // User-focused value proposition
    heroSubtitle: 'One Key, All AI Models',
    heroDescription: 'No need to manage multiple subscriptions. Access Claude, GPT, Gemini and more with a single API key',
    tags: {
      subscriptionToApi: 'Subscription to API',
      stickySession: 'Session Persistence',
      realtimeBilling: 'Pay As You Go'
    },
    // Pain points section
    painPoints: {
      title: 'Sound Familiar?',
      items: {
        expensive: {
          title: 'High Subscription Costs',
          desc: 'Paying for multiple AI subscriptions that add up every month'
        },
        complex: {
          title: 'Account Chaos',
          desc: 'Managing scattered accounts and API keys across different platforms'
        },
        unstable: {
          title: 'Service Interruptions',
          desc: 'Single accounts hitting rate limits and disrupting your workflow'
        },
        noControl: {
          title: 'No Usage Control',
          desc: "Can't track where your money goes or limit team member usage"
        }
      }
    },
    // Solutions section
    solutions: {
      title: 'We Solve These Problems',
      subtitle: 'Three simple steps to stress-free AI access'
    },
    features: {
      unifiedGateway: 'One-Click Access',
      unifiedGatewayDesc: 'Get a single API key to call all connected AI models. No separate applications needed.',
      multiAccount: 'Always Reliable',
      multiAccountDesc: 'Smart routing across multiple upstream accounts with automatic failover. Say goodbye to errors.',
      balanceQuota: 'Pay What You Use',
      balanceQuotaDesc: 'Usage-based billing with quota limits. Full visibility into team consumption.'
    },
    // Comparison section
    comparison: {
      title: 'Why Choose Us?',
      headers: {
        feature: 'Comparison',
        official: 'Official Subscriptions',
        us: 'Our Platform'
      },
      items: {
        pricing: {
          feature: 'Pricing',
          official: 'Fixed monthly fee, pay even if unused',
          us: 'Pay only for what you use'
        },
        models: {
          feature: 'Model Selection',
          official: 'Single provider only',
          us: 'Switch between models freely'
        },
        management: {
          feature: 'Account Management',
          official: 'Manage each service separately',
          us: 'Unified key, one dashboard'
        },
        stability: {
          feature: 'Stability',
          official: 'Single account rate limits',
          us: 'Multi-account pool, auto-failover'
        },
        control: {
          feature: 'Usage Control',
          official: 'Not available',
          us: 'Quotas & detailed analytics'
        }
      }
    },
    providers: {
      title: 'Supported AI Models',
      description: 'One API, Multiple Choices',
      supported: 'Supported',
      soon: 'Soon',
      claude: 'Claude',
      gemini: 'Gemini',
      antigravity: 'Antigravity',
      more: 'More'
    },
    // CTA section
    cta: {
      title: 'Ready to Get Started?',
      description: 'Sign up now and get free trial credits to experience seamless AI access',
      button: 'Sign Up Free'
    },
    footer: {
      allRightsReserved: 'All rights reserved.'
    }
  },

  // Key Usage Query Page
  keyUsage: {
    title: 'API Key Usage',
    subtitle: 'Enter your API Key to view real-time spending and usage status',
    placeholder: 'sk-ant-mirror-xxxxxxxxxxxx',
    query: 'Query',
    querying: 'Querying...',
    privacyNote: 'Your Key is processed locally in the browser and will not be stored',
    dateRange: 'Date Range:',
    dateRangeToday: 'Today',
    dateRange7d: '7 Days',
    dateRange30d: '30 Days',
    dateRange90d: '90 Days',
    dateRangeCustom: 'Custom',
    apply: 'Apply',
    used: 'Used',
    detailInfo: 'Detail Information',
    tokenStats: 'Token Statistics',
    dailyDetail: 'Daily Detail',
    modelStats: 'Model Usage Statistics',
    // Table headers
    date: 'Date',
    model: 'Model',
    requests: 'Requests',
    inputTokens: 'Input Tokens',
    outputTokens: 'Output Tokens',
    cacheCreationTokens: 'Cache Creation',
    cacheReadTokens: 'Cache Read',
    cacheWriteTokens: 'Cache Write',
    totalTokens: 'Total Tokens',
    cost: 'Cost',
    // Status
    quotaMode: 'Key Quota Mode',
    walletBalance: 'Wallet Balance',
    // Ring card titles
    totalQuota: 'Total Quota',
    limit5h: '5-Hour Limit',
    limitDaily: 'Daily Limit',
    limit7d: '7-Day Limit',
    limitWeekly: 'Weekly Limit',
    limitMonthly: 'Monthly Limit',
    // Detail rows
    remainingQuota: 'Remaining Quota',
    expiresAt: 'Expires At',
    todayExpires: '(expires today)',
    daysLeft: '({days} days)',
    usedQuota: 'Used Quota',
    resetNow: 'Resetting soon',
    subscriptionType: 'Subscription Type',
    subscriptionExpires: 'Subscription Expires',
    // Usage stat cells
    todayRequests: 'Today Requests',
    todayInputTokens: 'Today Input',
    todayOutputTokens: 'Today Output',
    todayTokens: 'Today Tokens',
    todayCacheCreation: 'Today Cache Creation',
    todayCacheRead: 'Today Cache Read',
    todayCost: 'Today Cost',
    rpmTpm: 'RPM / TPM',
    totalRequests: 'Total Requests',
    totalInputTokens: 'Total Input',
    totalOutputTokens: 'Total Output',
    totalTokensLabel: 'Total Tokens',
    totalCacheCreation: 'Total Cache Creation',
    totalCacheRead: 'Total Cache Read',
    totalCost: 'Total Cost',
    avgDuration: 'Avg Duration',
    // Messages
    enterApiKey: 'Please enter an API Key',
    querySuccess: 'Query successful',
    queryFailed: 'Query failed',
    queryFailedRetry: 'Query failed, please try again later',
    noDailyUsage: 'No daily usage data',
  },

  // Setup Wizard
  setup: {
    title: 'Setup',
    description: 'Configure your instance',
    database: {
      title: 'Database Configuration',
      description: 'Connect to your PostgreSQL database',
      host: 'Host',
      port: 'Port',
      username: 'Username',
      password: 'Password',
      databaseName: 'Database Name',
      sslMode: 'SSL Mode',
      passwordPlaceholder: 'Password',
      ssl: {
        disable: 'Disable',
        require: 'Require',
        verifyCa: 'Verify CA',
        verifyFull: 'Verify Full'
      }
    },
    redis: {
      title: 'Redis Configuration',
      description: 'Connect to your Redis server',
      host: 'Host',
      port: 'Port',
      username: 'Username (optional)',
      password: 'Password (optional)',
      database: 'Database',
      usernamePlaceholder: 'Leave empty for default user',
      passwordPlaceholder: 'Password',
      enableTls: 'Enable TLS',
      enableTlsHint: 'Use TLS when connecting to Redis (public CA certs)'
    },
    admin: {
      title: 'Admin Account',
      description: 'Create your administrator account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      passwordPlaceholder: 'Min 8 characters',
      confirmPasswordPlaceholder: 'Confirm password',
      passwordMismatch: 'Passwords do not match'
    },
    ready: {
      title: 'Ready to Install',
      description: 'Review your configuration and complete setup',
      database: 'Database',
      redis: 'Redis',
      adminEmail: 'Admin Email'
    },
    status: {
      testing: 'Testing...',
      success: 'Connection Successful',
      testConnection: 'Test Connection',
      installing: 'Installing...',
      completeInstallation: 'Complete Installation',
      completed: 'Installation completed!',
      redirecting: 'Redirecting to login page...',
      restarting: 'Service is restarting, please wait...',
      timeout: 'Service restart is taking longer than expected. Please refresh the page manually.'
    }
  },


  // ===== New landing page (LandingView.vue) =====
  // Copy principle: only claim capabilities that exist in the system. The vendor list and model
  // prices come from the public /model-plaza endpoint; when no upstream is connected those blocks
  // are not rendered at all, so the page never over-promises.
  landingV2: {
    nav: {
      modelPlaza: 'Model Plaza',
      keyUsage: 'Key Usage',
      docs: 'Docs',
      login: 'Sign in',
      console: 'Console',
      start: 'Get started',
      toggleTheme: 'Toggle theme'
    },
    hero: {
      chip: 'OpenAI and Anthropic protocol compatible',
      title: 'Routed by model name. One key, no switching.',
      subtitle: 'The same key forwards each request to the matching upstream based on the model name. Change only base_url; protocol and model names stay as they are.',
      primary: 'Get started',
      secondary: 'Models and pricing',
      note1: 'No card required',
      note2: 'Five minutes to integrate',
      demoRouted: 'Routed',
      demoTokens: 'Metered'
    },
    vendors: {
      title: 'Connected model providers',
      hint: 'Read live from Model Plaza; reflects the upstreams actually connected',
      // Wording when no upstream is connected yet: say what the gateway *supports*,
      // not what it currently serves. The list comes from the real platform enum.
      supportedTitle: 'Model providers we support',
      supportedHint: 'Once upstreams are connected, this shows the providers actually callable here'
    },
    billing: {
      eyebrow: 'Billing modes',
      title: 'Two ways to pay, matched to how your team uses the API',
      subtitle: 'Both can run together: subscription quota is consumed first, and overflow falls through to the pay-as-you-go balance.',
      payg: {
        name: 'Pay as you go',
        en: 'Pay as you go',
        desc: 'Balance is deducted per token, in real time.',
        f1: 'Per-key quota ceiling',
        f2: 'Per-key allowlist of callable models',
        f3: 'Usage attributed by key, model and time',
        fit: 'Fits teams with volatile usage, mixed models, and a need for fine-grained cost attribution.'
      },
      sub: {
        name: 'Subscription',
        en: 'Subscription',
        desc: 'Buy quota per period; usage is converted at the group rate.',
        f1: 'Fixed budget, predictable spend',
        f2: 'Daily / weekly / monthly caps',
        f3: 'Falls through to pay-as-you-go when the quota runs out',
        fit: 'Fits product teams and individual developers with steady usage and a hard budget cap.'
      },
      footnote: 'Sign in and open Top-up / Subscription to see current prices and available plans.'
    },
    capability: {
      eyebrow: 'Core capabilities',
      title: 'Infrastructure-grade stability and visibility',
      c1: { title: 'Multi-account scheduling', desc: 'A group can hold many upstream accounts and requests are distributed automatically, so one throttled account does not take the group down.' },
      c2: { title: 'Automatic failover', desc: 'On upstream failure traffic moves to another account in the same group, with no client-side retry.' },
      c3: { title: 'Per-token metering', desc: 'Input, output and cache tokens are recorded separately for every call and stay traceable.' },
      c4: { title: 'Per-key controls', desc: 'Each key carries its own quota, concurrency, rate windows and model allowlist.' }
    },
    devx: {
      eyebrow: 'Developer experience',
      title: 'Change one line of base_url, nothing else',
      subtitle: 'Compatible with the OpenAI and Anthropic protocols, so existing SDKs and tooling switch over directly.',
      s1: { n: '01', title: 'Sign up and create an API key', desc: 'Set its name, quota and the models it may call.' },
      s2: { n: '02', title: 'Replace base_url and api_key', desc: 'Protocol unchanged; keep each vendor original model names.' },
      s3: { n: '03', title: 'Track usage and cost in the console', desc: 'Per-call records, attributed by key, model and time.' },
      copy: 'Copy',
      copied: 'Copied'
    },
    pricing: {
      eyebrow: 'Transparent pricing',
      title: 'Every model price is public, so you can compare before signing up',
      subtitle: 'Model Plaza lists input and output unit prices plus rate multipliers for each model, filterable by provider.',
      cta: 'Open Model Plaza',
      colModel: 'Model',
      colIn: 'Input / 1M',
      colOut: 'Output / 1M',
      colVendor: 'Provider',
      more: '{count} models in total; open Model Plaza to see them all'
    },
    cta: {
      title: 'Move your model access behind one endpoint today',
      subtitle: 'Create a key right after signing up and see every model price.',
      primary: 'Get started',
      contact: 'Contact us'
    },
    footer: {
      product: 'Product',
      developer: 'Developers',
      legal: 'Legal',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      rights: 'All rights reserved.'
    }
  },

  // Common
}
