import { onBeforeUnmount, onMounted, ref, computed, type Ref } from 'vue'

/**
 * 按「内容区实际宽度」而不是视口宽度分档。
 *
 * 这一点在设计稿返工时踩过坑：最初按 `window.innerWidth` 判断档位，
 * 但控制台左侧固定占着 260px（折叠 72px）的侧栏，内容区永远比视口窄一截。
 * 结果 1440 视口下内容区只有 1180，却被当成「宽屏」渲染全部列，直接挤爆。
 *
 * 所以这里用 ResizeObserver 观测容器自身宽度，谁用谁量，不做全局假设。
 *
 * 档位与设计稿一致：
 *   mobile  < 768    抽屉态，控件收进筛选面板
 *   md      < 1024   紧凑：多选筛选收成图标 + 计数徽章
 *   lg      < 1280   时间范围仍是 chip，次要列开始隐藏
 *   xl      ≥ 1280   全部展开
 */
export type ContentTier = 'mobile' | 'md' | 'lg' | 'xl'

const BREAKPOINTS: Array<[number, ContentTier]> = [
  [768, 'mobile'],
  [1024, 'md'],
  [1280, 'lg'],
]

export function useContentBreakpoint(target: Ref<HTMLElement | null>) {
  // 初值给 xl 而不是 mobile：首帧还没测到宽度，先按宽屏渲染再收缩，
  // 比先渲染成移动端再展开的视觉跳动小。
  const width = ref(1280)
  let observer: ResizeObserver | null = null

  const tier = computed<ContentTier>(() => {
    for (const [max, name] of BREAKPOINTS) {
      if (width.value < max) return name
    }
    return 'xl'
  })

  const isMobile = computed(() => tier.value === 'mobile')
  /** 是否有足够宽度显示完整的筛选器标签（而非计数徽章） */
  const showFilterLabels = computed(() => width.value >= 1024)
  /** 时间范围是否用 chip 组（否则收成下拉） */
  const rangeAsChips = computed(() => width.value >= 1024)
  /** 次要列（RPM 这类）是否显示 */
  const showWideColumns = computed(() => width.value >= 1280)
  /** 中等优先级列（TPS 这类）是否显示 */
  const showMediumColumns = computed(() => width.value >= 1024)

  function measure() {
    const el = target.value
    if (el) width.value = el.clientWidth
  }

  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') {
      // 测试环境（jsdom）或老浏览器：退回一次性测量，不订阅变化
      measure()
      return
    }
    observer = new ResizeObserver(measure)
    if (target.value) observer.observe(target.value)
    measure()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    /** 手动触发一次重测。ResizeObserver 覆盖不到的场景用（如测试、或容器被脚本改宽）。 */
    measure,
    width,
    tier,
    isMobile,
    showFilterLabels,
    rangeAsChips,
    showWideColumns,
    showMediumColumns,
  }
}
