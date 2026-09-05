<template>
  <span
    class="badge"
    :class="statusClass"
  >
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OrderStatus } from '@/types/payment'

const props = defineProps<{
  status: OrderStatus
}>()

const { t } = useI18n()

// 状态色映射到语义 badge 类，明暗自动跟随设计 token。
// 退款系列（orange/purple）在 token 里没有对应语义色 —— 它既不是成功也不是失败，
// 是一条独立的流程分支，沿用 badge-warning / badge-purple 区分，不新造语义。
const statusMap: Record<OrderStatus, { key: string; class: string }> = {
  PENDING: { key: 'payment.status.pending', class: 'badge-warning' },
  PAID: { key: 'payment.status.paid', class: 'badge-primary' },
  RECHARGING: { key: 'payment.status.recharging', class: 'badge-primary' },
  COMPLETED: { key: 'payment.status.completed', class: 'badge-success' },
  EXPIRED: { key: 'payment.status.expired', class: 'badge-gray' },
  CANCELLED: { key: 'payment.status.cancelled', class: 'badge-gray' },
  FAILED: { key: 'payment.status.failed', class: 'badge-danger' },
  REFUND_REQUESTED: { key: 'payment.status.refund_requested', class: 'badge-warning' },
  REFUNDING: { key: 'payment.status.refunding', class: 'badge-warning' },
  REFUND_PENDING: { key: 'payment.status.refund_pending', class: 'badge-warning' },
  REFUNDED: { key: 'payment.status.refunded', class: 'badge-purple' },
  PARTIALLY_REFUNDED: { key: 'payment.status.partially_refunded', class: 'badge-purple' },
  REFUND_FAILED: { key: 'payment.status.refund_failed', class: 'badge-danger' },
}

const statusLabel = computed(() => {
  const entry = statusMap[props.status]
  return entry ? t(entry.key) : props.status
})

const statusClass = computed(() => {
  const entry = statusMap[props.status]
  return entry?.class ?? 'badge-gray'
})
</script>
