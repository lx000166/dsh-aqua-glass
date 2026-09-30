/**
 * L5 结构测试 —— 对 DSH 升级的第一道防线。
 *
 * 这些用例**读 CSS 文本**而不是渲染页面：皮肤类插件最常见的退化不是构建
 * 失败，而是选择器静默失配（规则还在、没人命中）。把关键选择器钉在测试里，
 * 升级后跑一次 `pnpm test` 就知道哪条断了。
 *
 * 同样的教训在参照实现里有真实记录：maid-atelier 的
 * `orca-link/tests/settings-radius.spec.ts` 注释写着 rc.1→rc.2 设置对话框
 * 改为 portal 到 body 后，只写槽内选择器的规则全部失配，设置卡片悄悄恢复
 * 了宿主圆角。
 *
 * @module seam.test
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { readConfig } from './config.ts'
import { createAttributeLease } from './dom-lease.ts'
import { BODY_ATTRIBUTE, SEAM } from './seam.ts'

const MATERIAL_CSS = readFileSync(new URL('./material.module.css', import.meta.url), 'utf8')
const AMBIENT_CSS = readFileSync(new URL('./ambient.module.css', import.meta.url), 'utf8')

/** 两份样式表都要过同一套作用域检查 —— 新增样式表时也要登记在这里。 */
const STYLESHEETS: ReadonlyArray<readonly [string, string]> = [
  ['material.module.css', MATERIAL_CSS],
  ['ambient.module.css', AMBIENT_CSS],
]

/** 所有样式表拼在一起，供「缝合点是否被某条规则用到」这类跨文件断言。 */
const ALL_CSS = STYLESHEETS.map(([, css]) => css).join('\n')

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** `@keyframes` 的帧选择器（from / to / 45%）不是元素选择器，要跳过。 */
const KEYFRAME_STOP = /^(?:from|to|\d+(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d+(?:\.\d+)?%))*$/

/** 从 CSS 文本里抽出所有顶层规则的选择器。 */
function selectorsOf(css: string): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const found: string[] = []
  const re = /(^|[};])\s*([^{}@;]+?)\s*\{/gm
  let match: RegExpExecArray | null
  while ((match = re.exec(clean)) !== null) {
    const selector = match[2]?.trim()
    if (selector === undefined || selector.length === 0) continue
    if (selector.startsWith('@') || KEYFRAME_STOP.test(selector)) continue
    found.push(selector)
  }
  return found
}

const SELECTORS = selectorsOf(MATERIAL_CSS)
const ALL_SELECTORS = STYLESHEETS.flatMap(([, css]) => selectorsOf(css))

