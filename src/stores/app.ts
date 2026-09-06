/**
 * Application State Store
 * Manages global UI state including sidebar, loading indicators, and toast notifications
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Toast, ToastType, PublicSettings } from '@/types'
import { i18n } from '@/i18n'
import {
  checkUpdates as checkUpdatesAPI,
  type VersionInfo,
  type ReleaseInfo
} from '@/api/admin/system'
import { getPublicSettings as fetchPublicSettingsAPI } from '@/api/auth'

/**
 * 品牌信息的本地缓存。
 *
 * sub2site 是纯静态托管，拿不到 sub2api 那套 SSR 注入的 window.__APP_CONFIG__，
 * 站点名与 Logo 必须等 /api/v1/settings/public 返回才知道。网络慢时会有一段空窗，
 * 首屏若渲染任何兜底品牌名，就会出现「先闪错名字再切换」——线上实测可见。
 *
 * 所以把上次成功获取的品牌信息存进 localStorage：
 *   - 回访用户：首帧即正确，无闪烁
 *   - 首次访问：留空，宁可短暂无名，也绝不显示错误品牌
 *
 * 只缓存站点名与 Logo 这两项纯展示数据，不涉及权限与用量，过期风险仅是
 * 管理员刚改过品牌时旧访客首帧看到旧名，下一帧即被接口结果覆盖。
 */
const BRAND_CACHE_KEY = 'site_brand'

interface BrandCache {
  site_name: string
  site_logo: string
}

function readBrandCache(): BrandCache {
  const empty: BrandCache = { site_name: '', site_logo: '' }
  if (typeof localStorage === 'undefined') return empty
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<BrandCache>
    return {
      site_name: typeof parsed.site_name === 'string' ? parsed.site_name : '',
      site_logo: typeof parsed.site_logo === 'string' ? parsed.site_logo : '',
    }
  } catch {
    // 缓存损坏时按无缓存处理，不能让它影响应用启动
    return empty
  }
}

function writeBrandCache(siteName: string, siteLogo: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify({ site_name: siteName, site_logo: siteLogo }))
  } catch {
    // 隐私模式或存储配额满时静默失败，只是失去下次的免闪烁优化
  }
}

