<template>
  <!-- relative 是必须的：收起后的展开按钮用 absolute 定位，根容器若是 static，
       按钮会落到视口左上角，被 sticky 的站点顶栏（z-30）整个盖住点不到。 -->
  <div class="relative flex" :class="isPage ? 'gap-0' : 'h-full overflow-hidden'">
    <!-- 目录 -->
    <aside v-show="tocVisible && tocItems.length > 0" class="toc-sidebar" :class="{ 'toc-sidebar-page': isPage }">
      <div class="toc-header">
        <span class="toc-title">{{ t('customPage.tableOfContents') }}</span>
        <button type="button" class="toc-close-btn" :aria-label="t('customPage.tableOfContents')" @click="tocVisible = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <nav class="toc-nav">
        <a
          v-for="item in tocItems"
          :key="item.id"
          :href="'#' + item.id"
          class="toc-item"
          :class="[`toc-level-${item.level}`, { 'toc-active': activeHeadingId === item.id }]"
          @click.prevent="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </a>
      </nav>
    </aside>

    <!-- 目录收起时的展开按钮 -->
    <button
      v-show="!tocVisible && tocItems.length > 0"
      type="button"
      class="toc-toggle-btn"
      :class="{ 'toc-toggle-btn-page': isPage }"
      @click="tocVisible = true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      <span class="ml-1 text-xs">{{ t('customPage.tableOfContents') }}</span>
    </button>

    <!-- 正文 -->
    <div
      ref="contentEl"
      class="markdown-page-content min-w-0 flex-1"
      :class="isPage ? 'px-5 py-6 md:px-8 md:py-8' : 'h-full overflow-auto p-6 md:p-10'"
      v-html="renderedHtml"
      @scroll="onContentScroll"
    ></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Markdown 文档渲染器：正文 + 目录 + 滚动高亮 + 代码块复制按钮。
 *
 * 从 CustomPageView 抽出来的。原来这套逻辑（渲染管线、目录构建、滚动追踪、
 * 复制按钮注入）连同约 100 行样式只服务于自定义页面；新增的 /docs 页需要
 * 一模一样的东西，复制一份就是两处各自演化的开始，所以提成共享组件。
 *
 * 本组件只负责「把一段 Markdown 变成带目录的文档」，不关心内容从哪来：
 * CustomPageView 从接口取，DocsView 从仓库里的 .md 导入。
 */
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface TocItem {
  id: string
  text: string
  level: number
}

const props = withDefaults(
  defineProps<{
    /** 原始 Markdown 文本。调用方负责好一切预处理（占位符替换、图片地址重写等）。 */
    source: string
    /**
     * 滚动形态，决定目录怎么跟随、滚动高亮监听谁：
     *
     * - `panel`（默认）：容器自己定高、内部滚动。用于后台壳子里的自定义页面，
     *   那里外层已经用 `height: calc(100vh - ...)` 框死了高度。
     * - `page`：整页滚动，目录 sticky 吸附。用于公开文档页——公开页的规范是
     *   `min-h-screen` + 正常页面滚动，套内滚容器会和站点其它页面手感不一致。
     *
     * 两者的滚动源不同（容器 vs window），滚动高亮必须跟着切换监听目标，
     * 否则高亮永远不动。
     */
    variant?: 'panel' | 'page'
  }>(),
  { variant: 'panel' }
)

const { t } = useI18n()

const isPage = computed(() => props.variant === 'page')

const renderedHtml = ref('')
const contentEl = ref<HTMLElement | null>(null)
const tocItems = ref<TocItem[]>([])
// 窄屏默认收起目录，否则正文只剩一条缝
const tocVisible = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
const activeHeadingId = ref('')

function generateHeadingId(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // 带序号是为了容忍重名标题——同名锚点会让目录跳错位置
  return base ? `${base}-${index}` : `heading-${index}`
}

