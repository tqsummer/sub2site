import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useContentBreakpoint } from '@/composables/useContentBreakpoint'

/**
 * 挂载一个宿主组件，把容器宽度伪造成给定值。
 * jsdom 里 clientWidth 恒为 0，需要显式改写描述符。
 */
function mountWithWidth(width: number) {
  const Host = defineComponent({
    setup(_, { expose }) {
      const el = ref<HTMLElement | null>(null)
      const bp = useContentBreakpoint(el)
      expose(bp)
      return () => h('div', { ref: el })
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  const el = wrapper.element as HTMLElement
  Object.defineProperty(el, 'clientWidth', { value: width, configurable: true })
  // jsdom 里 ResizeObserver 不会真的触发，手动重测一次
  ;(wrapper.vm as unknown as { measure: () => void }).measure()
  return wrapper
}

describe('useContentBreakpoint', () => {
  it('未测量前默认按宽屏渲染，避免首帧从移动端布局跳到桌面布局', () => {
    const Host = defineComponent({
      setup(_, { expose }) {
        const el = ref<HTMLElement | null>(null)
        expose(useContentBreakpoint(el))
        return () => h('div')
      },
    })
    const wrapper = mount(Host)
    expect((wrapper.vm as unknown as { tier: string }).tier).toBe('xl')
  })

  it.each([
    [600, 'mobile'],
    [900, 'md'],
    [1100, 'lg'],
    [1400, 'xl'],
  ])('宽度 %ipx 落在 %s 档', async (width, expected) => {
    const wrapper = mountWithWidth(width)
    await nextTick()
    const vm = wrapper.vm as unknown as { tier: string }
    expect(vm.tier).toBe(expected)
    wrapper.unmount()
  })

  it('窄内容区收起筛选器标签与时间范围 chip，宽内容区展开', async () => {
    const narrow = mountWithWidth(900)
    await nextTick()
    const nvm = narrow.vm as unknown as {
      showFilterLabels: boolean
      rangeAsChips: boolean
      showMediumColumns: boolean
      showWideColumns: boolean
    }
    expect(nvm.showFilterLabels).toBe(false)
    expect(nvm.rangeAsChips).toBe(false)
    expect(nvm.showMediumColumns).toBe(false)
    expect(nvm.showWideColumns).toBe(false)
    narrow.unmount()

    const wide = mountWithWidth(1400)
    await nextTick()
    const wvm = wide.vm as unknown as {
      showFilterLabels: boolean
      rangeAsChips: boolean
      showMediumColumns: boolean
      showWideColumns: boolean
    }
    expect(wvm.showFilterLabels).toBe(true)
    expect(wvm.rangeAsChips).toBe(true)
    expect(wvm.showMediumColumns).toBe(true)
    expect(wvm.showWideColumns).toBe(true)
    wide.unmount()
  })

  it('中间档 1100px 显示中优先级列但隐藏次要列', async () => {
    const wrapper = mountWithWidth(1100)
    await nextTick()
    const vm = wrapper.vm as unknown as { showMediumColumns: boolean; showWideColumns: boolean }
    // 这是设计稿返工时特意补的中间档：1024 与 1280 之间不能只有「全展开/全收起」两态
    expect(vm.showMediumColumns).toBe(true)
    expect(vm.showWideColumns).toBe(false)
    wrapper.unmount()
  })
})
