<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[9999] space-y-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <!--
          结构按设计稿的 Toast 走：纯表面色 + 阴影分层，没有边框。
          状态只由左侧 8px 圆点表达，不再用 4px 粗左边框——
          那是 sub2api 沿用的旧样式，与「卡片用边框分层，Toast 用阴影」相悖。

          role 按语义分：错误用 alert（打断读屏），其余用 status（不打断）。
        -->
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          class="pointer-events-auto flex min-w-[320px] max-w-md items-start gap-3 rounded-token bg-surface p-3 shadow-md"
        >
          <!-- 状态点：垂直对齐首行文字，而不是卡片顶部 -->
          <span
            aria-hidden="true"
            class="mt-[6px] h-2 w-2 flex-none rounded-full"
            :class="dotClass(toast.type)"
          ></span>

          <div class="min-w-0 flex-1">
            <p v-if="toast.title" class="text-content text-[13px] font-medium">
              {{ toast.title }}
            </p>
            <p
              class="text-[13px] leading-relaxed"
              :class="toast.title ? 'text-content-2 mt-0.5' : 'text-content'"
            >
              {{ toast.message }}
            </p>
          </div>

          <button
            type="button"
            class="toast-close -m-1 flex-none rounded p-1 leading-none transition-colors"
            :aria-label="t('common.close')"
            @click="removeToast(toast.id)"
          >
            <Icon name="x" size="sm" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'

const { t } = useI18n()
const appStore = useAppStore()

const toasts = computed(() => appStore.toasts)

/** 状态点颜色。取 Tailwind 生成的语义色类，明暗随 token 自动切换。 */
const dotClass = (type: string): string => {
  const map: Record<string, string> = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-brand'
  }
  return map[type] || map.info
}

const removeToast = (id: string) => {
  appStore.hideToast(id)
}
</script>

<style scoped>
/* hover 态写在这里：fg-* 是 @layer components 里的普通类，不带 hover: 变体。 */
.toast-close {
  color: var(--color-text-3);
}

.toast-close:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
</style>
