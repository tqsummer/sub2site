<template>
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
        <!-- 已登录进控制台，未登录去登录。两态到此为止，
             所有公开页一致——顶栏在页面间切换时不该变形。 -->
        <router-link v-if="isAuthenticated" to="/dashboard" class="btn btn-primary btn-sm">
          {{ t('landingV2.nav.console') }}
        </router-link>
        <router-link
          v-else
          :to="{ path: '/login', query: { redirect: loginRedirect } }"
          class="btn btn-primary btn-sm"
        >
          {{ t('landingV2.nav.login') }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * 公开页（未登录也能访问）统一顶栏：落地页、模型广场、使用文档共用。
 *
 * originally 落地页有自己的 header，模型广场用的是另一个只有 logo + 登录按钮的
 * 简化版（原 modelPlaza/PlazaNavBar）。两者高度、内边距、右侧按钮都不同，
 * 页面间跳转时顶栏会明显变形。统一成这一个组件。
 *
 * 样式类 .lp-nav / .lp-wrap / .lp-navlink / .lp-logo-fallback 原本是 LandingView
 * 的 scoped 样式，现已提到 style.css 的 @layer components——它们不再只属于落地页。
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { sanitizeUrl } from '@/utils/url'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { applyTheme, isDarkTheme } from '@/utils/theme'

const { t } = useI18n()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const settings = computed(() => appStore.cachedPublicSettings)

// 兜底不写品牌名：静态托管下配置要等接口返回，写死会先闪出错误品牌。
const siteName = computed(() => settings.value?.site_name || appStore.siteName || '')
const siteLogo = computed(() =>
  sanitizeUrl(settings.value?.site_logo || appStore.siteLogo || '', {
    allowRelative: true,
    allowDataUrl: true,
  })
)
const brandInitial = computed(() => siteName.value.trim().charAt(0).toUpperCase() || 'A')

const docUrl = computed(() => sanitizeUrl(settings.value?.doc_url || appStore.docUrl || ''))

const isAuthenticated = computed(() => authStore.isAuthenticated)

const showModelPlaza = computed(() => {
  if (!isFeatureFlagEnabled(FeatureFlags.modelPlaza)) return false
  const requiresAuth = settings.value?.model_plaza_require_auth === true
  return isAuthenticated.value || !requiresAuth
})

// 登录后回到用户原本在看的公开页，而不是写死某个页面。
const loginRedirect = computed(() => route.fullPath)

const isDark = ref(isDarkTheme())
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>
