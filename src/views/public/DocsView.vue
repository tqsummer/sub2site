<template>
  <!-- 外壳与模型广场保持一致：同样的底色、同样的容器宽度与内边距。
       两个公开页之间跳转不该有位移感。 -->
  <div class="min-h-screen bg-surface-2">
    <PublicNavBar />
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div class="space-y-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-content sm:text-3xl">{{ t('docs.title') }}</h1>
          <p class="mt-1.5 text-sm text-content-2">{{ t('docs.description') }}</p>
        </div>

        <!-- 卡片样式沿用模型广场的 rounded-2xl / border-divider / shadow-card。
             注意不能加 overflow-hidden：任何祖先上的 overflow 非 visible 都会
             让内部的 position: sticky 失效，目录就吸不住了。 -->
        <div class="rounded-2xl border border-divider bg-surface shadow-card">
          <MarkdownDoc :source="content" variant="page" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 使用文档（公开页，无需登录）。
 *
 * 内容是仓库里的 Markdown（src/content/docs/*.md），改文档只改 .md，不碰本组件。
 * 之所以不用后台的「自定义页面」机制：那套内容存在 sub2api 容器的 data/pages/ 下、
 * 接口带 jwtAuth 必须登录才能读、菜单项也只出现在登录后的侧边栏——
 * 而这份文档的读者按定义还没登录。
 *
 * 品牌与地址不写死，渲染前用占位符替换，同一个镜像换部署方文档自动跟着变。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import PublicNavBar from '@/components/layout/PublicNavBar.vue'
import MarkdownDoc from '@/components/common/MarkdownDoc.vue'
import zhDoc from '@/content/docs/zh.md?raw'
import enDoc from '@/content/docs/en.md?raw'

const { t, locale } = useI18n()
const appStore = useAppStore()

const settings = computed(() => appStore.cachedPublicSettings)

/**
 * 接入地址的根形态：不带 /v1、不带尾斜杠。
 * Codex 要 `${baseUrl}/v1`，Claude Code 要 `${baseUrl}` 本身——文档里分别拼。
 * 后台没配 api_base_url 时回落到当前站点域名，总比露出空白强。
 */
const baseUrl = computed(() => {
  const configured = (settings.value?.api_base_url || '').trim()
  const raw = configured || (typeof window !== 'undefined' ? window.location.origin : '')
  return raw.replace(/\/v1\/?$/, '').replace(/\/+$/, '')
})

const brand = computed(() => settings.value?.site_name?.trim() || 'AI Gateway')

/**
 * TOML 的表名和环境变量名只允许字母数字下划线，站点名却可能是中文或带空格
 * （比如「云豆 AI」），直接拿来用会生成非法配置。所以规范化后再用，
 * 规范化后为空（纯中文名）就回落到 gateway。
 */
const providerKey = computed(() => {
  const normalized = brand.value.toLowerCase().replace(/[^a-z0-9]/g, '')
  return normalized || 'gateway'
})

const envKey = computed(() => `${providerKey.value.toUpperCase()}_API_KEY`)

const content = computed(() => {
  const raw = locale.value.startsWith('zh') ? zhDoc : enDoc
  const values: Record<string, string> = {
    brand: brand.value,
    baseUrl: baseUrl.value,
    providerKey: providerKey.value,
    envKey: envKey.value,
  }
  // 只替换已知占位符；未知的 {{x}} 原样保留，方便发现文档里的笔误
  return raw.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key] : match
  )
})
</script>
