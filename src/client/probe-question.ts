/**
 * ⚠️⚠️ **临时探针 —— 用完即删**（排查「提问弹窗标题部分实心」专用）。
 *
 * 为什么需要它：这个 App 里开不了能用的 DevTools ——
 *   · nav 栏是 Electron 的原生标题栏覆盖层（`titleBarOverlay`），画在**所有内容之上**，
 *     所以 DevTools 顶部那行标签永远被它盖住、点不到；
 *   · 界面本体跑在 `WebContentsView` 里（`platform-view.ts`），它的边界由主进程算，
 *     **不给停靠的 DevTools 让位** → 界面会压在 DevTools 左半边。
 * 两条都在主进程/系统层，插件的 CSS 够不着。于是把要查的数据直接打在屏幕上，
 * 用户截一张图即可（不用 F12）。
 *
 * 它回答的问题：那张卡片的**标题带**到底是谁画的 ——
 *   · 卡片/每个直接子元素的 `background`、`backdrop-filter`
 *   · 在「标题带 / 标题下方 / 选项区」三个高度上做 `elementsFromPoint`，
 *     把**命中链**打出来（最上面那个元素就是肉眼看到的那一层）
 *
 * 只在 `[data-question-key]` 存在时显示（弹窗关了就自动消失）。
 *
 * @module probe-question
 */
import { QUESTION_PANEL } from './seam.ts'

/** 探针面板的 id（与主题样式无关，纯内联样式）。 */
const PANEL_ID = 'dsh-aqua-glass-probe'

/** 把哈希类名压成可读的语义名（`_card_1a2b3_7` → `_card`）。 */
function shortClass(el: Element): string {
  const raw = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className : ''
  const names = raw
    .split(/\s+/)
    .map((name) => name.replace(/_[A-Za-z0-9]+$/, ''))
    .filter((name) => name !== '')
    .slice(0, 2)
    .join(' ')
  return names === '' ? '-' : names.slice(0, 34)
}

/** 一个元素的关键 computed 值，单行。 */
function describe(el: Element): string {
  const cs = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'bg=透明' : `bg=${cs.backgroundColor}`
  const bf = cs.backdropFilter === 'none' ? '' : `  bf=${cs.backdropFilter}`
  const pos = cs.position === 'static' ? '' : ` pos=${cs.position}`
  return `${el.tagName.toLowerCase()}.${shortClass(el)}  ${bg}${bf}${pos}  h=${Math.round(rect.height)}`
}

/** 三个采样高度（相对卡片顶边）。 */
const SAMPLES: ReadonlyArray<readonly [string, number]> = [
  ['标题带', 30],
  ['标题下方', 62],
  ['选项区', 110],
]

/** 采集一份快照文本。 */
function snapshot(): string {
  const frame = document.querySelector(QUESTION_PANEL)
  if (frame === null) return '（当前没有提问弹窗）'
  const card = frame.firstElementChild
  if (card === null) return '（frame 里没有卡片）'

  const rect = card.getBoundingClientRect()
  const cx = Math.round(rect.left + rect.width / 2)
  const lines: string[] = [
    `[探针] 提问弹窗 · ${new Date().toLocaleTimeString()}`,
    `frame  ${describe(frame)}`,
    `card   ${describe(card)}`,
  ]
  for (const child of Array.from(card.children)) lines.push(`   ↳   ${describe(child)}`)
  lines.push(`card 顶/底 = ${Math.round(rect.top)} / ${Math.round(rect.bottom)}`)

  for (const [label, dy] of SAMPLES) {
    const stack = document.elementsFromPoint(cx, Math.round(rect.top + dy)).slice(0, 4)
    lines.push(`— ${label}（y = card顶+${dy}）命中链（最上层在前）：`)
    for (const el of stack) lines.push(`    ${describe(el)}`)
  }
  return lines.join('\n')
}

/**
 * 挂上探针。只有当页面上存在提问弹窗时才显示面板。
 *
 * @returns disposer：停掉定时器并移除面板。
 */
export function mountQuestionProbe(): () => void {
  const existing = document.getElementById(PANEL_ID)
  if (existing !== null) existing.remove()

  const panel = document.createElement('pre')
  panel.id = PANEL_ID
  // 全内联样式：不依赖本主题的任何变量，也不受主题影响。
  panel.style.cssText = [
    'position:fixed',
    'left:8px',
    'bottom:8px',
    'z-index:2147483647',
    'margin:0',
    'padding:8px 10px',
    'max-width:min(660px, calc(100vw - 16px))',
    'max-height:70vh',
    'overflow:auto',
    'white-space:pre-wrap',
    'word-break:break-all',
    'pointer-events:none',
    'background:#0a0e14',
    'color:#cfe0f5',
    'border:1px solid #4a6fa5',
    'border-radius:8px',
    'font:11px/1.45 ui-monospace, Consolas, monospace',
  ].join(';')

  let visible = false
  const tick = (): void => {
    const hasPopup = document.querySelector(QUESTION_PANEL) !== null
    if (!hasPopup) {
      if (visible) {
        panel.remove()
        visible = false
      }
      return
    }
    if (!visible) {
      document.body.append(panel)
      visible = true
    }
    panel.textContent = snapshot()
  }

  tick()
  const timer = window.setInterval(tick, 600)
  return () => {
    window.clearInterval(timer)
    panel.remove()
  }
}
