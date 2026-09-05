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
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>