function render(markdown: string) {
  if (!markdown) {
    renderedHtml.value = ''
    tocItems.value = []
    return
  }

  const html = marked.parse(markdown) as string
  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
  })

  // 给标题注入 id 并同步构建目录，一次遍历完成
  const toc: TocItem[] = []
  let headingIndex = 0
  renderedHtml.value = sanitized.replace(
    /<(h[1-4])[^>]*>(.*?)<\/h[1-4]>/gi,
    (_, tag: string, content: string) => {
      const level = parseInt(tag[1])
      const text = content.replace(/<[^>]+>/g, '').trim()
      const id = generateHeadingId(text, headingIndex++)
      toc.push({ id, text, level })
      return `<${tag} id="${id}">${content}</${tag}>`
    }
  )
  tocItems.value = toc
}

/** 整页滚动时，标题要停在吸顶顶栏下方，不能被它盖住 */
const PAGE_SCROLL_OFFSET = 80

/**
 * 按 id 找标题元素。
 *
 * 不用 `querySelector('#' + CSS.escape(id))`：CSS.escape 在 jsdom 里不存在，
 * 测试环境一调就抛。而这些 id 是 generateHeadingId 自己生成的，直接比对属性
 * 既不需要转义也更省事。
 */
function findHeading(container: HTMLElement, id: string): HTMLElement | null {
  const headings = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id]')
  for (const el of headings) {
    if (el.id === id) return el
  }
  return null
}

function scrollToHeading(id: string) {
  const container = contentEl.value
  if (!container) return
  const el = findHeading(container, id)
  if (!el) return

  if (isPage.value) {
    // 整页滚动：scrollIntoView 会把标题顶到视口最上沿，正好藏进吸顶顶栏里，
    // 所以自己算目标位置并留出偏移。
    const top = el.getBoundingClientRect().top + window.scrollY - PAGE_SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  activeHeadingId.value = id
  // 手机上点完目录要让位给正文，否则遮住刚跳过去的内容
  if (window.innerWidth <= 640) {
    tocVisible.value = false
  }
}

let scrollRafId = 0
function updateActiveHeading() {
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = 0
    const container = contentEl.value
    if (!container || tocItems.value.length === 0) return

    // 判定基准线：整页滚动时是视口顶部下方一点，容器滚动时是容器顶部下方一点
    const threshold = isPage.value ? PAGE_SCROLL_OFFSET + 20 : container.getBoundingClientRect().top + 100

    // 一次取全部标题建索引，避免在循环里逐个查 DOM
    const byId = new Map<string, HTMLElement>()
    container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id]').forEach((el) => {
      byId.set(el.id, el)
    })

    let current = ''
    for (const item of tocItems.value) {
      const el = byId.get(item.id)
      if (!el) continue
      // 越过基准线的标题即视为「当前章节」，最后一个胜出
      if (el.getBoundingClientRect().top <= threshold) {
        current = item.id
      }
    }
    activeHeadingId.value = current
  })
}

/** 容器滚动模式下由模板的 @scroll 驱动；整页模式下容器不滚，这里不会触发 */
const onContentScroll = updateActiveHeading

function injectCopyButtons() {
  const container = contentEl.value
  if (!container) return

  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'copy-btn'
    btn.textContent = t('customPage.copyCode')
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = t('customPage.copiedCode')
      } catch {
        btn.textContent = t('customPage.copyCodeFailed')
      }
      setTimeout(() => { btn.textContent = t('customPage.copyCode') }, 2000)
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

watch(
  () => props.source,
  async (source) => {
    render(source)
    activeHeadingId.value = ''
    // 两个 tick：一个等 v-html 落地，一个等浏览器完成布局，否则查不到 <pre>
    await nextTick()
    await nextTick()
    injectCopyButtons()
  },
  { immediate: true }
)

// 整页滚动模式下容器自身不滚，模板上的 @scroll 永远不会触发，
// 滚动高亮必须改听 window，否则目录高亮是死的。
onMounted(() => {
  if (isPage.value) {
    window.addEventListener('scroll', updateActiveHeading, { passive: true })
    updateActiveHeading()
  }
})

onBeforeUnmount(() => {
  if (isPage.value) {
    window.removeEventListener('scroll', updateActiveHeading)
  }
  if (scrollRafId) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = 0
  }
})
</script>

<style scoped>
.toc-sidebar {
  @apply flex flex-col h-full border-r border-divider bg-surface-2;
  width: min(240px, 30%);
  min-width: 160px;
  max-width: 280px;
  overflow: hidden;
}

