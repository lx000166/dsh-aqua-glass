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

const RAW_MATERIAL_CSS = readFileSync(new URL('./material.module.css', import.meta.url), 'utf8')
const RAW_AMBIENT_CSS = readFileSync(new URL('./ambient.module.css', import.meta.url), 'utf8')

/**
 * 前缀里主题属性写两遍是**特指度提权**（理由见 material.module.css 顶部那段说明）：
 * 宿主深色 token 块是 `body[data-ds-dark-theme]`（(0,1,1)），与我们单写一遍的前缀
 * 平手，平手就看 <head> 顺序 —— 冷启动时我们输，整个深色态失效。
 *
 * 下面那些断言关心的是「规则用了哪些选择器与声明」，不是这个提权技巧本身，
 * 所以统一归一化回写一遍；技巧本身由紧随其后的一条**读原始文本**的断言盯着。
 */
const DOUBLED_PREFIX = 'body[data-dsh-aqua-glass][data-dsh-aqua-glass]'
const SINGLE_PREFIX = 'body[data-dsh-aqua-glass]'
const normalizePrefix = (css: string): string => css.replaceAll(DOUBLED_PREFIX, SINGLE_PREFIX)

const MATERIAL_CSS = normalizePrefix(RAW_MATERIAL_CSS)
const AMBIENT_CSS = normalizePrefix(RAW_AMBIENT_CSS)

/** 两份样式表都要过同一套作用域检查 —— 新增样式表时也要登记在这里。 */
const STYLESHEETS: ReadonlyArray<readonly [string, string]> = [
  ['material.module.css', MATERIAL_CSS],
  ['ambient.module.css', AMBIENT_CSS],
]

