import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

const settings = { value: null as Record<string, unknown> | null }
const currentLocale = { value: 'zh' }

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
      get locale() {
        return currentLocale
      },
    }),
  }
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ fullPath: '/docs', params: {}, meta: {} }),
  }
})

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    get cachedPublicSettings() {
      return settings.value
    },
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: false, token: '' }),
}))

import DocsView from '../DocsView.vue'

function mountDocs() {
  return mount(DocsView, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

/** 取渲染后的正文纯文本（MarkdownDoc 用 v-html 注入） */
function bodyText(wrapper: ReturnType<typeof mountDocs>): string {
  return wrapper.find('.markdown-page-content').element.textContent ?? ''
}

describe('DocsView', () => {
  beforeEach(() => {
    currentLocale.value = 'zh'
    settings.value = {
      site_name: 'AiRouterX',
      api_base_url: 'https://sub-api.airouterx.com',
    }
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://cloud.example.com' },
    })
  })

  it('把占位符替换成后台配置的品牌与地址', async () => {
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('AiRouterX')
    expect(text).toContain('https://sub-api.airouterx.com')
    // 占位符本身不应残留
    expect(text).not.toContain('{{brand}}')
    expect(text).not.toContain('{{baseUrl}}')
    expect(text).not.toContain('{{providerKey}}')
    expect(text).not.toContain('{{envKey}}')
  })

  it('provider 名与环境变量名由站点名规范化而来', async () => {
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('[model_providers.airouterx]')
    expect(text).toContain('AIROUTERX_API_KEY')
  })

  it('站点名不含合法字符时回落到 gateway，不生成非法 TOML 表名', async () => {
    // 中文站点名规范化后为空——直接拿去做 TOML 表名和环境变量名会是非法配置
    settings.value = { site_name: '云豆智能', api_base_url: 'https://api.example.com' }
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('[model_providers.gateway]')
    expect(text).toContain('GATEWAY_API_KEY')
    // 品牌展示名仍用原始站点名
    expect(text).toContain('云豆智能')
  })

  it('api_base_url 未配置时回落到当前站点域名', async () => {
    settings.value = { site_name: 'AiRouterX', api_base_url: '' }
    const wrapper = mountDocs()
    await flushPromises()

    expect(bodyText(wrapper)).toContain('https://cloud.example.com')
  })

  it('api_base_url 带 /v1 时会被剥掉，避免文档里出现 /v1/v1', async () => {
    settings.value = { site_name: 'AiRouterX', api_base_url: 'https://sub-api.airouterx.com/v1' }
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('https://sub-api.airouterx.com/v1')
    expect(text).not.toContain('/v1/v1')
  })

  it('两种客户端的地址形态不同：Codex 带 /v1，Claude Code 不带', async () => {
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('base_url = "https://sub-api.airouterx.com/v1"')
    expect(text).toContain('ANTHROPIC_BASE_URL="https://sub-api.airouterx.com"')
  })

  it('两种密钥存放方式都写了', async () => {
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    // 方式一：环境变量
    expect(text).toContain('env_key = "AIROUTERX_API_KEY"')
    // 方式二：直接写配置文件
    expect(text).toContain('[model_providers.airouterx.http_headers]')
    expect(text).toContain('Authorization = "Bearer')
  })

  it('切换到英文时渲染英文文档', async () => {
    currentLocale.value = 'en'
    const wrapper = mountDocs()
    await flushPromises()
    const text = bodyText(wrapper)

    expect(text).toContain('Getting started')
    expect(text).not.toContain('快速开始')
  })

  it('不含上游品牌残留', async () => {
    for (const loc of ['zh', 'en']) {
      currentLocale.value = loc
      const wrapper = mountDocs()
      await flushPromises()
      const text = bodyText(wrapper)
      expect(text.toLowerCase()).not.toContain('sub2api')
      expect(text).not.toContain('github.com/Wei-Shaw')
    }
  })

  it('生成目录', async () => {
    const wrapper = mountDocs()
    await flushPromises()

    const toc = wrapper.findAll('.toc-item')
    expect(toc.length).toBeGreaterThan(3)
    expect(toc.map((i) => i.text()).join(' ')).toContain('快速开始')
  })
})
