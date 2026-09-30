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

/**
 * 会话区顶栏。
 *
 * ⚠️ 首选**语义锚点**：宿主给窗口拖拽区打的 `data-window-drag`，
 * 且顶栏自己会发出 `data-conversation-header-leading` 子节点
 * （`ConversationHeader.tsx:18-19`，全宿主只此一处）。
 *
 * ⚠️⚠️ 回退支 `header[class*='header']` 是**踩过坑的**：CSS Module 的哈希类名里
 * 保留着语义词，提问弹窗的标题恰好就是 `<header class="…_header_…">`、又长在会话栏内
 * → 被这条规则当成顶栏，套上了 `--aqua-glass` 38% + `blur(12px) saturate(1.4)`
 * + `position: relative`，成了弹窗顶部一条 85px 的深色带
 * （用户报障：「提问弹窗标题部分还是实心的」+「提问文字贴到底边了」）。
 * 所以回退支必须排除弹窗作用域。**新增定位一律优先语义属性，别用类名片段。**
 */
export const TOPBAR = `${CONVERSATION} header[data-window-drag]:has(> [data-conversation-header-leading])`

/** 顶栏回退锚点（旧写法 + 弹窗排除，理由见 {@link TOPBAR}）。 */
export const TOPBAR_FALLBACK = `${CONVERSATION} header[class*='header']:not([data-question-key] *)`

/** 发送栏卡片。宿主自带 `data-composer-card`，是可靠锚点。 */
export const COMPOSER_CARD = '[data-composer-card]'

/**
 * 共享菜单表面（ui-primitives 的 `MenuSurface` 自己发的属性，始终为
 * `data-menu-material="translucent"`）。菜单底部的「下面还有内容」渐隐提示
 * 会用 `--dsw-specific-menu`，而菜单内部那个 token 必须等于菜单自身材质，
 * 否则提示的终点色与菜单本体不齐、露出一条带子 —— 见样式表里那条覆盖。
 */
export const MENU_SURFACE = '[data-menu-material]'

/**
 * 「已编辑 N 个文件」里悬停文件行的**差异预览卡**（HoverCard `variant="preview"`，
 * portal 到 `<body>`）。容器底色是 `--dsw-alias-bg-layer-1`（不透明层色，全局禁区），
 * 所以只能命中外层元素 —— 卡片内容自带这个宿主语义属性，用它反查容器。
 */
export const CHANGES_PREVIEW = '[data-changes-hover-preview]'

/**
 * 提问弹窗的**外壳**（ui-user-questions 的 `QuestionComposer`）。
 *
 * 面板自己发的 key（每次提问都带），卡片是它的**直接子元素**。
 * 宿主给这张卡的底色是 `--dsw-specific-input-major`（不透明输入面底色），
 * 本主题把它改成半透明后必须补模糊，见 material.module.css 里那一段。
 * 这个锚点还兼职一件重要的事：**顶栏的回退支靠它做排除**
 * （`header[class*='header']:not([data-question-key] *)`）——
 * 顶栏原先的类名片段锚点会误命中弹窗的 `<header>`（见 TOPBAR 的说明与 PITFALLS §2.17）。
 */
export const QUESTION_PANEL = '[data-question-key]'

/**
 * 应用弹窗（设置面板 + ui-primitives 的 Modal）。
 *
 * ⚠️ 锚点必须是这一对，**不能只用裸的 `[role='dialog']`**：
 * 图片灯箱与用量面板也带 `role="dialog"`，但它们自己是 `position: fixed`，
 * 而我们给弹窗写的规则里有 `background`/`border`/`corner-shape`（曾经还有
 * `position: relative`，直接把它们的 fixed 覆盖掉、挤到页面下方 —— 用户报障过）。
 * 两套真弹窗的外壳都带 `role="presentation"`，用它把范围收紧。
 */
export const DIALOG = "[role='presentation'] > [role='dialog']"

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
 *
 * 注意：这里只登记**样式表真的用到**的选择器。像 `INPUTBAR`（发送栏根）这类
 * 只用于诊断探针的盖章，不登记 —— 否则会被迫为它编一条规则来喂测试。
 */
export const SEAM = {
  SIDEBAR,
  CONVERSATION,
  SIDEBAR_ROOT,
  FRAME,
  STATS,
  TOPBAR,
  TOPBAR_FALLBACK,
  COMPOSER_CARD,
  COMPOSER_SEAT,
  MENU_SURFACE,
  CHANGES_PREVIEW,
  DIALOG,
  NEW_SESSION,
  WORDMARK,
  SETTINGS_TRIGGER,
  DARK,
  SIDEBAR_COLLAPSED,
  PHASE_HERO,
  PHASE_ACTIVE,
} as const

export type SeamKey = keyof typeof SEAM
