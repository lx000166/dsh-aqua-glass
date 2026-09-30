/**
 * 诊断角标（临时）。
 *
 * 为什么需要它：皮肤类插件最典型的两种失败长得一模一样——**界面完全没变**。
 * 一种是客户端产物根本没加载（网络/组合/工厂抛错），另一种是加载了但选择器
 * 一个都没命中（DSH 结构变了）。肉眼分不出来，控制台又未必打得开。
 *
 * 这个角标把答案写在屏幕上：它只在 `apply` 真正跑过之后出现，并且实时显示
 * 每个缝合点当前命中了多少元素。
 *
 * - **看不到角标** → 浏览器半侧没加载起来，问题在产物/组合/加载。
 * - **角标在但计数全是 0** → 加载正常，选择器失配，问题在 `seam.ts`。
 * - **角标在且计数正常** → 链路全通，界面还没变就纯粹是视觉调参问题。
 *
 * 它往 `document.body` 追加了一个节点（官方规范不鼓励），所以：本轮调试结束、
 * 视觉定稿前必须删掉这个文件与 `config.debug` 开关。
 *
 * @module diagnostic
 */
import { COMPOSER_CARD, CONVERSATION, FRAME, INPUTBAR, NEW_SESSION, SIDEBAR, SIDEBAR_ROOT, STATS, TOPBAR } from './seam.ts'

/** 角标上报的缝合点。 */
const PROBES: ReadonlyArray<readonly [string, string]> = [
  ['框架层', FRAME],
  ['侧栏', SIDEBAR],
  ['侧栏根', SIDEBAR_ROOT],
  ['顶栏', TOPBAR],
  ['发送栏', COMPOSER_CARD],
  ['输入栏', INPUTBAR],
  ['数据行', STATS],
  ['新建', NEW_SESSION],
  ['流体板', '[data-dsh-aqua-fluid-canvas]'],
]

/**
 * **会话专属**探针：它们只存在于会话视图里。
 *
 * 站在插件页 / 设置页时报 0 是**正确的**，不是故障。角标早期把这种情况也当成
 * "有异常"挂出来（用户立刻被误导成主题坏了），所以这些探针在没有会话时
 * 一律显示 `– n/a` 并且**不参与健康判定**。
 */
const CONVERSATION_SCOPED: ReadonlySet<string> = new Set(['顶栏', '发送栏', '输入栏', '数据行'])

/** 桌面端原生标题栏底色该有的值 —— 我们的覆盖必须赢下这条，否则说明被宿主盖掉了。 */
const EXPECTED_TITLEBAR_FILL = 'transparent'

const BADGE_ID = 'dsh-aqua-glass-diagnostic'

/**
 * 读桌面端原生标题栏用的那个变量的**计算值**。
 *
 * 这里是我们与宿主**特指度平手**的地方（我们 `body[data-dsh-aqua-glass]`、
 * 宿主深色态 `body[data-ds-dark-theme]`，都是 (0,1,1)），冷启动时可能输掉；
 * 读出来对不上就说明级联被宿主拿走了 —— 比肉眼比颜色可靠。
 *
 * @returns 计算值；读不到（或为空）返回 null。
 */
function readTitlebarFill(): string | null {
  try {
    const fill = getComputedStyle(document.body).getPropertyValue('--dsw-specific-sidebar-fill').trim()
    return fill === '' ? null : fill
  } catch {
    return null
  }
}

/**
 * 挂上诊断角标。
 *
 * @param version - 包版本，写进角标文案，方便确认页面跑的是哪一版产物。
 * @returns disposer：移除角标并停止刷新。
 */
