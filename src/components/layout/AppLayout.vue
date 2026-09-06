<template>
  <!-- 底色走 token；设计稿是纯净底色，去掉了原先的 mesh 渐变装饰层 -->
  <div class="app-shell min-h-screen">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <!-- 左偏移必须与 .sidebar 的宽度一致：展开 260px、折叠 72px -->
    <div
      class="relative min-h-screen transition-all duration-300"
      :class="[sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]']"
    >
      <!-- Header -->
      <AppHeader />

      <!-- Main Content -->
      <!-- 设计稿内容区留白：移动端 12/16，桌面 24/20，底部留 40 给滚动尾部 -->
      <main class="px-3 pb-10 pt-4 md:px-6 md:pt-5">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)

// 新手引导不再自动弹出，且不再区分管理员。
//
// 原实现里自动弹出只对 role === 'admin' 生效，走的是「分组管理 / 账号池」
// 那套管理端引导。但 sub2site 已剥离管理端，那些页面和 [data-tour] 锚点
// 都不存在了——引导会指向找不到的元素，而且文案讲的是用户根本用不到的功能。
//
// 管理员在 sub2site 里看到的与普通用户完全一致，所以统一用 user_guide，
// 并关掉自动弹。用户仍可从帮助入口手动触发（replayTour 照常暴露）。
const { replayTour } = useOnboardingTour({
  storageKey: 'user_guide',
  autoStart: false
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>
