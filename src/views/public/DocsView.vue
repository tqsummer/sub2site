<template>
  <div class="flex min-h-screen flex-col bg-app">
    <PublicNavBar />
    <main class="flex-1 overflow-hidden">
      <MarkdownDoc :source="content" />
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

const { locale } = useI18n()
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
