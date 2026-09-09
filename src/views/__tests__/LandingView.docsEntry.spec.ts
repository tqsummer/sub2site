import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

/**
 * 只覆盖落地页的「文档」入口：
 * 后台配了 doc_url 走站外链接，没配走站内 /docs。
 *
 * 改动前 doc_url 为空时整个入口是隐藏的，等于默认没有文档可看——
 * 这条容易在后续改动里被悄悄改回去，所以单独钉住。
 */

const settings = { value: null as Record<string, unknown> | null }

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh' } }),
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
    fetchPublicSettings: vi.fn(),
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: false }),
}))

vi.mock('@/api/modelPlaza', () => ({
  getModelPlaza: vi.fn().mockResolvedValue({ description: '', groups: [] }),
}))

import LandingView from '../LandingView.vue'

function mountLanding() {
  return mount(LandingView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        Icon: true,
        LocaleSwitcher: true,
      },
    },
  })
}

describe('LandingView 文档入口', () => {
  beforeEach(() => {
    settings.value = { site_name: 'AiRouterX', doc_url: '' }
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    })
  })

  it('doc_url 为空时，导航与页脚都指向站内 /docs', async () => {
    const wrapper = mountLanding()
    await flushPromises()

    const internal = wrapper.findAllComponents(RouterLinkStub).filter((l) => l.props('to') === '/docs')
    // 顶部导航一处、页脚「开发者」栏一处
    expect(internal.length).toBe(2)
  })

  it('doc_url 有值时改为站外链接，且不再指向 /docs', async () => {
    settings.value = { site_name: 'AiRouterX', doc_url: 'https://docs.example.com' }
    const wrapper = mountLanding()
    await flushPromises()

    // sanitizeUrl 走 new URL().toString()，会补上尾斜杠，所以按前缀匹配
    const external = wrapper
      .findAll('a')
      .filter((a) => (a.attributes('href') ?? '').startsWith('https://docs.example.com'))
    expect(external.length).toBe(2)
    // 站外链接必须带 noopener，否则新标签页能通过 window.opener 操作原页面
    external.forEach((a) => {
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toContain('noopener')
    })

    const internal = wrapper.findAllComponents(RouterLinkStub).filter((l) => l.props('to') === '/docs')
    expect(internal.length).toBe(0)
  })

  it('入口在两种情况下都存在——不会出现「没有文档」的状态', async () => {
    for (const docUrl of ['', 'https://docs.example.com']) {
      settings.value = { site_name: 'AiRouterX', doc_url: docUrl }
      const wrapper = mountLanding()
      await flushPromises()
      expect(wrapper.text()).toContain('landingV2.nav.docs')
    }
  })
})
