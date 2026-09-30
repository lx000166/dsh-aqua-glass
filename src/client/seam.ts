/**
 * L1 缝合层 —— 本插件**唯一**与宿主 DOM 耦合的文件。
 *
 * DSH 升级后选择器断了，只改这里，然后跑 `pnpm test`。
 *
 * ## 为什么用 `:is(data 属性, CSS Module 类名)` 两条腿
 *
 * 实测 dsh-desktop 0.2.0-rc.2（app.asar，121,348,951 字节）：
 * 宿主确实会发出一批语义化 `data-*` 属性（见 docs/CONTRACT-AUDIT.md 的
 * 锚点表），但**不是所有结构都有**。最典型的是主列：
 * `data-pane` 在整个 asar 里出现 **0 次**，所以
 * `:is([data-pane='sidebar'], [class*='sidebarCol'])` 的前半支是死支，
 * 真正命中侧栏的是 CSS Module 哈希类名里的 `sidebarCol`
 * （`dsh-client-ui-layout/lib/client.js`，17 次）。
 *
 * 所以两条腿都写：`data-*` 是更好的锚点（语义稳定、可读），类名片段是
 * 兜底（不是契约，但当前是唯一可用的底座）。哪天真有了 `data-pane`，
 * 前半支自动接管，不需要改 CSS。
 *
 * 参照实现：`reference/repos/deep-whale/maid-atelier/src/client/index.ts`
 * 顶部常量表与本文件的写法同源。
 *
 * @module seam
 */

/** 挂在 `document.body` 上的总开关标记 —— 所有 CSS 规则都以它为前缀。 */
export const BODY_ATTRIBUTE = 'data-dsh-aqua-glass'

// ── 结构 ──────────────────────────────────────────────────────────────────

/** 左侧栏整列。0.2.0-rc.2 上由 `sidebarCol` 兜底命中。 */
export const SIDEBAR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"

/** 会话区（中）整列。0.2.0-rc.2 上由 `centerCol` 兜底命中。 */
export const CONVERSATION = ":is([data-pane='conversation'], [class*='centerCol'])"

/**
 * 侧栏真正承载背景的那一层。宿主把可滚动内容放在列的直接子 `div` 上，
 * 玻璃要打在它上面，而不是列表里 —— 打在列本身会被子级不透明背景盖住。
 */
export const SIDEBAR_SURFACE = `${SIDEBAR} > div`

/**
 * 应用框架层：宿主在这里画 `--dsw-alias-bg-base` 底色。它若不透明，流体
 * 背景板被整块挡住，玻璃也就跟着没了 —— 所以必须置为透明。
 *
 * 0.2.0-rc.2 实测：`dsh-client-ui-layout` 产物里**只有一个**类名含 `frame`
 * （`.BynINW_frame`，声明 `background:var(--dsw-alias-bg-base)`）。哈希前缀
 * 会随重建变化，但 lightningcss 的命名格式是 `[hash]_[local]`，`_frame`
 * 后缀是稳的。
 *
 * ⚠️ 这是本项目**唯一**没有 `data-*` 兜底的缝合点。宿主哪天给框架层补了语义
 * 属性，应立刻改用它。已登记在 docs/CONTRACT-AUDIT.md。
 */
export const FRAME = "[class*='_frame']"

// ── 表面（S0 三个验收面） ─────────────────────────────────────────────────

/** 会话区顶栏。 */
export const TOPBAR = `${CONVERSATION} header[class*='header']`

/** 发送栏卡片。宿主自带 `data-composer-card`，是可靠锚点。 */
export const COMPOSER_CARD = '[data-composer-card]'

/** 新建会话按钮。 */
export const NEW_SESSION = `button[class*='newSession']`

/** 侧栏品牌行（铭牌区）。 */
export const BRAND_ROW = `[class*='logoRow']`

/** 侧栏底部的设置入口。 */
export const SETTINGS_TRIGGER = "[data-slot='sidebar.settings'] > :is(button, [role='button'])"

// ── 状态 ──────────────────────────────────────────────────────────────────

/** 深色态。宿主把它放在 `<body>` 上。 */
export const DARK = '[data-ds-dark-theme]'

/** 空白会话（英雄区）。 */
export const PHASE_HERO = "[data-phase='hero']"

/** 有会话进行中。 */
export const PHASE_ACTIVE = "[data-phase='active']"

/**
 * 全部缝合点的登记表。`seam.test.ts` 逐条断言它们**原样出现在样式表里**，
 * 所以删规则、改选择器都会被测试挡住 —— 这是本项目对 DSH 升级的第一道防线。
 */
export const SEAM = {
  SIDEBAR,
  CONVERSATION,
  SIDEBAR_SURFACE,
  FRAME,
  TOPBAR,
  COMPOSER_CARD,
  NEW_SESSION,
  BRAND_ROW,
  SETTINGS_TRIGGER,
  DARK,
  PHASE_HERO,
  PHASE_ACTIVE,
} as const

export type SeamKey = keyof typeof SEAM
