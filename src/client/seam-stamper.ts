/**
 * L1 运行时盖章器 —— 缝合层的**探针**部分。
 *
 * ## 为什么需要它
 *
 * 宿主 DOM 里有一部分结构没有语义属性可用，只能靠 CSS Module 类名片段或
 * 结构关系去找；而其中几条必须**只命中唯一一个元素**（`querySelector` 语义），
 * 例如侧栏内容根 —— 设置面板内部也有一个 `root`，`querySelectorAll` 会把两处
 * 都选中，把设置面板的行挤成竖排文字。
 *
 * JS 盖章解决这件事：在运行时用探针找到元素，打上稳定的 `data-aqua-*` 属性，
 * 样式表只认这些属性。于是选择器的脆弱性被**收敛到这一个文件**，而且探针可以
 * 带 `first` 语义、可以随 React 重挂自动补章。
 *
 * ## 与上游的关系
 *
 * 探针选择器逐条取自 `reference/repos/aqua-upstream/src/client/seam-stamper.ts`。
 * 改动只有一处：属性前缀从 `data-dsh-*` 换成本插件自己的 `data-aqua-*`，
 * 避免与上游皮肤同时安装时互相抢属性。
 *
 * ⚠️ 许可证：上游那份的 `LICENSE` 文件是 **GNU AGPL-3.0**（它的 `package.json`
 * 写的是 MIT —— 自相矛盾，以 LICENSE 文件为准）。本仓库因此整体采用 AGPL-3.0，
 * 见根目录 `LICENSE` 与 README 的「许可」一节。
 *
 * 盖章是幂等的，且在总开关关闭时**无害**（样式表整体以 body 属性为作用域），
 * 所以关闭主题时不摘章 —— "关"依然呈现原样界面。
 *
 * @module seam-stamper
 */

/** 盖章用的属性名。样式表只认这些。 */
export const STAMP = {
  /** 布局框架层：侧栏列的直接父。承载 `--dsw-alias-bg-base`，必须置透明。 */
  FRAME: 'data-aqua-frame',
  /** 侧栏内容根（列下**最靠上**的那个 `root`）。 */
  SIDEBAR_ROOT: 'data-aqua-sidebar-root',
  /** 新建会话按钮。 */
  SURFACE: 'data-aqua-surface',
  /** 轨迹视图（当前唯一一个 composer-overlay 视图）。 */
  TRAJECTORY: 'data-aqua-trajectory',
  /** 右侧详情列的内容根。 */
  DETAILS: 'data-aqua-details',
  /** 发送栏根：发送卡片的直接父（卡片 + 其下方数据栏被视为一整块玻璃）。 */
  INPUTBAR: 'data-aqua-inputbar',
  /** 发送栏左侧的「+」按钮。 */
  ADD: 'data-aqua-add',
  /** 发送栏下方的数据/统计行（composer.dock 槽）。 */
  STATS: 'data-aqua-stats',
  /** 侧栏品牌标（铭牌）。 */
  WORDMARK: 'data-aqua-wordmark',
} as const

export type StampName = keyof typeof STAMP

interface Seam {
  /** 要盖的属性。 */
  readonly attribute: string
  /** 找元素的探针选择器。 */
  readonly selector: string
  /** 只盖最靠上的一个匹配（`querySelector` 语义），而不是所有后代匹配。 */
  readonly first?: boolean
}

/**
 * 探针表。每条都注明它在 0.2.0-rc.2 上的实测状态。
 * 复现计数：`node reference/probe/asar-tree.mjs grep "<片段>" /dsh/node_modules/@deepseek-ai`
 */
const SEAMS: readonly Seam[] = [
  // 布局框架层 = 侧栏列的直接父。`:has()` 只在 JS 里用（CSS 里用它代价高）。
  { attribute: STAMP.FRAME, selector: ':has(> [class*="sidebarCol"])' },
  // 侧栏内容根：列下最靠上的 `root`。设置面板内部也有 `root` 但更深，故取首个。
  { attribute: STAMP.SIDEBAR_ROOT, selector: '[class*="sidebarCol"] [class*="root"]', first: true },
  // 新建会话按钮（raised surface 缝合点）。
  { attribute: STAMP.SURFACE, selector: 'button[class*="newSession"]' },
  // 轨迹视图。
  { attribute: STAMP.TRAJECTORY, selector: '[data-conversation-composer-overlay]' },
  // 右侧详情列。⚠️ 0.2.0-rc.2 上 `detailsCol` 已归零（右侧面板换成了
  // `dsh-client-ui-sidebar-right`），本条目前是死章，等 S3 重定位。
  { attribute: STAMP.DETAILS, selector: '[class*="detailsCol"] [class*="root"]', first: true },
  // 发送栏根：发送卡片的直接父。
  { attribute: STAMP.INPUTBAR, selector: ':has(> [data-composer-card])' },
  // 发送栏的「+」按钮。
  { attribute: STAMP.ADD, selector: '[data-composer-card] [class*="add"]' },
  // 发送栏下方的数据行（composer.dock 槽）。底部那块白色就是它。
  { attribute: STAMP.STATS, selector: '[data-slot="conversation.composer.dock"] [class*="root"]' },
  // 侧栏品牌标（铭牌按钮）。
  { attribute: STAMP.WORDMARK, selector: '[class*="sidebarCol"] [class*="brand"]', first: true },
]

function stamp(seam: Seam): void {
  if (seam.first === true) {
    const element = document.querySelector(seam.selector)
    if (element !== null && !element.hasAttribute(seam.attribute)) element.setAttribute(seam.attribute, '')
    return
  }
  for (const element of document.querySelectorAll(seam.selector)) {
    if (!element.hasAttribute(seam.attribute)) element.setAttribute(seam.attribute, '')
  }
}

/** 盖一轮。幂等：已盖过的元素不重复写。 */
function stampAll(): void {
  for (const seam of SEAMS) stamp(seam)
}

/**
 * 盖章一次，并跟随 React 的重挂持续补章。
 *
 * MutationObserver 的回调**按帧合并**：上游是每次 mutation 全量重扫，这里加了
 * 一道 requestAnimationFrame 去抖 —— React 渲染一屏会产生成百上千条记录，
 * 逐条重扫是纯浪费。
 *
 * @returns disposer：断开观察者（已盖的章保留，关闭主题时它们无害）。
 */
export function startSeamStamper(): () => void {
  stampAll()
  let frame = 0
  const observer = new MutationObserver(() => {
    if (frame !== 0) return
    frame = requestAnimationFrame(() => {
      frame = 0
      stampAll()
    })
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    if (frame !== 0) cancelAnimationFrame(frame)
  }
}
