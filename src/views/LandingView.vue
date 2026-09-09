<template>
  <div data-testid="default-home" class="landing min-h-screen">
    <!-- ══ 顶部导航 ══ -->
    <header class="lp-nav">
      <div class="lp-wrap flex h-14 items-center gap-4">
        <router-link to="/home" class="flex shrink-0 items-center gap-2">
          <img
            v-if="siteLogo"
            :src="siteLogo"
            :alt="siteName"
            class="block h-7 w-auto max-w-[112px] object-contain"
          />
          <span v-else aria-hidden="true" class="lp-logo-fallback">{{ brandInitial }}</span>
          <span class="truncate text-[15px] font-medium">{{ siteName }}</span>
        </router-link>

        <!-- 顶部导航只放产品主入口。
             「密钥查询」是持有 key 的人用的排障工具，不是主功能，
             放这里会让首次访客误以为它是核心；只保留在页脚。 -->
        <nav class="ml-4 hidden items-center gap-1 md:flex">
          <router-link v-if="showModelPlaza" to="/model-plaza" class="lp-navlink">
            {{ t('landingV2.nav.modelPlaza') }}
          </router-link>
          <!-- 后台配了 doc_url 就跳外站文档，否则走站内 /docs -->
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="lp-navlink">
            {{ t('landingV2.nav.docs') }}
          </a>
          <router-link v-else to="/docs" class="lp-navlink">
            {{ t('landingV2.nav.docs') }}
          </router-link>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <button
            type="button"
            class="btn btn-ghost btn-icon"
            :aria-label="t('landingV2.nav.toggleTheme')"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" size="sm" />
          </button>
          <template v-if="isAuthenticated">
            <router-link to="/dashboard" class="btn btn-primary btn-sm">
              {{ t('landingV2.nav.console') }}
            </router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-ghost btn-sm hidden sm:inline-flex">
              {{ t('landingV2.nav.login') }}
            </router-link>
            <router-link to="/register" class="btn btn-primary btn-sm">
              {{ t('landingV2.nav.start') }}
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- ══ 首屏 ══ -->
    <section class="lp-wrap lp-pad">
      <div class="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div class="flex flex-col gap-5">
          <span class="lp-chip self-start">{{ t('landingV2.hero.chip') }}</span>
          <h1 class="lp-h1">{{ t('landingV2.hero.title') }}</h1>
          <p class="lp-lede">{{ t('landingV2.hero.subtitle') }}</p>
          <div class="flex flex-wrap items-center gap-3">
            <router-link :to="isAuthenticated ? '/dashboard' : '/register'" class="btn btn-primary btn-lg">
              {{ isAuthenticated ? t('landingV2.nav.console') : t('landingV2.hero.primary') }}
            </router-link>
            <router-link v-if="showModelPlaza" to="/model-plaza" class="btn btn-secondary btn-lg">
              {{ t('landingV2.hero.secondary') }}
            </router-link>
          </div>
          <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-3">
            <span>{{ t('landingV2.hero.note1') }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ t('landingV2.hero.note2') }}</span>
          </p>
        </div>

        <!-- 路由演示：这是本页的核心论点，用三条真实前缀规则说明 -->
        <div class="lp-demo" aria-hidden="true">
          <div class="lp-demo-bar">
            <span class="lp-dot" style="background: #ff5f57"></span>
            <span class="lp-dot" style="background: #febc2e"></span>
            <span class="lp-dot" style="background: #28c840"></span>
            <span class="ml-2 text-[11px] text-content-3">one api key</span>
          </div>
          <div class="lp-demo-body">
            <div v-for="row in routeDemo" :key="row.model" class="lp-demo-row">
              <code class="lp-demo-model">{{ row.model }}</code>
              <span class="lp-demo-arrow">→</span>
              <span class="lp-demo-target">
                <span class="lp-demo-dot" :style="{ background: row.color }"></span>
                {{ row.vendor }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ 厂商带 ══
         有上游接入时列实际可调用的厂商（口径「已接入」）；
         尚未接入时降级为本网关支持的平台（口径「支持接入」）。
         两种口径都成立，页面不会把没有的说成有。 -->
    <section class="lp-wrap lp-pad-sm">
      <div class="flex flex-col items-center gap-3 text-center">
        <p class="lp-eyebrow">
          {{ hasConnectedVendors ? t('landingV2.vendors.title') : t('landingV2.vendors.supportedTitle') }}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span
            v-for="v in displayVendors"
            :key="v.value"
            class="lp-vendor"
            :class="{ 'lp-vendor-muted': !hasConnectedVendors }"
          >
            <span class="lp-demo-dot" :style="{ background: v.color }"></span>
            {{ v.label }}
          </span>
        </div>
        <p class="text-xs text-content-3">
          {{ hasConnectedVendors ? t('landingV2.vendors.hint') : t('landingV2.vendors.supportedHint') }}
        </p>
      </div>
    </section>

    <!-- ══ 计费模式：只讲形态，不出金额、不出套餐、不出购买入口 ══ -->
    <section class="lp-wrap lp-pad">
      <div class="mb-8 flex max-w-[640px] flex-col gap-3">
        <p class="lp-eyebrow">{{ t('landingV2.billing.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('landingV2.billing.title') }}</h2>
        <p class="lp-lede">{{ t('landingV2.billing.subtitle') }}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <article v-for="m in billingModes" :key="m.key" class="card flex flex-col gap-4 p-6">
          <div class="flex items-baseline gap-2">
            <h3 class="text-base font-medium">{{ m.name }}</h3>
            <span class="text-xs text-content-3">{{ m.en }}</span>
          </div>
          <p class="text-[13px] text-content-2">{{ m.desc }}</p>
          <ul class="flex flex-col gap-2">
            <li v-for="f in m.features" :key="f" class="flex items-start gap-2 text-[13px] text-content-2">
              <span aria-hidden="true" class="lp-tick">—</span>
              <span>{{ f }}</span>
            </li>
          </ul>
          <p class="mt-auto border-t pt-4 text-[13px] text-content-2">{{ m.fit }}</p>
        </article>
      </div>
      <p class="mt-4 text-center text-xs text-content-3">{{ t('landingV2.billing.footnote') }}</p>
    </section>

    <!-- ══ 核心能力 ══ -->
    <section class="lp-band">
      <div class="lp-wrap lp-pad">
        <div class="mb-8 flex max-w-[640px] flex-col gap-3">
          <p class="lp-eyebrow">{{ t('landingV2.capability.eyebrow') }}</p>
          <h2 class="lp-h2">{{ t('landingV2.capability.title') }}</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="c in capabilities" :key="c.key" class="card flex flex-col gap-2 p-5">
            <span class="stat-icon stat-icon-primary mb-1"><Icon :name="c.icon" size="sm" /></span>
            <h3 class="text-[15px] font-medium">{{ c.title }}</h3>
            <p class="text-[13px] leading-relaxed text-content-2">{{ c.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ══ 开发者接入 ══ -->
    <section class="lp-wrap lp-pad">
      <div class="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <p class="lp-eyebrow">{{ t('landingV2.devx.eyebrow') }}</p>
            <h2 class="lp-h2">{{ t('landingV2.devx.title') }}</h2>
            <p class="lp-lede">{{ t('landingV2.devx.subtitle') }}</p>
          </div>
          <ol class="flex flex-col gap-4">
            <li v-for="s in steps" :key="s.n" class="flex gap-3">
              <span class="lp-step">{{ s.n }}</span>
              <span class="flex flex-col gap-0.5">
                <span class="text-[14px] font-medium">{{ s.title }}</span>
                <span class="text-[13px] text-content-2">{{ s.desc }}</span>
              </span>
            </li>
          </ol>
        </div>
        <div class="lp-code">
          <div class="lp-code-bar">
            <span class="text-[11px] text-content-3">bash</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="copySnippet">
              {{ copied ? t('landingV2.devx.copied') : t('landingV2.devx.copy') }}
            </button>
          </div>
          <pre class="lp-code-body"><code>{{ snippet }}</code></pre>
        </div>
      </div>
    </section>

    <!-- ══ 模型价格：无数据整块不渲染 ══ -->
    <section v-if="priceRows.length" class="lp-band">
      <div class="lp-wrap lp-pad">
        <div class="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div class="flex flex-col gap-3">
            <p class="lp-eyebrow">{{ t('landingV2.pricing.eyebrow') }}</p>
            <h2 class="lp-h2">{{ t('landingV2.pricing.title') }}</h2>
            <p class="lp-lede">{{ t('landingV2.pricing.subtitle') }}</p>
            <router-link v-if="showModelPlaza" to="/model-plaza" class="self-start text-[13px] font-medium text-brand-text hover:underline">
              {{ t('landingV2.pricing.cta') }}
            </router-link>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">{{ t('landingV2.pricing.colModel') }}</th>
                  <th scope="col">{{ t('landingV2.pricing.colVendor') }}</th>
                  <th scope="col" class="num">{{ t('landingV2.pricing.colIn') }}</th>
                  <th scope="col" class="num">{{ t('landingV2.pricing.colOut') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in priceRows" :key="p.key">
                  <td class="font-medium">{{ p.model }}</td>
                  <td class="text-content-2">{{ p.vendor }}</td>
                  <td class="num">{{ p.input }}</td>
                  <td class="num">{{ p.output }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-if="totalModels > priceRows.length" class="mt-3 text-center text-xs text-content-3">
          {{ t('landingV2.pricing.more', { count: totalModels }) }}
        </p>
      </div>
    </section>

    <!-- ══ 结尾 CTA ══ -->
    <section class="lp-wrap lp-pad">
      <div class="card flex flex-col items-center gap-4 p-10 text-center">
        <h2 class="lp-h2">{{ t('landingV2.cta.title') }}</h2>
        <p class="lp-lede max-w-[520px]">{{ t('landingV2.cta.subtitle') }}</p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <router-link :to="isAuthenticated ? '/dashboard' : '/register'" class="btn btn-primary btn-lg">
            {{ isAuthenticated ? t('landingV2.nav.console') : t('landingV2.cta.primary') }}
          </router-link>
          <a v-if="contactHref" :href="contactHref" class="btn btn-secondary btn-lg">
            {{ t('landingV2.cta.contact') }}
          </a>
        </div>
      </div>
    </section>

    <!-- ══ 页脚：只列真实存在的页面 ══ -->
    <footer class="lp-footer">
      <div class="lp-wrap lp-pad-sm">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div class="flex flex-col gap-2">
            <span class="flex items-center gap-2">
              <img v-if="siteLogo" :src="siteLogo" :alt="siteName" class="block h-6 w-auto max-w-[96px] object-contain" />
              <span v-else aria-hidden="true" class="lp-logo-fallback">{{ brandInitial }}</span>
              <span class="text-[14px] font-medium">{{ siteName }}</span>
            </span>
            <p v-if="siteSubtitle" class="text-xs text-content-3">{{ siteSubtitle }}</p>
          </div>
          <div v-for="col in footerCols" :key="col.title" class="flex flex-col gap-2">
            <span class="text-xs font-medium uppercase tracking-wider text-content-3">{{ col.title }}</span>
            <!-- 站外链接用 <a>，站内用 <router-link>。这里不用动态 <component :is>：
                 传字符串组件名依赖全局注册，测试里 RouterLink 被 stub 后会解析失败。 -->
            <template v-for="l in col.links" :key="l.label">
              <a
                v-if="l.external"
                :href="l.to"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[13px] text-content-2 hover:text-content"
              >
                {{ l.label }}
              </a>
              <router-link v-else :to="l.to" class="text-[13px] text-content-2 hover:text-content">
                {{ l.label }}
              </router-link>
            </template>
          </div>
        </div>
        <p class="mt-8 border-t pt-6 text-center text-xs text-content-3">
          © {{ currentYear }} {{ siteName }}. {{ t('landingV2.footer.rights') }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { getModelPlaza, type ModelPlazaResponse } from '@/api/modelPlaza'
import { CONCRETE_PLATFORM_OPTIONS } from '@/constants/platforms'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { applyTheme, isDarkTheme } from '@/utils/theme'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

/* ── 站点配置：全部动态，无硬编码品牌 ── */
const settings = computed(() => appStore.cachedPublicSettings)
const siteName = computed(() => settings.value?.site_name || appStore.siteName || '')
const siteSubtitle = computed(() => settings.value?.site_subtitle || '')
const siteLogo = computed(() =>
  sanitizeUrl(settings.value?.site_logo || appStore.siteLogo || '', {
    allowRelative: true,
    allowDataUrl: true
  })
)
const docUrl = computed(() => sanitizeUrl(settings.value?.doc_url || appStore.docUrl || ''))
const brandInitial = computed(() => siteName.value.trim().charAt(0).toUpperCase() || 'A')
const currentYear = computed(() => new Date().getFullYear())
const isAuthenticated = computed(() => authStore.isAuthenticated)

/**
 * API 端点用于代码示例。后台配了 api_base_url 就用它，
 * 否则退回当前站点自身的 origin —— sub2site 是同源反代，这个值总是对的。
 */
const apiBase = computed(() => {
  const configured = sanitizeUrl(settings.value?.api_base_url || appStore.apiBaseUrl || '')
  return (configured || window.location.origin).replace(/\/+$/, '')
})

/* 模型广场可能被开关关闭，或要求登录后才可见 */
const showModelPlaza = computed(() => {
  if (!isFeatureFlagEnabled(FeatureFlags.modelPlaza)) return false
  const requiresAuth = settings.value?.model_plaza_require_auth === true
  return isAuthenticated.value || !requiresAuth
})

/* 联系方式来自后台 contact_info：像邮箱就做成 mailto，像链接就直接跳 */
const contactHref = computed(() => {
  const raw = (settings.value?.contact_info || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return sanitizeUrl(raw)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return `mailto:${raw}`
  return ''
})

/* ── 主题 ── */
const isDark = ref(isDarkTheme())
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

/* ── 平台展示元数据 ── */
const PLATFORM_COLORS: Record<string, string> = {
  anthropic: 'var(--platform-claude)',
  openai: 'var(--platform-openai)',
  gemini: 'var(--platform-gemini)',
  antigravity: 'var(--platform-antigravity)',
  grok: 'var(--platform-grok)',
  kimi: 'var(--chart-4)',
  zhipu: 'var(--chart-5)',
  deepseek: 'var(--chart-3)'
}
const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  CONCRETE_PLATFORM_OPTIONS.map((p) => [p.value, p.label])
)

/**
 * 首屏的路由演示。这三条对应后端内置探测器里的真实前缀规则
 * （composite_platform.go 按 claude- / gpt- / gemini- 等前缀判定目标平台），
 * 不是编出来的示意。
 */
const routeDemo = computed(() => [
  { model: 'claude-sonnet-4', vendor: 'Anthropic', color: PLATFORM_COLORS.anthropic },
  { model: 'gpt-4o', vendor: 'OpenAI', color: PLATFORM_COLORS.openai },
  { model: 'gemini-2.5-pro', vendor: 'Gemini', color: PLATFORM_COLORS.gemini }
])

/* ── 计费模式：纯介绍，不含金额与购买入口 ── */
const billingModes = computed(() => [
  {
    key: 'payg',
    name: t('landingV2.billing.payg.name'),
    en: t('landingV2.billing.payg.en'),
    desc: t('landingV2.billing.payg.desc'),
    features: [
      t('landingV2.billing.payg.f1'),
      t('landingV2.billing.payg.f2'),
      t('landingV2.billing.payg.f3')
    ],
    fit: t('landingV2.billing.payg.fit')
  },
  {
    key: 'sub',
    name: t('landingV2.billing.sub.name'),
    en: t('landingV2.billing.sub.en'),
    desc: t('landingV2.billing.sub.desc'),
    features: [
      t('landingV2.billing.sub.f1'),
      t('landingV2.billing.sub.f2'),
      t('landingV2.billing.sub.f3')
    ],
    fit: t('landingV2.billing.sub.fit')
  }
])

// icon 用 as const，否则会被推断成宽泛的 string，
// 与 Icon 组件的 `keyof typeof icons` 对不上。
const capabilities = computed(() => [
  { key: 'c1', icon: 'server', title: t('landingV2.capability.c1.title'), desc: t('landingV2.capability.c1.desc') },
  { key: 'c2', icon: 'refresh', title: t('landingV2.capability.c2.title'), desc: t('landingV2.capability.c2.desc') },
  { key: 'c3', icon: 'chart', title: t('landingV2.capability.c3.title'), desc: t('landingV2.capability.c3.desc') },
  { key: 'c4', icon: 'key', title: t('landingV2.capability.c4.title'), desc: t('landingV2.capability.c4.desc') }
] as const)

const steps = computed(() => [
  { n: t('landingV2.devx.s1.n'), title: t('landingV2.devx.s1.title'), desc: t('landingV2.devx.s1.desc') },
  { n: t('landingV2.devx.s2.n'), title: t('landingV2.devx.s2.title'), desc: t('landingV2.devx.s2.desc') },
  { n: t('landingV2.devx.s3.n'), title: t('landingV2.devx.s3.title'), desc: t('landingV2.devx.s3.desc') }
])

const snippet = computed(
  () => `curl ${apiBase.value}/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`
)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
async function copySnippet() {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    // 剪贴板不可用（非安全上下文 / 权限被拒）时静默失败，用户仍可手动选中复制
  }
}

/* ── 模型广场数据：厂商带与价格表都由它驱动，取不到就整块不渲染 ── */
const plaza = ref<ModelPlazaResponse | null>(null)

function decorate(p: { value: string; label: string }) {
  return {
    value: p.value,
    label: p.label,
    color: PLATFORM_COLORS[p.value] || 'var(--color-text-3)'
  }
}

/** 实际有模型可调用的厂商，由模型广场数据推出 */
const vendors = computed(() => {
  const seen = new Set<string>()
  for (const g of plaza.value?.groups ?? []) {
    for (const m of g.models ?? []) {
      if (m.platform) seen.add(m.platform)
    }
  }
  return CONCRETE_PLATFORM_OPTIONS.filter((p) => seen.has(p.value)).map(decorate)
})

const hasConnectedVendors = computed(() => vendors.value.length > 0)

/**
 * 展示用列表：接入了就显示实际厂商，没接入就退回本网关支持的平台枚举。
 * 后者不是占位图，是代码里真实支持的 8 个平台，配合「支持接入」的标题成立。
 */
const displayVendors = computed(() =>
  hasConnectedVendors.value ? vendors.value : CONCRETE_PLATFORM_OPTIONS.map(decorate)
)

/** USD per token → 每百万 token 的展示价 */
function perMillion(v: number | null | undefined): string {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return '—'
  const n = v * 1_000_000
  return `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`
}

const allModels = computed(() => {
  const rows: { key: string; model: string; vendor: string; input: string; output: string }[] = []
  const seen = new Set<string>()
  for (const g of plaza.value?.groups ?? []) {
    for (const m of g.models ?? []) {
      if (!m.name || seen.has(m.name)) continue
      seen.add(m.name)
      rows.push({
        key: m.name,
        model: m.name,
        vendor: PLATFORM_LABELS[m.platform] || m.platform,
        input: perMillion(m.pricing?.input_price),
        output: perMillion(m.pricing?.output_price)
      })
    }
  }
  return rows
})

const totalModels = computed(() => allModels.value.length)
/** 首页只做预览，完整列表在模型广场 */
const priceRows = computed(() => allModels.value.slice(0, 6))

/**
 * 页脚只列当前工程里真实存在、且未登录也能打开的页面。
 * 设计稿原稿有「API 参考」「SDK 示例」「发票与合规」三个链接，
 * 系统里没有对应页面，已去掉；「渠道状态」需要登录（/monitor 是
 * requiresAuth 路由），也不放在公开页脚里。
 */
const footerCols = computed(() => {
  const product: { label: string; to: string; external?: boolean }[] = []
  if (showModelPlaza.value) {
    product.push({ label: t('landingV2.nav.modelPlaza'), to: '/model-plaza' })
  }
  product.push({ label: t('landingV2.nav.keyUsage'), to: '/key-usage' })

  // 文档入口始终存在：后台配了 doc_url 就跳外站，否则用站内的 /docs。
  // 以前 doc_url 为空时整个入口隐藏，等于默认没有文档可看。
  const developer: { label: string; to: string; external?: boolean }[] = [
    docUrl.value
      ? { label: t('landingV2.nav.docs'), to: docUrl.value, external: true }
      : { label: t('landingV2.nav.docs'), to: '/docs' }
  ]

  const cols = [{ title: t('landingV2.footer.product'), links: product }]
  if (developer.length) {
    cols.push({ title: t('landingV2.footer.developer'), links: developer })
  }

  // 法律文档的 id 与标题由后台在 login_agreement_documents 里配置，
  // 不是固定的 terms / privacy，所以按实际配置渲染；没配就不出这一栏。
  const legal = (settings.value?.login_agreement_documents ?? [])
    .filter((doc) => doc?.id && doc?.title)
    .map((doc) => ({ label: doc.title, to: `/legal/${doc.id}` }))
  if (legal.length) {
    cols.push({ title: t('landingV2.footer.legal'), links: legal })
  }
  return cols
})

onMounted(async () => {
  void appStore.fetchPublicSettings()
  try {
    plaza.value = await getModelPlaza()
  } catch {
    // 模型广场关闭或不可达时保持 null，厂商带与价格表自动不渲染
  }
})
</script>

<style scoped>
.landing {
  background: var(--color-bg);
  color: var(--color-text);
}

.lp-wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

.lp-pad {
  padding-top: 64px;
  padding-bottom: 64px;
}

.lp-pad-sm {
  padding-top: 40px;
  padding-bottom: 40px;
}

/* 交替色带把长页面分段，避免整页一个平面 */
.lp-band {
  background: var(--color-surface-2);
  border-top: 1px solid var(--color-divider);
  border-bottom: 1px solid var(--color-divider);
}

.lp-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-divider);
}

.lp-navlink {
  padding: 0 10px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-2);
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}

.lp-navlink:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.lp-logo-fallback {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 14px;
  font-weight: 600;
}

.lp-h1 {
  font-size: clamp(32px, 4.4vw, 52px);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.lp-h2 {
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.lp-lede {
  font-size: 15px;
  line-height: 1.65;
  color: var(--color-text-2);
}

.lp-eyebrow {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-text);
}

.lp-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  border-radius: 13px;
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
  font-size: 12px;
  font-weight: 500;
}

.lp-tick {
  color: var(--color-text-3);
  line-height: 1.6;
  flex: none;
}

.lp-step {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--radius-sm);
  background: var(--color-surface-3);
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.lp-vendor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border-radius: 17px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  font-size: 13px;
  font-weight: 500;
}

/* 「支持接入」态：弱化处理，与「已接入」在视觉上可区分，
   避免读者把可支持的厂商误读成当前就能调用的。 */
.lp-vendor-muted {
  background: transparent;
  color: var(--color-text-2);
  font-weight: 400;
}

.lp-vendor-muted .lp-demo-dot {
  opacity: 0.55;
}

/* ── 首屏路由演示 ── */
.lp-demo {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.lp-demo-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-surface-2);
}

.lp-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}

.lp-demo-body {
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.lp-demo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
}

.lp-demo-row + .lp-demo-row {
  border-top: 1px solid var(--color-divider);
}

.lp-demo-model {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lp-demo-arrow {
  color: var(--color-text-3);
  flex: none;
}

.lp-demo-target {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  flex: none;
}

.lp-demo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

/* ── 代码块 ── */
.lp-code {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.lp-code-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-surface-2);
}

.lp-code-body {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--color-text-2);
}

.lp-footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-divider);
}

@media (max-width: 640px) {
  .lp-wrap {
    padding-left: 16px;
    padding-right: 16px;
  }

  .lp-pad {
    padding-top: 44px;
    padding-bottom: 44px;
  }
}
</style>
