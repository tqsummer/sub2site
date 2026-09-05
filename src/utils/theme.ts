/**
 * 明暗主题的唯一写入口。
 *
 * 迁移期间要同时维护两套标记：
 *   - `html.dark`        —— Tailwind `darkMode: 'class'` 依赖它，
 *                            全站现有几百个 `dark:*` 工具类都靠这个生效；
 *   - `html[data-theme]` —— 设计 token 层（src/styles/theme.css）的选择器，
 *                            新组件用语义 token 时靠这个切换。
 *
 * 两者必须同步写。只要有一处漏了，页面就会出现「一半按新 token 走暗色、
 * 一半按 Tailwind 类走亮色」的割裂状态。等所有页面都迁到 token 之后，
 * 才能把 class 那一路摘掉。
 *
 * 读取方仍可继续用 `document.documentElement.classList.contains('dark')`，
 * 无需改动。
 */
export function applyTheme(dark: boolean): void {
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
}

/** 当前是否暗色。以 class 为准，与既有读取方保持一致。 */
export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * 从 localStorage + 系统偏好解析初始主题。
 * 未显式选择过时跟随系统。
 */
export function resolveInitialDark(): boolean {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