export const useAppStore = defineStore('app', () => {
  // ==================== State ====================

  const sidebarCollapsed = ref<boolean>(false)
  const mobileOpen = ref<boolean>(false)
  const sidebarScrollTop = ref<number>(0)
  const loading = ref<boolean>(false)
  const toasts = ref<Toast[]>([])

  // Public settings cache state
  const publicSettingsLoaded = ref<boolean>(false)
  const publicSettingsLoading = ref<boolean>(false)
  // 首屏兜底绝不能是具体品牌名。
  //
  // sub2api 自己的前端不会闪，因为后端用 SSR 把 window.__APP_CONFIG__ 注进了 HTML；
  // sub2site 是纯静态托管，没有这层注入，只能等 /settings/public 返回。
  // 如果初值写死成某个品牌，页面就会先闪出错误的名字再切换——线上实测可见。
  //
  // 解法两层：初值取自 localStorage 里上次拿到的品牌信息（回访用户瞬间正确），
  // 没有缓存时留空（首次访问宁可短暂无名，也不能显示错误品牌）。
  const siteName = ref<string>(readBrandCache().site_name)
  const siteLogo = ref<string>(readBrandCache().site_logo)
  const siteVersion = ref<string>('')
  const contactInfo = ref<string>('')
  const apiBaseUrl = ref<string>('')
  const docUrl = ref<string>('')
  const cachedPublicSettings = ref<PublicSettings | null>(null)
  let publicSettingsRequest: Promise<PublicSettings | null> | null = null

  // Version cache state
  const versionLoaded = ref<boolean>(false)
  const versionLoading = ref<boolean>(false)
  const currentVersion = ref<string>('')
  const latestVersion = ref<string>('')
  const hasUpdate = ref<boolean>(false)
  const buildType = ref<string>('source')
  const releaseInfo = ref<ReleaseInfo | null>(null)

  // Auto-incrementing ID for toasts
  let toastIdCounter = 0

  // ==================== Computed ====================

  const hasActiveToasts = computed(() => toasts.value.length > 0)
  const backendModeEnabled = computed(() => cachedPublicSettings.value?.backend_mode_enabled ?? false)

  const loadingCount = ref<number>(0)

  // ==================== Actions ====================

  /**
   * Toggle sidebar collapsed state
   */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  /**
   * Set sidebar collapsed state explicitly
   * @param collapsed - Whether sidebar should be collapsed
   */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed
  }

  /**
   * Toggle mobile sidebar open state
   */
  function toggleMobileSidebar(): void {
    mobileOpen.value = !mobileOpen.value
  }

  /**
   * Set mobile sidebar open state explicitly
   * @param open - Whether mobile sidebar should be open
   */
  function setMobileOpen(open: boolean): void {
    mobileOpen.value = open
  }

  /**
   * Set global loading state
   * @param isLoading - Whether app is in loading state
   */
  function setLoading(isLoading: boolean): void {
    if (isLoading) {
      loadingCount.value++
    } else {
      loadingCount.value = Math.max(0, loadingCount.value - 1)
    }
    loading.value = loadingCount.value > 0
  }

  /**
   * Show a toast notification
   * @param type - Type of toast (success, error, info, warning)
   * @param message - Toast message content
   * @param duration - Auto-dismiss duration in ms (undefined = no auto-dismiss)
   * @returns Toast ID for manual dismissal
   */
  function showToast(type: ToastType, message: string, duration?: number): string {
    const id = `toast-${++toastIdCounter}`
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      startTime: duration !== undefined ? Date.now() : undefined
    }

    toasts.value.push(toast)

    // Auto-dismiss if duration is specified
    if (duration !== undefined) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }

    return id
  }

  /**
   * Show a success toast
   * @param message - Success message
   * @param duration - Auto-dismiss duration in ms (default: 3000)
   */
  function showSuccess(message: string, duration: number = 3000): string {
    return showToast('success', message, duration)
  }

  /**
   * Show an error toast
   * @param message - Error message
   * @param duration - Auto-dismiss duration in ms (default: 5000)
   */
  function showError(message: string, duration: number = 5000): string {
    return showToast('error', message, duration)
  }

  /**
   * Show an info toast
   * @param message - Info message
   * @param duration - Auto-dismiss duration in ms (default: 3000)
   */
  function showInfo(message: string, duration: number = 3000): string {
    return showToast('info', message, duration)
  }

  /**
   * Show a warning toast
   * @param message - Warning message
   * @param duration - Auto-dismiss duration in ms (default: 4000)
   */
  function showWarning(message: string, duration: number = 4000): string {
    return showToast('warning', message, duration)
  }

  /**
   * Hide a specific toast by ID
   * @param id - Toast ID to hide
   */
  function hideToast(id: string): void {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * Clear all toasts
   */
  function clearAllToasts(): void {
    toasts.value = []
  }

  /**
   * Execute an async operation with loading state
   * Automatically manages loading indicator
   * @param operation - Async operation to execute
   * @returns Promise resolving to operation result
   */
  async function withLoading<T>(operation: () => Promise<T>): Promise<T> {
    setLoading(true)
    try {
      return await operation()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Execute an async operation with loading and error handling
   * Shows error toast on failure
   * @param operation - Async operation to execute
   * @param errorMessage - Custom error message (optional)
   * @returns Promise resolving to operation result or null on error
   */
  async function withLoadingAndError<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    setLoading(true)
    try {
      return await operation()
    } catch (error) {
      const message =
        errorMessage ||
        (error as { message?: string }).message ||
        i18n.global.t('common.unknownError')
      showError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset app state to defaults
   * Useful for cleanup or testing
   */
  function reset(): void {
    sidebarCollapsed.value = false
    loading.value = false
    loadingCount.value = 0
    toasts.value = []
  }

  // ==================== Version Management ====================

  /**
   * Fetch version info (uses cache unless force=true)
   * @param force - Force refresh from API
   */
  async function fetchVersion(force = false): Promise<VersionInfo | null> {
    // Return cached data if available and not forcing refresh
    if (versionLoaded.value && !force) {
      return {
        current_version: currentVersion.value,
        latest_version: latestVersion.value,
        has_update: hasUpdate.value,
        build_type: buildType.value,
        release_info: releaseInfo.value || undefined,
        cached: true
      }
    }

    // Prevent duplicate requests
    if (versionLoading.value) {
      return null
    }

    versionLoading.value = true
    try {
      const data = await checkUpdatesAPI(force)
      currentVersion.value = data.current_version
      latestVersion.value = data.latest_version
      hasUpdate.value = data.has_update
      buildType.value = data.build_type || 'source'
      releaseInfo.value = data.release_info || null
      versionLoaded.value = true
      return data
    } catch (error) {
      console.error('Failed to fetch version:', error)
      return null
    } finally {
      versionLoading.value = false
    }
  }

  /**
   * Clear version cache (e.g., after update)
   */
  function clearVersionCache(): void {
    versionLoaded.value = false
    hasUpdate.value = false
  }

  // ==================== Public Settings Management ====================

  /**
   * Apply settings to store state (internal helper to avoid code duplication)
   */
  function applySettings(config: PublicSettings): void {
    if (typeof window !== 'undefined') {
      window.__APP_CONFIG__ = { ...config }
    }
    cachedPublicSettings.value = config
    siteName.value = config.site_name || ''
    writeBrandCache(config.site_name || '', config.site_logo || '')
    siteLogo.value = config.site_logo || ''
    // 用户端不展示后端版本号（避免暴露版本便于针对性攻击）。
    // 注：sub2api 原生页面的 SSR 注入里 version 本就为空，此处对齐该行为。
    siteVersion.value = ''
    contactInfo.value = config.contact_info || ''
    apiBaseUrl.value = config.api_base_url || ''
    docUrl.value = config.doc_url || ''
    publicSettingsLoaded.value = true
  }

  /**
   * Fetch public settings (uses cache unless force=true)
   * @param force - Force refresh from API
   */
  function fetchPublicSettings(force = false): Promise<PublicSettings | null> {
    // An active request always wins over cache/force semantics so every caller observes
    // the same refresh result and no older request can overwrite a newer one.
    if (publicSettingsRequest) {
      return publicSettingsRequest
    }

    // Check for injected config from server (eliminates flash)
    if (!publicSettingsLoaded.value && !force && window.__APP_CONFIG__) {
      applySettings(window.__APP_CONFIG__)
      return Promise.resolve(window.__APP_CONFIG__)
    }

    // Return cached data if available and not forcing refresh
    if (publicSettingsLoaded.value && !force) {
      if (cachedPublicSettings.value) {
        return Promise.resolve({ ...cachedPublicSettings.value })
      }
      return Promise.resolve({
        registration_enabled: false,
        email_verify_enabled: false,
        force_email_on_third_party_signup: false,
        registration_email_suffix_whitelist: [],
        promo_code_enabled: true,
        password_reset_enabled: false,
        invitation_code_enabled: false,
        turnstile_enabled: false,
        turnstile_site_key: '',
        aliyun_captcha_enabled: false,
        aliyun_captcha_scene_id: '',
        aliyun_captcha_prefix: '',
        aliyun_captcha_region: 'cn',
        site_name: siteName.value,
        site_logo: siteLogo.value,
        site_subtitle: '',
        api_base_url: apiBaseUrl.value,
        contact_info: contactInfo.value,
        doc_url: docUrl.value,
        home_content: '',
        compact_home_enabled: false,
        hide_ccs_import_button: false,
        payment_enabled: false,
        table_default_page_size: 20,
        table_page_size_options: [10, 20, 50, 100],
        custom_menu_items: [],
        custom_endpoints: [],
        linuxdo_oauth_enabled: false,
        wechat_oauth_enabled: false,
        wechat_oauth_open_enabled: false,
        wechat_oauth_mp_enabled: false,
        wechat_oauth_mobile_enabled: false,
        oidc_oauth_enabled: false,
        oidc_oauth_provider_name: 'OIDC',
        github_oauth_enabled: false,
        google_oauth_enabled: false,
        backend_mode_enabled: false,
        passkey_enabled: false,
        version: siteVersion.value,
        balance_low_notify_enabled: false,
        account_quota_notify_enabled: false,
        balance_low_notify_threshold: 0,
        channel_monitor_enabled: true,
        channel_monitor_default_interval_seconds: 60,
        available_channels_enabled: false,
        model_plaza_enabled: false,
        model_plaza_require_auth: false,
        plugin_management_enabled: false,
        risk_control_enabled: false,
        service_quota_enabled: false,
        affiliate_enabled: false,
        allow_user_view_error_requests: false,
      })
    }

    publicSettingsLoading.value = true
    let apiRequest: Promise<PublicSettings>
    try {
      apiRequest = fetchPublicSettingsAPI()
    } catch (error) {
      console.error('Failed to fetch public settings:', error)
      publicSettingsLoading.value = false
      return Promise.resolve(null)
    }

    const request = apiRequest
      .then((data) => {
        applySettings(data)
        return data
      })
      .catch((error) => {
        console.error('Failed to fetch public settings:', error)
        return null
      })
      .finally(() => {
        if (publicSettingsRequest === request) {
          publicSettingsRequest = null
          publicSettingsLoading.value = false
        }
      })

    publicSettingsRequest = request
    return request
  }

  /**
   * Clear public settings cache
   */
  function clearPublicSettingsCache(): void {
    publicSettingsLoaded.value = false
    cachedPublicSettings.value = null
  }

  /**
   * Initialize settings from injected config (window.__APP_CONFIG__)
   * This is called synchronously before Vue app mounts to prevent flash
   * @returns true if config was found and applied, false otherwise
   */
  function initFromInjectedConfig(): boolean {
    if (window.__APP_CONFIG__) {
      applySettings(window.__APP_CONFIG__)
      return true
    }
    return false
  }

  // ==================== Return Store API ====================

  return {
    // State
    sidebarCollapsed,
    mobileOpen,
    sidebarScrollTop,
    loading,
    toasts,

    // Public settings state
    publicSettingsLoaded,
    siteName,
    siteLogo,
    siteVersion,
    contactInfo,
    apiBaseUrl,
    docUrl,
    cachedPublicSettings,

    // Version state
    versionLoaded,
    versionLoading,
    currentVersion,
    latestVersion,
    hasUpdate,
    buildType,
    releaseInfo,

    // Computed
    hasActiveToasts,
    backendModeEnabled,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileSidebar,
    setMobileOpen,
    setLoading,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
    clearAllToasts,
    withLoading,
    withLoadingAndError,
    reset,

    // Version actions
    fetchVersion,
    clearVersionCache,

    // Public settings actions
    fetchPublicSettings,
    clearPublicSettingsCache,
    initFromInjectedConfig
  }
})