/** 未归一化的原始文本，供「提权技巧是否还在」这类断言使用。 */
const RAW_STYLESHEETS: ReadonlyArray<readonly [string, string]> = [
  ['material.module.css', RAW_MATERIAL_CSS],
  ['ambient.module.css', RAW_AMBIENT_CSS],
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

  /**
   * ⚠️ 这条盯的是**特指度提权**本身：前缀里的主题属性必须写两遍。
   *
   * 宿主深色 token 块 `body[data-ds-dark-theme]` 是 (0,1,1)，与我们单写一遍
   * `body[data-dsh-aqua-glass]` 平手 —— 平手由 <head> 顺序决定，冷启动时我们输，
   * **整个深色态的 token 覆盖会静默失效**（症状：重启前正常、重启后颜色全变）。
   *
   * 这个「写两遍」很容易被当成冗余清理掉，所以专门钉一条。读的是**原始文本**。
   */
  it('每条规则的前缀都把主题属性写了两遍（特指度提权，别当冗余删掉）', () => {
    for (const [name, raw] of RAW_STYLESHEETS) {
      // 前缀允许缩进（@media 块内的规则），所以按「行内任意位置的选择器起点」匹配。
      // ⚠️ 必须用 matchAll 取**捕获组**：带 /g 的 String.match 只返回整个匹配
      // （会带上分隔符与换行），拿它做前缀判断会误报。
      const prefixPattern = /(?:^|[{};,])\s*(body\[data-dsh-aqua-glass\][^\s{,{]*)/gm
      const prefixes = [...raw.matchAll(prefixPattern)].map((match) => match[1] ?? '')
      expect(prefixes.length, `${name} 没解析出任何规则前缀`).toBeGreaterThan(0)
      const single = prefixes.filter((prefix) => !prefix.startsWith(DOUBLED_PREFIX))
      expect(
        single,
        `${name} 里这些前缀只写了一遍 —— 深色态会输给宿主（平手看注入顺序）：\n${single.join('\n')}`,
      ).toEqual([])
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

  it('玻璃三要素齐备：backdrop-filter / 圆角 / 卡片玻璃配方', () => {
    expect(MATERIAL_CSS).toContain('backdrop-filter')
    expect(MATERIAL_CSS).toMatch(/border-radius/)
    expect(MATERIAL_CSS).toMatch(/--aqua-glass:/)
  })

  /**
   * 材质配方必须是「模糊 + 提饱和」两半。
   *
   * 只做模糊会像一层白雾 —— 这正是"泛白"的观感来源。宿主自己的菜单材质就是
   * `blur(40px) saturate(150%)`（`--dsw-menu-backdrop-filter`），不提饱和的
   * 玻璃在观感上比宿主原生菜单还"假"。这条断言防止后续调参时把 saturate 丢掉。
   */
  it('玻璃滤镜同时包含模糊与提饱和', () => {
    expect(squash(MATERIAL_CSS)).toMatch(
      /--aqua-filter:\s*blur\(var\(--aqua-blur\)\)\s*saturate\(var\(--aqua-saturate\)\)/,
    )
  })

  /**
   * ⚠️ 踩过的坑：`blur` / `frost` / `radius` / `saturate` 是 JS 写到元素**行内
   * 样式**上的，而自定义属性走继承 —— 如果这些默认值被声明在 `body[...]` 上，
   * 那就是"直接作用于 body 的声明"，它**优先于从 html 继承来的值**，行内调节值
   * 会被静默盖掉。所以默认值必须留在 body 作用域内（写 body 行内样式才赢），
   * 而写入目标绝不能是 `documentElement`。
   *
   * 两者是一对：改了其中一个就必须改另一个。这条断言 + 冒烟脚本里的
   * "调节变量没有写在 documentElement 上" 一起把这个配对钉住。
   */
  it('运行时调节变量的默认值声明在 body 作用域（与写入目标配对）', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    for (const token of ['--aqua-blur:', '--aqua-saturate:', '--aqua-frost:', '--aqua-radius:']) {
      const owner = clean.match(/body\[data-dsh-aqua-glass\][^{]*\{[^}]*\}/g)?.some((block) => block.includes(token))
      expect(owner, `${token} 的默认值不在 body 作用域内 —— 行内调节值会被它盖掉`).toBe(true)
    }
    // 反面：不能出现在 :root / html 上（那会让写入目标和默认值分属两个元素层）。
    expect(clean, '可调变量的默认值不应声明在 :root 上').not.toMatch(/:root\s*\{[^}]*--aqua-blur:/)
  })

  /**
   * 这条是踩过坑之后加的：lightningcss 在同一个声明块里同时看到标准与前缀版本的
   * `backdrop-filter` 时会**丢掉标准那一条**，只留 `-webkit-backdrop-filter`；
   * 而 Electron 的 Chromium 忽略该前缀别名 —— 结果四块面板只剩半透明填充、
   * 完全没有模糊，看起来和"主题没生效"一模一样。
   */
  it('绝不写 -webkit-backdrop-filter 前缀（会被 lightningcss 反噬）', () => {
    // 只看声明，不看散文：注释里正当地提到了这个属性名。
    for (const [name, css] of STYLESHEETS) {
      const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '')
      expect(declarations, `${name} 的声明里出现了 -webkit-backdrop-filter`).not.toContain('-webkit-backdrop-filter')
    }
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
    expect(rule).toContain('[data-aqua-frame]')
    expect(rule).toMatch(/\[data-aqua-frame\][^{]*\{[^}]*background: transparent/)
  })

  it('结构缝合点一律走盖章属性，不再用类名片段猜', () => {
    // 同样先剥注释：散文里正当地记录了"以前用类名猜错过"。
    const rule = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    // 这三条过去都是错的：`[class*='_frame']` 误命中 7 个元素、
    // `sidebarCol > div` 不是侧栏内容根、`[class*='logoRow']` 与品牌标无关。
    for (const forbidden of ["[class*='_frame']", "sidebarCol']) > div", "[class*='logoRow']"]) {
      expect(rule, `材质层里仍有类名猜测：${forbidden}`).not.toContain(forbidden)
    }
  })

  it('发送栏下的白块被拿掉，但保持原生布局（不融合）', () => {
    const rule = squash(MATERIAL_CSS)
    // 数据行只去底色，不改位置/尺寸 —— 融合态（整条输入栏合成一块玻璃）已废弃。
    expect(rule).toMatch(/\[data-aqua-stats\]\s*\{[^}]*background: transparent/)
    expect(rule, '不应再有融合态包裹规则').not.toContain('[data-aqua-inputbar]')
    // 会话进行中的发送区底座必须整块拿掉（宿主特指度 (0,3,0)，靠双写类名提权）。
    expect(rule).toContain("[class*='composerSeat'][class*='composerSeat']")
    expect(rule).toMatch(/composerSeat'\]\[class\*='composerSeat'\]\s*\{[^}]*background: none/)
  })

  it('侧栏玻璃画在伪元素上，列本身绝不带 backdrop-filter', () => {
    // 这是踩过坑的不变量：backdrop-filter 会为 position:fixed 后代创建包含块，
    // 而宿主的侧栏开关正是 `position:fixed; left:12px; top:6px`（相对视口）。
    // 玻璃糊在列上，开关就会"偏到 logo 的位置"。
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const columnRule = clean.match(
      /body\[data-dsh-aqua-glass\] :is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(columnRule, '侧栏列规则没解析出来').not.toBe('')
    expect(columnRule, '侧栏列上不能有 backdrop-filter').not.toContain('backdrop-filter')

    const beforeRule = clean.match(
      /body\[data-dsh-aqua-glass\] :is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)::before\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(beforeRule, '侧栏 ::before 规则没解析出来').not.toBe('')
    expect(beforeRule).toContain('backdrop-filter')
    expect(beforeRule).toContain('position: absolute')
  })

  it('发送卡的玻璃也画在伪元素上（否则卡内浮层的模糊会被 backdrop root 吃掉）', () => {
    // ⚠️ 与上面侧栏那条同源，但后果不同：侧栏踩的是「backdrop-filter 为 fixed
    // 后代创建包含块」，这里踩的是「backdrop-filter 让元素成为 backdrop root」——
    // 后代的 backdrop-filter 只能采样**它内部**已画好的东西。
    //
    // 宿主把 `conversation.input.overlay` 槽（InputBar 的 .overlayAnchor）放在
    // 发送卡里，"/" 与 "@" 的候选菜单、popupSelect 面板都从这里长出来；而它们
    // 定位在卡的上边缘**之外**（bottom: calc(100% + 4px)）。于是浮层那句
    // `blur(40px)`（宿主 --dsw-menu-backdrop-filter）采样到的是"卡外面"的空，
    // **静默失效** —— 只剩 58% 半透明白底，底下的对话文字原样透上来，读不清。
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const cardRule = clean.match(
      /body\[data-dsh-aqua-glass\] \[data-composer-card\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(cardRule, '发送卡规则没解析出来').not.toBe('')
    expect(cardRule, '发送卡上不能有 backdrop-filter').not.toContain('backdrop-filter')
    // 伪元素敢用 z-index: -1 的前提是卡自己成层叠上下文；否则那层玻璃会掉到
    // 转写区底下（卡上还有 z-index: 8 负责压住转写区）。
    expect(cardRule, '发送卡必须自建层叠上下文，::before 的 -1 才安全').toMatch(/z-index:\s*\d/)
    // ⚠️ 宿主 `.card` 自己画着一层 `--dsw-specific-input-major`（本主题里 = --aqua-well，
    // 深色态是 40% 蓝灰）。以前我们用 `background: var(--aqua-glass)` 把它替换掉了；
    // 填充搬去伪元素后若不显式置透明，这层宿主底色就会压在玻璃**下面**，被
    // backdrop-filter 一起采样 → 卡比侧栏/顶栏更实、还发蓝（用户实测报障）。
    expect(
      cardRule,
      '卡上必须显式 background: transparent —— 否则宿主那层输入底色会从玻璃底下透出来',
    ).toContain('background: transparent')

    const beforeRule = clean.match(
      /body\[data-dsh-aqua-glass\] \[data-composer-card\]::before\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(beforeRule, '发送卡 ::before 规则没解析出来').not.toBe('')
    expect(beforeRule, '玻璃的模糊必须在伪元素上').toContain('backdrop-filter')
    // 填充也必须跟着走：留在卡上，伪元素模糊到的就是卡自己那块纯色底。
    expect(beforeRule).toContain('background: var(--aqua-glass)')
    expect(beforeRule).toContain('z-index: -1')

    // 兜底扫描：凡是**以发送卡结尾**（即瞄准卡本身，不是它的后代）的规则，
    // 都不许再带回 backdrop-filter —— hero / active 那两条投影规则是最容易
    // 被顺手加回去的地方，而发送键那条规则瞄的是后代，不在扫描范围内。
    const offenders = [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(match => /\[data-composer-card\]$/.test((match[1] ?? '').trim()))
      .filter(match => (match[2] ?? '').includes('backdrop-filter'))
      .map(match => (match[1] ?? '').trim())
    expect(offenders, `这些规则又把 backdrop-filter 加回发送卡了：\n${offenders.join('\n')}`).toEqual([])
  })

  it('侧栏内容根的自带底色被置透明（否则盖住列的玻璃）', () => {
    const rule = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(rule).toMatch(/\[data-aqua-sidebar-root\]\s*\{[^}]*background: transparent/)
  })

  it('原生标题栏设为透明（nav 栏才能与流体融为一体）', () => {
    const rule = squash(MATERIAL_CSS)
    // preload 用隐藏探针读 --dsw-specific-sidebar-fill 的计算值当标题栏底色；
    // 主进程的 validColor 正则接受 rgba(0, 0, 0, 0)，窗口本身 transparent: true。
    expect(rule).toMatch(/--dsw-specific-sidebar-fill:\s*transparent/)
  })

  it('卡片描边用 mask 裁环，不用两层背景', () => {
    const rule = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(rule, '缺 --aqua-edge 渐变定义').toContain('--aqua-edge:')
    // ⚠️ 这条是踩过坑的：`border-box`/`padding-box` 两层背景里，border-box 层铺的是
    // 整个元素盒子而不是边框那一圈，半透明玻璃盖不住它，渐变会从整块卡片透出来。
    // 所以描边必须用 mask 裁成 1px 环。
    expect(rule, '不该再用 padding-box/border-box 两层背景做描边').not.toContain('padding-box')
    expect(
      rule.match(/mask-composite: exclude/g)?.length ?? 0,
      '侧栏/顶栏/发送栏三处 mask 描边',
    ).toBeGreaterThanOrEqual(3)
  })

  it('转写区内的内容表面改走玻璃（bg-base 只在容器的子树里降透明）', () => {
    const rule = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    // 工具卡与代码块标题栏都用全局基色当底色；按类名追必然打偏（实测两轮）。
    // 正解是把覆盖限定在转写滚动容器内部 —— 范围外 body/框架层读到的仍是根值。
    expect(rule).toMatch(
      /body\[data-dsh-aqua-glass\] \[data-conversation-scroll\]\s*\{[^}]*--dsw-alias-bg-base:\s*var\(--aqua-well\)/,
    )
  })

  it('内容表面（代码块/行内代码/文件卡/侧栏按钮）走 token 覆盖', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = squash(clean)
    // 这些表面全部挂在宿主 CSS 变量上，覆盖变量一次即可全改。
    for (const token of [
      '--dsw-alias-markdown-code-block:',
      '--dsw-alias-markdown-code-block-banner:',
      '--dsw-alias-markdown-inline-code:',
      '--dsw-specific-input-major:',
      '--dsw-alias-button-floating-fill:',
    ]) {
      expect(rule, `缺少 ${token} 覆盖`).toContain(token)
    }
    // ⚠️ 全局基色只能在**转写容器子树内**降透明（见上一条断言）；
    // 直接在 body 作用域上改会连 body 与框架层的底色一起塌掉。
    const globalBlocks = clean.match(/body\[data-dsh-aqua-glass\]\s*\{[^}]*\}/g) ?? []
    expect(globalBlocks.length, '没找到 body 全局作用域块').toBeGreaterThan(0)
    for (const block of globalBlocks) {
      expect(block, 'body 全局作用域上不能覆盖 --dsw-alias-bg-base').not.toContain('--dsw-alias-bg-base:')
    }
    // 行内代码只改色不加模糊（几十个 <code> 逐个模糊会掉帧）。
    expect(rule).toMatch(/--dsw-alias-markdown-inline-code:\s*var\(--aqua-well\)/)
  })

  /**
   * 浮层走**专用契约** `--dsw-specific-menu`，不走 `--dsw-alias-bg-layer-*`。
   *
   * 全 asar 扫描的结论（`reference/probe/asar-token-consumers.mjs`）：
   * `--dsw-specific-menu` 的 18 个消费点几乎全部自带 `backdrop-filter`，降透明度
   * 是安全的；而 `--dsw-alias-bg-layer-1` 有 35+ 个消费点，大量是输入框与小控件
   * （`search input` / `address` / 徽章 / 箭头），全局降透明会把它们变成半透明，
   * 且多数位于不透明父面板内、背后没有流体 —— 既糊又白改。
   *
   * 这条断言是给未来的自己看的：别再"顺手"去改 bg-layer。
   */
  it('浮层降透明只走 --dsw-specific-menu，绝不碰 --dsw-alias-bg-layer-*', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(clean, '浮层材质应覆盖 --dsw-specific-menu').toMatch(
      /--dsw-specific-menu:\s*rgb\(240 246 253 \/ 0?\.72\)/,
    )
    expect(clean, '深色态浮层材质缺失').toMatch(/--dsw-specific-menu:\s*rgb\(30 40 54 \/ 0?\.72\)/)
    // 关键防线：bg-layer-* 一个字都不许出现。
    for (const forbidden of [
      '--dsw-alias-bg-layer-1:',
      '--dsw-alias-bg-layer-2:',
      '--dsw-alias-bg-layer-3:',
      '--dsw-alias-settings-card-fill:',
    ]) {
      expect(clean, `不要覆盖 ${forbidden}（35+ 消费点里大量是输入框）`).not.toContain(forbidden)
    }
  })

  /**
   * ⚠️ 共享菜单表面**内部**必须把 `--dsw-specific-menu` 退回菜单自身材质。
   *
   * 菜单底部那条「下面还有内容」的渐隐提示（ui-input-trigger 的
   * `.menu[data-overflow-below]::after`）画的是
   * `linear-gradient(transparent, var(--dsw-specific-menu))` —— 提示的终点色
   * 就是它要融进去的底色。宿主在 Windows 上把该 token 别名成
   * `--dsw-menu-surface-fill`（94% 那两条是 `html[data-platform='darwin']` 专属），
   * 我们改成 72% 之后，提示终点比菜单本体更实、色相更冷，菜单底部就多出
   * 一条 16px 的深色带，滚到底（提示消失）时又没了 —— 用户实测报障。
   *
   * `data-menu-material` 由 ui-primitives 的 MenuSurface 自己发出，
   * 所以这条覆盖对**所有**共享菜单表面生效，且不波及菜单之外那 18 个消费方。
   */
  it('共享菜单内部把 --dsw-specific-menu 退回菜单材质（否则底部渐隐提示露出一条带子）', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = clean.match(
      /body\[data-dsh-aqua-glass\] \[data-menu-material\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(rule, '菜单表面内的 token 回退规则没解析出来').not.toBe('')
    expect(rule, '菜单内部必须用菜单自身材质').toContain('--dsw-specific-menu: var(--dsw-menu-surface-fill)')
  })

  it('侧栏按钮走按钮专用的一档（比卡片更淡），不是卡片玻璃', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const buttonRule = clean.match(/body\[data-dsh-aqua-glass\] button\[class\*='newSession'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(buttonRule, '新建按钮规则没解析出来').not.toBe('')
    // ⚠️ 「新会话」与「记忆」**共用这一条规则** —— 后者是第三方插件
    // @modusensus/dsh-mneme 按生态惯例（sidebar-entry-core）复用 newSession
    // 行样式注入的入口。所以这里是两颗按钮的观感旋钮。
    expect(buttonRule).toContain('background: var(--aqua-pill)')
    expect(buttonRule).toContain('border: 1px solid var(--aqua-pill-line)')
    expect(buttonRule).toContain('backdrop-filter')
    // 渐变描边在这颗小按钮上读起来像装饰，已撤掉。
    expect(squash(clean)).not.toMatch(/button\[class\*='newSession'\]::after/)
    // 按钮档必须明显淡于内容凹槽，否则"白牌子"感会回来。
    const pill = MATERIAL_CSS.match(/--aqua-pill:\s*color-mix\([^;]*?calc\((\d+)%/)
    const well = MATERIAL_CSS.match(/--aqua-well:\s*color-mix\([^;]*?calc\((\d+)%/)
    expect(Number(pill?.[1]), '按钮档应明显淡于 --aqua-well').toBeLessThan(Number(well?.[1]))
  })

  /**
   * 代码块 header 的真凶是 `.bannerWrap`，**不是** `--dsw-alias-markdown-code-block-banner`
   * 那条 token —— 后者只有 CodeCard 组件消费，markdown 代码块根本不用它。
   * 这条断言防止再"顺着 token 名去改一个没人消费的变量"。
   */
  it('代码块 header 直接瞄 banner 元素，并补模糊（它是 sticky）', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    // 选择器是两条并列：类名片段 + 「以工具栏为直接子元素的那层」（后者与构建无关）。
    expect(clean).toContain("[class*='bannerWrap']")
    expect(clean).toContain(':has(> [data-code-block-banner])')
    const bannerRule = clean.match(/:has\(> \[data-code-block-banner\]\)\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(bannerRule, 'banner 规则没解析出来').not.toBe('')
    // ⚠️ 底座**只给模糊、不给填充**：工具栏分支下 header 区本就有三层半透明
    // （.block + .bannerWrap + CodeToolbar.header ≈ 78%），而正文只有两层（≈64%）——
    // 底座再压一层底色，header 就会明显比 body 更像实心。这正是"看不出来改过了"的真身。
    expect(bannerRule).toContain('background-color: transparent')
    expect(bannerRule).not.toContain('background-color: var(--aqua-well)')
    // sticky，会盖在滚动中的代码上，只给半透明会透出底下的字。
    expect(bannerRule).toContain('backdrop-filter')
    // 内层 .banner 的第二层玻璃要撤掉，否则 40% + 40% 叠成 64%，反而更像实心。
    expect(bannerRule).toContain('--dsl-code-block-banner-background-color: transparent')
  })

  /**
   * 会话顶栏：**只调左侧**内边距来配平，绝不覆盖右侧那一对。
   *
   * 宿主是一对设计：`.header { padding: 10px 28px 0 20px }` 配合
   * `.headerCorner { margin-right: -16px }`（最右控件伸进那 28px 里 16px，视觉留白 12px）。
   * 覆盖右侧（简写或 padding-right）就会把最右控件顶到卡片边缘 —— 已踩过一次。
   * 而宿主的左右不对称（左 20 / 视觉右 12）在通栏时看不出来，做成卡片后就明显，
   * 所以左侧单独收到 12px。
   */
  it('会话顶栏只调左侧内边距配平，绝不覆盖右侧那一对', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const headerRule = clean.match(
      /body\[data-dsh-aqua-glass\] :is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\) header\[class\*='header'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(headerRule, '顶栏规则没解析出来').not.toBe('')
    expect(headerRule, '不能动右侧内边距（简写或 padding-right 都不行）').not.toMatch(/padding(-right)?\s*:/)
    expect(headerRule).toContain('padding-left: 12px')
    expect(headerRule).toContain('background: var(--aqua-glass)')
  })

  /**
   * 悬浮提示气泡：宿主是不透明深底 + **硬编码白字**。
   * 只改底色会让浅色态变成白底白字，所以文字色必须一起跟着主题走。
   */
  it('悬浮提示改成玻璃，且文字色跟着主题（否则浅色态白底白字）', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toMatch(/--dsw-alias-tooltip-bg:\s*var\(--aqua-well\)/)
    const tooltipRule = clean.match(/\[role='tooltip'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(tooltipRule, 'tooltip 规则没解析出来').not.toBe('')
    expect(tooltipRule).toContain('color: var(--dsw-alias-label-primary)')
    // 提示浮在内容之上，没有模糊就会透出底下的字。
    expect(tooltipRule).toContain('backdrop-filter')
  })

  it('发送按钮只降品牌蓝的不透明度，不换色，且悬停态同步降档', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toMatch(
      /\[data-composer-card\] button\[class\*='primary'\]\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--dsw-alias-button-info-fill\)/,
    )
    // 悬停必须也降档，否则 70% → 不透明会闪一下。
    expect(clean).toMatch(
      /\[data-composer-card\] button\[class\*='primary'\]:hover:not\(:disabled\)\s*\{[^}]*--dsw-alias-button-info-hover/,
    )
  })

  /**
   * ⚠️ 宿主的收起是「内容保持**冻结的展开宽度**原地淡出（.fading）→ 轨道滑完 →
   * 才套用轨道布局（.railIn/.wide）」。我们那条放开宽度的 `!important` 是行内
   * 样式的覆盖，若不排除运动中的两个类，就会在滑动中把宽度改成"当前动画中的
   * 轨道宽度"，内容逐帧重排 —— 等于顶掉宿主的冻结宽度设计、毁掉那段动画。
   */
  it('侧栏宽度释放让位给宿主的收起动画（排除 .fading / .railIn）', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    const rule = clean.match(/\[data-aqua-frame\]:not\(\[data-sidebar-collapsed\]\)\s*\[data-aqua-sidebar-root\][^{]*\{([^}]*)\}/)?.[0] ?? ''
    expect(rule, '侧栏宽度释放规则没解析出来').not.toBe('')
    expect(rule).toContain(":not([class*='fading'])")
    expect(rule).toContain(":not([class*='railIn'])")
    expect(rule).toContain('width: 100% !important')
  })

  /**
   * ⚠️⚠️ **宿主 bug 的临时补丁 —— 上游修好后连同 `animation-patch.ts` 一起删。**
   *
   * 症状：侧栏收起/展开缺滑动动画。根因在宿主：滑动的过渡由 `frame[data-animating]`
   * 开关，而那个开关靠 `transitionend` 撤下；中途反向切换时浏览器派发的是
   * `transitioncancel`，于是没有事件收尾的那一段瞬间到位。
   *
   * 补丁把过渡属性常驻在框架上。这条断言同时守住"宿主所有需要瞬时的场景"不被误伤 ——
   * 哪天有人图省事把排除项删了，拖拽和窗口缩放就会开始缓动。
   */
  it('【临时补丁】常驻过渡在位，且保留宿主全部「瞬时」排除项', () => {
    const mediaBlock = MATERIAL_CSS.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(mediaBlock, '常驻过渡应包在 prefers-reduced-motion: no-preference 里').toContain(
      'data-dsh-aqua-glass',
    )
    const rule = squash(mediaBlock.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(rule, '常驻过渡规则没解析出来').toContain('grid-template-columns')
    for (const exclusion of ['data-dragging', 'data-rightbar-instant', 'data-aqua-resizing']) {
      expect(rule, `常驻过渡丢了排除项 ${exclusion} —— 宿主靠它保持瞬时`).toContain(exclusion)
    }
  })

  it('侧栏只保留圆角避让的水平内边距（宿主 root 自带 12px）', () => {
    const clean = MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const columnRule = clean.match(
      /body\[data-dsh-aqua-glass\] :is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(columnRule, '侧栏列规则没解析出来').not.toBe('')
    const padding = columnRule.match(/padding:\s*[\d.]+px\s+([\d.]+)px\s+[\d.]+px/)?.[1]
    expect(Number(padding), '水平内边距要 ≤2px，否则与 root 的 12px 叠成两层').toBeLessThanOrEqual(2)
  })

  /**
   * 工作区行悬浮卡：`createPortal` 到 body，没有稳定属性，
   * 靠内容里的 `hoverContent` 用 `:has()` 反查容器。
   */
  it('工作区悬浮卡用 :has(hoverContent) 反查容器（它在 body 上，无属性锚点）', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toMatch(/body\[data-dsh-aqua-glass\] > div:has\(\[class\*='hoverContent'\]\)/)
  })

  it('「+」附件按钮走自己的盖章锚点，而不是动 --dsw-specific-selector', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toMatch(/\[data-aqua-add\]\s*\{[^}]*background:\s*var\(--aqua-pill\)/)
    // 用 inset 描边而不是 border：宿主那颗是 28px 定尺圆钮，加真边框会改盒尺寸。
    expect(clean).toMatch(/\[data-aqua-add\]\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px/)
    expect(clean).not.toContain('--dsw-specific-selector:')
  })

  /**
   * 「已编辑 N 个文件」卡用的是 `--dsw-alias-bg-layer-1`（不是 bg-base），
   * 而 bg-layer-* 全局禁止覆盖（35+ 消费点里大量是输入框与徽章）。
   * 好在卡片自带宿主发出的 `data-changed-files` 语义属性 —— 直接瞄元素、绕开 token。
   */
  it('已编辑文件卡走 data-changed-files 锚点，且不动 bg-layer-*', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toContain('[data-changed-files]')
    // `--changes-fill` 是卡片**在自己身上**声明的局部变量，只有写在同一个元素上
    // 才生效（写祖先会被它自己的声明压掉 —— 与 blur 那次同一个坑）。
    expect(clean).toMatch(/\[data-changed-files\]\s*\{[^}]*--changes-fill:\s*transparent/)
    expect(clean).toMatch(/\[data-changed-files\]\s*\{[^}]*background:\s*var\(--aqua-well\)/)
    // 依旧一个字都不许碰 bg-layer-*。
    expect(clean).not.toContain('--dsw-alias-bg-layer-1:')
  })

  it('我发出的对话气泡改走半透明（宿主默认不透明）', () => {
    const clean = squash(MATERIAL_CSS.replace(/\/\*[\s\S]*?\*\//g, ''))
    expect(clean).toMatch(/--dsw-specific-bubble:\s*var\(--aqua-bubble\)/)
    expect(clean).toContain('--aqua-bubble:')
    // 强调态气泡不动。
    expect(clean).not.toContain('--dsw-specific-bubble-highlight:')
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
    expect(readConfig().blur).toBe(12)
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
