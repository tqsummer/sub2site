import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

/**
 * 落地页页脚的「文档」入口。
 *
 * 顶部导航的同名入口已随顶栏迁到 PublicNavBar，那部分由
 * components/layout/__tests__/PublicNavBar.spec.ts 覆盖，这里把顶栏 stub 掉，
 * 只盯页脚——两处都容易在后续改动里被漏掉。
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
        PublicNavBar: true,
      },
    },
  })
}

describe('LandingView 页脚文档入口', () => {
  beforeEach(() => {
    settings.value = { site_name: 'AiRouterX', doc_url: '' }
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    })
  })

  it('doc_url 为空时指向站内 /docs', async () => {
    const wrapper = mountLanding()
    await flushPromises()

    const internal = wrapper.findAllComponents(RouterLinkStub).filter((l) => l.props('to') === '/docs')
    expect(internal.length).toBe(1)
  })

  it('doc_url 有值时改为站外链接，且带 noopener', async () => {
    settings.value = { site_name: 'AiRouterX', doc_url: 'https://docs.example.com' }
    const wrapper = mountLanding()
    await flushPromises()

    // sanitizeUrl 走 new URL().toString()，会补上尾斜杠，所以按前缀匹配
    const external = wrapper
      .findAll('a')
      .filter((a) => (a.attributes('href') ?? '').startsWith('https://docs.example.com'))
    expect(external.length).toBe(1)
    expect(external[0].attributes('target')).toBe('_blank')
    expect(external[0].attributes('rel')).toContain('noopener')

    expect(wrapper.findAllComponents(RouterLinkStub).filter((l) => l.props('to') === '/docs').length).toBe(0)
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
