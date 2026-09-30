/**
 * L1 缝合层 —— 本插件与宿主 DOM 耦合的**唯一**出口。
 *
 * DSH 升级后选择器断了，只改这里（以及 `seam-stamper.ts` 的探针表），
 * 然后跑 `pnpm test`。
 *
 * ## 三层结构
 *
 * 1. **探针**（`seam-stamper.ts`）：JS 里用类名片段 / 结构关系找元素。
 *    只有 JS 能做「只取最靠上的一个匹配」这件事。
 * 2. **盖章**：探针命中的元素被打上 `data-aqua-*` 属性。
 * 3. **选择器**（本文件）：样式表只认盖章属性，外加宿主自己发出的语义
 *    `data-*`（`data-composer-card` / `data-phase` / `data-slot` …）。
 *
 * 把脆弱性收敛到探针表的好处是：升级断了，改的是一张表，不是散落全篇的
 * 选择器；而且探针的失败是**可观测的**（`seam.test.ts` 与诊断角标都读它）。
 *
 * ## 为什么不直接 `:is([data-pane='sidebar'], [class*='sidebarCol'])`
 *
 * 实测 dsh-desktop 0.2.0-rc.2：`data-pane` 在整个 asar 里出现 **0 次**，
 * 前半支是死支。真正命中侧栏的只有 CSS Module 类名片段 `sidebarCol`。
 * 宿主哪天补上语义属性，只需改探针表一处。
 *
 * @module seam
 */
import { STAMP } from './seam-stamper.ts'

/** 挂在 `document.body` 上的总开关标记 —— 所有 CSS 规则都以它为前缀。 */
export const BODY_ATTRIBUTE = 'data-dsh-aqua-glass'

// ── 结构 ──────────────────────────────────────────────────────────────────

/** 左侧栏整列。0.2.0-rc.2 上由 `sidebarCol` 兜底命中。 */
export const SIDEBAR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"

/** 会话区（中）整列。0.2.0-rc.2 上由 `centerCol` 兜底命中。 */
export const CONVERSATION = ":is([data-pane='conversation'], [class*='centerCol'])"

/**
 * 侧栏内容根（列下最靠上的那个 `root`）。
 *
 * ⚠️ 它**必须唯一**：设置面板内部也有一个 `root`，宽泛的 `[class*='root']`
 * 会连它一起选中，把设置面板的行挤成竖排文字。所以靠运行时盖章的
 * `first: true` 语义，而不是让 CSS 自己猜。
 */
export const SIDEBAR_ROOT = `[${STAMP.SIDEBAR_ROOT}]`

/**
 * 应用框架层 = **侧栏列的直接父**。宿主在这里画 `--dsw-alias-bg-base` 底色，
 * 它若不透明，流体背景板就被整块挡住。
 *
 * 探针是 `:has(> [class*="sidebarCol"])`（只在 JS 里用 —— CSS 里用 `:has()`
 * 代价高）。之前我拿 `[class*='_frame']` 猜，实测误命中 **7 个**元素。
 */
export const FRAME = `[${STAMP.FRAME}]`

/** 发送栏根：发送卡片的直接父。卡片与其下方数据行靠它融合成一块玻璃。 */
export const INPUTBAR = `[${STAMP.INPUTBAR}]`

/** 发送栏下方的数据/统计行（`conversation.composer.dock` 槽）。 */
export const STATS = `[${STAMP.STATS}]`

/** 发送栏左侧的「+」按钮。 */
export const ADD = `[${STAMP.ADD}]`

/** 轨迹视图。 */
export const TRAJECTORY = `[${STAMP.TRAJECTORY}]`

// ── 表面 ──────────────────────────────────────────────────────────────────

/** 会话区顶栏。 */
export const TOPBAR = `${CONVERSATION} header[class*='header']`

/** 发送栏卡片。宿主自带 `data-composer-card`，是可靠锚点。 */
export const COMPOSER_CARD = '[data-composer-card]'

/** 新建会话按钮。 */
export const NEW_SESSION = `button[class*='newSession']`

/** 侧栏品牌标（铭牌区）。 */
export const WORDMARK = `[${STAMP.WORDMARK}]`

/** 侧栏底部的设置入口。 */
export const SETTINGS_TRIGGER = "[data-slot='sidebar.settings'] > :is(button, [role='button'])"

/**
 * 发送区底座。会话进行中它会画一块不透明底板 + 一条 36px 淡出带，把流体
 * 整块挡住 —— 就是「发送栏下面那块白色」。宿主基础规则特指度是 (0,3,0)，
 * 所以覆盖时把类名选择器**写两遍**提权（上游同款手法）。
 */
export const COMPOSER_SEAT = "[class*='composerSeat']"

// ── 状态 ──────────────────────────────────────────────────────────────────

/** 深色态。宿主把它放在 `<body>` 上。 */
export const DARK = '[data-ds-dark-theme]'

/** 侧栏收起态。宿主把它放在框架层上。 */
export const SIDEBAR_COLLAPSED = '[data-sidebar-collapsed]'

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
  SIDEBAR_ROOT,
  FRAME,
  INPUTBAR,
  STATS,
  TOPBAR,
  COMPOSER_CARD,
  COMPOSER_SEAT,
  NEW_SESSION,
  WORDMARK,
  SETTINGS_TRIGGER,
  DARK,
  SIDEBAR_COLLAPSED,
  PHASE_HERO,
  PHASE_ACTIVE,
} as const

export type SeamKey = keyof typeof SEAM
