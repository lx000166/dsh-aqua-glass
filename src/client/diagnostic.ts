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
import { COMPOSER_CARD, FRAME, NEW_SESSION, SIDEBAR, SIDEBAR_SURFACE, TOPBAR } from './seam.ts'

/** 角标上报的缝合点。 */
const PROBES: ReadonlyArray<readonly [string, string]> = [
  ['框架层', FRAME],
  ['侧栏', SIDEBAR],
  ['侧栏面', SIDEBAR_SURFACE],
  ['顶栏', TOPBAR],
  ['发送栏', COMPOSER_CARD],
  ['新建', NEW_SESSION],
  ['流体板', '[data-dsh-aqua-fluid-canvas]'],
]

const BADGE_ID = 'dsh-aqua-glass-diagnostic'

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

  const render = (): void => {
    const lines = PROBES.map(([label, selector]) => {
      const count = document.querySelectorAll(selector).length
      return `${count > 0 ? '✓' : '✗'} ${label} ${count}`
    })
    badge.textContent = `Aqua ${version}\n${lines.join('\n')}`
  }

  render()
  document.body.appendChild(badge)
  const timer = setInterval(render, 1000)

  return () => {
    clearInterval(timer)
    badge.remove()
  }
}