describe('seam 契约（样式表 ↔ seam.ts）', () => {
  it('样式表可读且不是空的', () => {
    for (const [name, css] of STYLESHEETS) {
      expect(squash(css).length, `${name} 是空的`).toBeGreaterThan(200)
    }
  })

  it('解析出了规则（解析器或文件格式坏了要立刻发现）', () => {
    expect(SELECTORS.length).toBeGreaterThanOrEqual(8)
    // 两份样式表合计的下限（当前 28 条）。数字取小一点，只用来发现解析器失效。
    expect(ALL_SELECTORS.length).toBeGreaterThanOrEqual(20)
  })

  it.each(Object.entries(SEAM))('缝合点 %s 原样出现在样式表里', (key, selector) => {
    expect(squash(ALL_CSS), `${key} → ${selector} 在任何一份样式表里都找不到`).toContain(squash(selector))
  })

  it.each(STYLESHEETS)('%s 的每条规则都以 body 总开关属性为作用域前缀', (name, css) => {
    const offenders = selectorsOf(css).filter((selector) => !selector.startsWith(`body[${BODY_ATTRIBUTE}]`))
    expect(offenders, `${name} 里未受总开关约束的规则：\n${offenders.join('\n')}`).toEqual([])
  })

  it('浅深两态都有定义', () => {
    const dark = SELECTORS.filter((selector) => selector.includes('[data-ds-dark-theme]'))
    expect(dark.length).toBeGreaterThan(0)
    // 有一条不带深色限定的基础变量块，深色块才有东西可覆盖。
    expect(SELECTORS.some((s) => s.startsWith(`body[${BODY_ATTRIBUTE}]`) && !s.includes('data-ds-dark-theme'))).toBe(true)
  })

  it('玻璃三要素齐备：backdrop-filter / 边框 / 圆角', () => {
    expect(MATERIAL_CSS).toContain('backdrop-filter')
    expect(MATERIAL_CSS).toContain('-webkit-backdrop-filter')
    expect(MATERIAL_CSS).toMatch(/border-radius/)
  })

  it('流体背景板的容器、canvas 与小鱼都有样式', () => {
    for (const hook of ['[data-dsh-aqua-ambient]', '[data-dsh-aqua-fluid-canvas]', '[data-aqua-critter]']) {
      expect(squash(AMBIENT_CSS), `ambient.module.css 里找不到 ${hook}`).toContain(hook)
    }
    // 流体板必须落在内容之下、body 背景之上。
    expect(squash(AMBIENT_CSS)).toContain('z-index: -1')
  })

  it('承载 --dsw-alias-bg-base 的框架层被置为透明（否则流体整块被盖住）', () => {
    const rule = squash(MATERIAL_CSS)
    expect(rule).toContain('_frame')
    expect(rule).toMatch(/_frame'\][^{]*\{[^}]*background: transparent/)
  })
})

/** 不依赖 jsdom 的最小元素桩，够 dom-lease 用。 */
function stubElement(initial: Record<string, string> = {}): {
  element: HTMLElement
  attrs: Map<string, string>
} {
  const attrs = new Map(Object.entries(initial))
  const element = {
    getAttribute: (name: string): string | null => attrs.get(name) ?? null,
    setAttribute: (name: string, value: string): void => void attrs.set(name, value),
    removeAttribute: (name: string): void => void attrs.delete(name),
  } as unknown as HTMLElement
  return { element, attrs }
}

describe('body 属性租约', () => {
  it('单个租约：获取时写入，释放时移除', () => {
    const { element, attrs } = stubElement()
    const lease = createAttributeLease(element, 'data-x')
    lease.acquire()
    expect(attrs.get('data-x')).toBe('')
    lease.release()
    expect(attrs.has('data-x')).toBe(false)
  })

  it('多个租约：最后一个释放才恢复原值', () => {
    const { element, attrs } = stubElement({ 'data-x': 'original' })
    const a = createAttributeLease(element, 'data-x')
    const b = createAttributeLease(element, 'data-x')
    a.acquire()
    b.acquire()
    a.release()
    expect(attrs.get('data-x')).toBe('') // b 还持有，值不能被恢复
    b.release()
    expect(attrs.get('data-x')).toBe('original')
  })

  it('重复 acquire / release 是幂等的', () => {
    const { element, attrs } = stubElement()
    const lease = createAttributeLease(element, 'data-x')
    lease.acquire()
    lease.acquire()
    lease.release()
    expect(attrs.has('data-x')).toBe(false)
    lease.release() // 不应抛错
    expect(attrs.has('data-x')).toBe(false)
  })

  it('外部改写过的属性不被强行恢复', () => {
    const { element, attrs } = stubElement({ 'data-x': 'original' })
    const lease = createAttributeLease(element, 'data-x')
    lease.acquire()
    attrs.set('data-x', 'someone-else') // 别的插件接管了
    lease.release()
    expect(attrs.get('data-x')).toBe('someone-else')
  })
})

/** 最小 localStorage 桩。 */
function stubStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (key: string): string | null => map.get(key) ?? null,
    setItem: (key: string, value: string): void => void map.set(key, value),
    removeItem: (key: string): void => void map.delete(key),
    clear: (): void => map.clear(),
    key: (): string | null => null,
    length: 0,
  } as Storage
}

describe('配置读取', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('没有 localStorage 时退回默认值', () => {
    expect(readConfig().enabled).toBe(true)
  })

  it('坏 JSON 不抛错，退回默认值', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: stubStorage({ 'dsh-aqua-glass': '{oops' }), configurable: true })
    expect(readConfig().blur).toBe(18)
  })

  it('越界数值被夹到合法区间', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: stubStorage({ 'dsh-aqua-glass': JSON.stringify({ blur: 999, frost: -3, radius: 'x' }) }),
      configurable: true,
    })
    const config = readConfig()
    expect(config.blur).toBe(60)
    expect(config.frost).toBe(0)
    expect(config.radius).toBe(14)
  })

  it('总开关可以关掉', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: stubStorage({ 'dsh-aqua-glass': JSON.stringify({ enabled: false }) }),
      configurable: true,
    })
    expect(readConfig().enabled).toBe(false)
  })
})
