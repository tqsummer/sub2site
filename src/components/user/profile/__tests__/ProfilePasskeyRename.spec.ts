import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import ProfilePasskeyCard from '@/components/user/profile/ProfilePasskeyCard.vue'

const { listMock, renameMock, showSuccessMock, showErrorMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  renameMock: vi.fn(),
  showSuccessMock: vi.fn(),
  showErrorMock: vi.fn(),
}))

vi.mock('@/api', () => ({
  passkeyAPI: {
    list: listMock,
    rename: renameMock,
    remove: vi.fn(),
    registerStart: vi.fn(),
    registerFinish: vi.fn(),
    isSupported: () => true,
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({ showSuccess: showSuccessMock, showError: showErrorMock }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

function credential(overrides = {}) {
  return {
    id: 7,
    name: 'MacBook Touch ID',
    created_at: '2026-01-02T03:04:05Z',
    last_used_at: null,
    backup: false,
    ...overrides,
  }
}

async function mountCard() {
  listMock.mockResolvedValue([credential()])
  const wrapper = mount(ProfilePasskeyCard, { props: { enabled: true } })
  await flushPromises()
  return wrapper
}

/**
 * 重命名从浏览器原生 window.prompt 改成了内联编辑。
 * prompt 的问题是样式不受控、文案无法本地化、移动端体验差。
 * 这里锁住新交互的关键路径，顺便确保没人把 prompt 改回去。
 */
describe('ProfilePasskeyCard 内联重命名', () => {
  beforeEach(() => {
    listMock.mockReset()
    renameMock.mockReset()
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
  })

  it('不再使用 window.prompt', async () => {
    const promptSpy = vi.spyOn(window, 'prompt')
    const wrapper = await mountCard()
    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'common.edit')
    await editBtn?.trigger('click')
    expect(promptSpy).not.toHaveBeenCalled()
    promptSpy.mockRestore()
  })

  it('点编辑后原地出现输入框，保存后调用重命名接口', async () => {
    renameMock.mockResolvedValue(undefined)
    const wrapper = await mountCard()

    expect(wrapper.find('input[aria-label="profile.passkey.name"]').exists()).toBe(false)

    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'common.edit')
    await editBtn?.trigger('click')

    const input = wrapper.find('input[aria-label="profile.passkey.name"]')
    expect(input.exists()).toBe(true)
    // 草稿预填当前名称，用户改的是既有值而不是空白
    expect((input.element as HTMLInputElement).value).toBe('MacBook Touch ID')

    await input.setValue('新名称')
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'common.save')
    await saveBtn?.trigger('click')
    await flushPromises()

    expect(renameMock).toHaveBeenCalledWith(7, '新名称')
    expect(showSuccessMock).toHaveBeenCalled()
    // 保存后退出编辑态
    expect(wrapper.find('input[aria-label="profile.passkey.name"]').exists()).toBe(false)
  })

  it('取消不调用接口，也不改动名称', async () => {
    const wrapper = await mountCard()
    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'common.edit')
    await editBtn?.trigger('click')
    await wrapper.find('input[aria-label="profile.passkey.name"]').setValue('改了一半')

    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'common.cancel')
    await cancelBtn?.trigger('click')

    expect(renameMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('MacBook Touch ID')
  })

  it('名称为空时保存按钮禁用', async () => {
    const wrapper = await mountCard()
    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'common.edit')
    await editBtn?.trigger('click')
    await wrapper.find('input[aria-label="profile.passkey.name"]').setValue('   ')

    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'common.save')
    expect(saveBtn?.attributes('disabled')).toBeDefined()
  })
})