@media (max-width: 640px) {
  .toc-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 20;
    width: 70%;
    max-width: 240px;
    height: 100%;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}

.toc-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-divider;
}

.toc-title {
  @apply text-sm font-semibold text-content-2;
}

.toc-close-btn {
  @apply p-1 rounded text-content-3 hover:text-content-2 dark:hover:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors;
}

.toc-nav {
  @apply flex-1 overflow-y-auto py-2 px-2;
}

.toc-item {
  @apply block px-2 py-1.5 text-sm rounded transition-colors truncate;
  @apply text-content-2 hover:text-content dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-600;
}

.toc-item.toc-active {
  @apply text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium;
}

.toc-level-1 { padding-left: 8px; }
.toc-level-2 { padding-left: 20px; }
.toc-level-3 { padding-left: 32px; }
.toc-level-4 { padding-left: 44px; }

.toc-toggle-btn {
  @apply absolute left-2 top-2 z-10 flex items-center px-2 py-1.5 rounded-md text-sm;
  @apply bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-500;
  @apply text-content-2 hover:bg-gray-100 dark:hover:bg-dark-600;
  @apply shadow-sm transition-colors cursor-pointer;
}

/* ---- 整页滚动模式（公开文档页）---- */

/* 目录吸附在吸顶顶栏（h-14 = 56px）下方，自身独立滚动。
   容器模式下用的 h-full 在这里会撑成整篇文档那么高，目录会跟着整页滚走。 */
.toc-sidebar-page {
  height: auto;
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 88px);
  @apply rounded-l-2xl bg-transparent;
}

/* 收起后的展开按钮同样要吸附，否则滚下去就找不到它了。
   注意根容器必须是 relative——否则 absolute 会落到视口左上角被顶栏盖住。 */
.toc-toggle-btn-page {
  position: sticky;
  top: 72px;
  left: auto;
  align-self: flex-start;
  margin: 12px 0 0 12px;
}

@media (max-width: 640px) {
  /* 窄屏下目录改为浮层，仍然吸附，不占正文宽度 */
  .toc-sidebar-page {
    position: fixed;
    top: 56px;
    left: 0;
    height: calc(100vh - 56px);
    max-height: none;
    @apply rounded-none bg-surface-2;
  }
}
</style>

<style>
/* 非 scoped：内容由 v-html 注入，带不上 scope 属性 */
.markdown-page-content {
  line-height: 1.7;
  color: inherit;
}
.markdown-page-content h1 { @apply text-3xl font-bold mt-8 mb-4 pb-2 border-b border-divider; }
.markdown-page-content h2 { @apply text-2xl font-bold mt-6 mb-3; }
.markdown-page-content h3 { @apply text-xl font-semibold mt-5 mb-2; }
.markdown-page-content h4 { @apply text-lg font-semibold mt-4 mb-2; }
.markdown-page-content p { @apply mb-4; }
.markdown-page-content ul { @apply list-disc pl-6 mb-4; }
.markdown-page-content ol { @apply list-decimal pl-6 mb-4; }
.markdown-page-content li { @apply mb-1; }
.markdown-page-content a { @apply text-primary-500 hover:text-primary-600 underline; }
.markdown-page-content blockquote { @apply border-l-4 border-divider-strong pl-4 italic text-content-2 my-4; }
.markdown-page-content img { @apply max-w-full h-auto rounded-lg my-4; }
.markdown-page-content table { @apply w-full border-collapse my-4; }
.markdown-page-content th { @apply border border-divider-strong px-3 py-2 bg-gray-50 dark:bg-dark-700 font-semibold text-left; }
.markdown-page-content td { @apply border border-divider-strong px-3 py-2; }
.markdown-page-content code { @apply bg-surface-3 px-1.5 py-0.5 rounded text-sm font-mono; }
.markdown-page-content pre { @apply bg-gray-900 dark:bg-dark-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 relative; }
.markdown-page-content pre code { @apply bg-transparent p-0 text-inherit; }
.markdown-page-content hr { @apply my-6 border-divider; }

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  font-family: inherit;
}
.copy-btn:hover { background: rgba(255, 255, 255, 0.25); }
pre:hover .copy-btn { opacity: 1; }
</style>
