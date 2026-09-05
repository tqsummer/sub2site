<template>
  <div class="flex items-center gap-1.5">
    <span
      :class="[
        'inline-block h-2 w-2 rounded-full',
        variantClass
      ]"
    ></span>
    <span class="text-sm text-content-2">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  label: string
}>()

const variantClass = computed(() => {
  switch (props.status) {
    case 'active':
    case 'success':
      return 'bg-success'
    case 'disabled':
    case 'inactive':
    case 'warning':
      return 'bg-warning'
    case 'error':
    case 'danger':
      return 'bg-danger'
    default:
      return 'bg-gray-400'
  }
})
</script>
