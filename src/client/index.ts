/**
 * 客户端半侧入口。
 *
 * 设计约束（决定了整份实现的形状）：
 * - **零 `require()`**：不 import 任何宿主 client 包，不写 React。产物里
 *   一个 `require(...)` 都没有，因此不存在「宿主模块表答不上来」的运行期
 *   抛错。`reference/probe/asar-require-universe.mjs` 反推出的合法清单里
 *   我们一项都不需要。
 * - **零副作用工厂体**：bundle 的 factory 只注册模块，所有 DOM 副作用都在
 *   `apply(ctx)` 里、经由 `ctx.effect` 注册，卸载时逐项回收。
 * - **单一耦合点**：宿主 DOM 的选择器全部来自 `seam.ts`。
 *
 * @module client
 */
import { mountAmbient } from './ambient.ts'
// ⚠️ 宿主 bug 的临时补丁，上游修好后连同样式表里那条规则一起删（见模块头注释）。
import { startViewportGuard } from './animation-patch.ts'
import { readConfig, type GlassConfig } from './config.ts'
import { createAttributeLease } from './dom-lease.ts'
import { BODY_ATTRIBUTE } from './seam.ts'
import { startSeamStamper } from './seam-stamper.ts'
// 副作用导入：构建期由 lightningcss 编译成哈希类名映射，并把样式文本以
// <style data-plugin="dsh-aqua-glass"> 注入；宿主卸载插件时会清掉它。
import './material.module.css'
import './ambient.module.css'

/**
 * 包版本，由 tsdown 的 define 注入。
 *
 * @deprecated 原先只给右下角的诊断角标用；角标已于视觉定稿前下线
 * （`diagnostic.ts` 保留但不再挂载，见其模块头的 @deprecated 说明）。
 * 常量保留是因为构建期的 define 仍在注入，且插件卡片/日志随时可能再用到；
 * 用 `void` 显式消费一次，避免 `noUnusedLocals` 报错。
 */
declare const __AQUA_VERSION__: string
const VERSION = typeof __AQUA_VERSION__ === 'string' ? __AQUA_VERSION__ : 'dev'
void VERSION

/** cordis 客户端上下文里本插件真正用到的那一小部分。 */
export interface ClientContext {
  effect(callback: () => (() => void) | void, label?: string): () => void
}

/** 运行时可调参数写到的自定义属性名。 */
const TOKEN = {
  blur: '--aqua-blur',
  saturate: '--aqua-saturate',
  frost: '--aqua-frost',
  radius: '--aqua-radius',
} as const

/**
 * 把配置值写成 `<body>` 的**行内样式**。
 *
 * ⚠️ 目标元素必须是 `body`，不能是 `documentElement` —— 这条踩过坑：
 * 材质层把默认值声明在 `body[data-dsh-aqua-glass]` 上，那是一条**直接作用于
 * body 的声明**；而自定义属性走继承，元素自己有条声明时它**优先于从父级继承
 * 的值**。所以写在 html 上的调节值会被 body 那条声明静默盖掉 ——
 * `blur` / `frost` / `radius` 三个参数曾经整整一轮都是死的。
 * （当时的冒烟测试只断言了"变量写进去了"，没断言"玻璃真的用了它"，所以是假绿。）
 *
 * 写在 body 的行内样式上属于**同一元素、更高优先级**，才真正生效；
 * 而且它天然落在主题作用域里：总开关属性一撤，样式表规则不再匹配，
 * 这些变量也就没人消费。
 *
 * @param body - 目标元素（已确认存在）。
 * @param config - 已校验的配置。
 */
function writeTokens(body: HTMLElement, config: GlassConfig): void {
  const style = body.style
  style.setProperty(TOKEN.blur, `${config.blur}px`)
  style.setProperty(TOKEN.saturate, `${config.saturate}%`)
  style.setProperty(TOKEN.frost, String(config.frost))
  style.setProperty(TOKEN.radius, `${config.radius}px`)
}

function clearTokens(body: HTMLElement): void {
  const style = body.style
  for (const name of Object.values(TOKEN)) style.removeProperty(name)
}

/**
 * 挂载玻璃图层。
 *
 * 生命周期全部由 `ctx.effect` 拥有：HMR 重载、启用/停用、页面销毁都会走到
 * 返回的 disposer，宿主永远不会残留半套样式。
 *
 * `immediately: true` 意味着本插件可能在 `<body>` 出现之前就被求值，所以
 * 这里对 `document.body === null` 做了等待 `DOMContentLoaded` 的处理。
 *
 * @param ctx - 客户端 cordis 上下文。
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const config = readConfig()
    if (!config.enabled) return () => {}

    let lease: ReturnType<typeof createAttributeLease> | null = null
    let unmountAmbient: (() => void) | null = null
    let stopStamper: (() => void) | null = null
    /** 宿主动画 bug 的临时补丁（缩放/启动期间抑制常驻过渡）。 */
    let stopViewportGuard: (() => void) | null = null
    /** 行内调节变量写在哪 —— 必须是 body（理由见 writeTokens）。 */
    let tokenTarget: HTMLElement | null = null

    const mount = (): void => {
      if (lease !== null) return
      const body = document.body
      if (body === null) return
      writeTokens(body, config)
      tokenTarget = body
      lease = createAttributeLease(body, BODY_ATTRIBUTE)
      lease.acquire()
      // ⚠️ 临时补丁：在 body 上打抑制标记，配合样式表里那条「过渡属性常驻」。
      stopViewportGuard = startViewportGuard(body)
      // 盖章必须在样式生效之前：材质层有一部分规则只认 data-aqua-* 锚点。
      // 之后 MutationObserver 会跟随 React 重挂持续补章。
      stopStamper = startSeamStamper()
      // 流体板随后挂上（WebGL 初始化是同步的）。
      unmountAmbient = mountAmbient({ hue: config.hue, depth: config.depth })
      // 右下角的诊断角标已下线（视觉定稿前移除）：它会在页面上多挂一个节点。
      // 模块与 `config.debug` 按项目约定保留并标注 @deprecated，需要时可一行恢复。
    }

    mount()
    const onReady = (): void => mount()
    if (lease === null) document.addEventListener('DOMContentLoaded', onReady, { once: true })

    return () => {
      document.removeEventListener('DOMContentLoaded', onReady)
      // 环境层先撤：它的 dispose 会停掉渲染循环并移除自己 prepend 的 DOM。
      unmountAmbient?.()
      unmountAmbient = null
      // 盖章器最后停（已盖的章保留 —— 总开关属性一撤，它们就无害了）。
      stopStamper?.()
      stopStamper = null
      // 临时补丁也要撤干净：它会往 body 上写属性，绝不能残留。
      stopViewportGuard?.()
      stopViewportGuard = null
      lease?.release()
      lease = null
      if (tokenTarget !== null) clearTokens(tokenTarget)
      tokenTarget = null
    }
  }, 'aqua: glass material')
}