export function mountDiagnostic(version: string): () => void {
  const badge = document.createElement('div')
  badge.id = BADGE_ID
  badge.setAttribute('role', 'status')
  // 内联样式：不占 CSS module 的类名，也保证不受宿主样式影响。
  Object.assign(badge.style, {
    position: 'fixed',
    right: '10px',
    bottom: '10px',
    zIndex: '2147483647',
    pointerEvents: 'none',
    padding: '6px 10px',
    borderRadius: '8px',
    font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
    color: '#fff',
    background: 'rgb(17 24 39 / 0.92)',
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.35)',
    whiteSpace: 'pre',
  } satisfies Partial<CSSStyleDeclaration>)

  /**
   * 运行时事实探针。
   *
   * 选择器命中了不等于画出来了。「流体背景没显示」有两种截然不同的原因：
   * canvas 没被定尺寸（着色器没跑起来），或者跑起来了但被别的东西盖住。
   * 这几行直接把答案读出来 —— 用 `getComputedStyle` 问"谁在画背景"，
   * 用 canvas 的 client/缓冲尺寸问"着色器有没有干活"。
   *
   * **每个探针都必须能独立失败**：查询类 API 在不同环境里未必齐全
   * （jsdom 没有 `elementFromPoint`），一个探针抛错绝不能把角标甚至整个
   * `apply` 带崩 —— 这条由冒烟脚本覆盖。
   */
  const runtimeLines = (): string[] => {
    const lines: string[] = []

    const canvas = document.querySelector<HTMLCanvasElement>('[data-dsh-aqua-fluid-canvas]')
    if (canvas !== null) {
      let gl = 'n/a'
      try {
        gl = canvas.getContext('webgl2') === null ? 'no-gl' : 'gl-ok'
      } catch {
        gl = 'gl-throw'
      }
      lines.push(`canvas ${canvas.clientWidth}x${canvas.clientHeight} buf ${canvas.width}x${canvas.height} ${gl}`)
    }

    const ambient = document.querySelector<HTMLElement>('[data-dsh-aqua-ambient]')
    if (ambient !== null) {
      try {
        const style = getComputedStyle(ambient)
        lines.push(`amb z=${style.zIndex} pos=${style.position} op=${style.opacity}`)
      } catch {
        lines.push('amb style n/a')
      }
    }

    try {
      const bodyBg = getComputedStyle(document.body).backgroundColor
      const htmlBg = getComputedStyle(document.documentElement).backgroundColor
      lines.push(`body-bg ${bodyBg} html-bg ${htmlBg}`)
    } catch {
      lines.push('bg n/a')
    }

    // 原生标题栏底色：桌面端 preload 读的就是这个变量的计算值。
    const fill = readTitlebarFill()
    lines.push(`标题栏色 ${fill ?? '(未覆盖)'}`)

    // 视口中心点上的元素：如果它带着不透明底色，流体就是被它盖住的。
    if (typeof document.elementFromPoint === 'function') {
      try {
        const probe = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
        if (probe !== null) {
          lines.push(`mid <${probe.tagName.toLowerCase()}> bg ${getComputedStyle(probe).backgroundColor}`)
        }
      } catch {
        lines.push('mid n/a')
      }
    } else {
      lines.push('mid n/a (no elementFromPoint)')
    }
    return lines
  }

  /**
   * 只在**出问题时**展开明细。
   *
   * 一切正常时角标只占一行（`Aqua 0.1.0 ✓`），不挡视线；一旦某个缝合点归零、
   * 或者流体 canvas 没被定尺寸 / 拿不到 WebGL，才把完整清单铺开。
   * 要彻底关掉就把配置里的 `debug` 设成 false。
   */
  const render = (): void => {
    // 没有会话视图时，会话专属探针找不到东西是正常的 —— 不算异常、不铺明细。
    const inConversation = document.querySelector(CONVERSATION) !== null
    const probes = PROBES.map(([label, selector]) => {
      const count = document.querySelectorAll(selector).length
      const na = CONVERSATION_SCOPED.has(label) && !inConversation
      return { label, count, na, ok: count > 0 }
    })
    const runtime = runtimeLines()
    // 标题栏那条是我们与宿主**特指度平手**的地方，最容易在冷启动时输掉。
    // 单独判一次，让"声明被盖掉"这件事在角标上显式可见，而不是靠肉眼比颜色。
    const titlebarFill = readTitlebarFill()
    const cascadeOk = titlebarFill === null || titlebarFill === EXPECTED_TITLEBAR_FILL
    const healthy = probes.every((probe) => probe.na || probe.ok)
      && !runtime.some((line) => line.includes('no-gl') || line.includes('gl-throw') || /buf 0x/.test(line))
      && cascadeOk

    if (healthy) {
      badge.textContent = `Aqua ${version} ✓`
      return
    }
    const lines = probes.map((probe) => (
      probe.na ? `– ${probe.label} n/a（无会话）` : `${probe.ok ? '✓' : '✗'} ${probe.label} ${probe.count}`
    ))
    if (!cascadeOk) lines.push(`✗ 标题栏色被宿主盖掉：读到 ${String(titlebarFill)}，应为 ${EXPECTED_TITLEBAR_FILL}`)
    badge.textContent = `Aqua ${version} — 有异常\n${lines.join('\n')}\n${runtime.join('\n')}`
  }

  render()
  document.body.appendChild(badge)
  const timer = setInterval(render, 1000)

  return () => {
    clearInterval(timer)
    badge.remove()
  }
}
