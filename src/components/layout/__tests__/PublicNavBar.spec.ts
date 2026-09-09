import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

/**
 * 公开页统一顶栏。三个公开页（落地页 / 模型广场 / 使用文档）共用同一个组件，
 * 页面间跳转顶栏不该变形——这里钉住它的两个可变部分：
 * 文档入口的目标，和右上角登录态的两种形态。
 */

const settings = { value: null as Record<string, unknown> | null }
const auth = { isAuthenticated: false }
const routePath = { value: '/docs' }

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh' } }),
  }
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ fullPath: routePath.value, params: {}, meta: {} }),
  }
})

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    get cachedPublicSettings() {
      return settings.value
    },
    siteName: '',
    siteLogo: '',
    docUrl: '',
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => auth,
}))

import PublicNavBar from '../PublicNavBar.vue'

function mountNav() {
  return mount(PublicNavBar, {
    global: {
      stubs: { RouterLink: RouterLinkStub, Icon: true, LocaleSwitcher: true },
    },
  })
}

function linksTo(wrapper: ReturnType<typeof mountNav>, to: string) {
  return wrapper.findAllComponents(RouterLinkStub).filter((l) => {
    const p = l.props('to') as unknown
    return typeof p === 'string' ? p === to : (p as { path?: string })?.path === to
  })
}

describe('PublicNavBar', () => {
  beforeEach(() => {
    settings.value = { site_name: 'AiRouterX', doc_url: '' }
    auth.isAuthenticated = false
    routePath.value = '/docs'
  })

  it('doc_url 为空时文档入口指向站内 /docs', () => {
    const wrapper = mountNav()
    expect(linksTo(wrapper, '/docs').length).toBe(1)
  })

  it('doc_url 有值时改为站外链接，并带 noopener', () => {
    settings.value = { site_name: 'AiRouterX', doc_url: 'https://docs.example.com' }
    const wrapper = mountNav()

    const external = wrapper
      .findAll('a')
      .filter((a) => (a.attributes('href') ?? '').startsWith('https://docs.example.com'))
    expect(external.length).toBe(1)
    expect(external[0].attributes('target')).toBe('_blank')
    // 没有 noopener，新标签页能通过 window.opener 操作原页面
    expect(external[0].attributes('rel')).toContain('noopener')

    expect(linksTo(wrapper, '/docs').length).toBe(0)
  })

  it('未登录时右上角是登录，且带上当前页作为回跳目标', () => {
    routePath.value = '/model-plaza'
    const wrapper = mountNav()

    const login = wrapper.findAllComponents(RouterLinkStub).find((l) => {
      const p = l.props('to') as { path?: string }
      return p?.path === '/login'
    })
    expect(login).toBeTruthy()
    expect((login!.props('to') as { query: { redirect: string } }).query.redirect).toBe('/model-plaza')
    expect(wrapper.text()).toContain('landingV2.nav.login')
    expect(wrapper.text()).not.toContain('landingV2.nav.console')
  })

  it('已登录时右上角是控制台', () => {
    auth.isAuthenticated = true
    const wrapper = mountNav()

    expect(linksTo(wrapper, '/dashboard').length).toBe(1)
    expect(wrapper.text()).toContain('landingV2.nav.console')
    expect(wrapper.text()).not.toContain('landingV2.nav.login')
  })

  it('站点名为空时不兜底成任何品牌名', () => {
    settings.value = { site_name: '', doc_url: '' }
    const wrapper = mountNav()
    expect(wrapper.text().toLowerCase()).not.toContain('sub2api')
  })
})
