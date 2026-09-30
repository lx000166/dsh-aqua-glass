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
import { readConfig, type GlassConfig } from './config.ts'
import { mountDiagnostic } from './diagnostic.ts'
import { createAttributeLease } from './dom-lease.ts'
import { BODY_ATTRIBUTE } from './seam.ts'
import { startSeamStamper } from './seam-stamper.ts'
// 副作用导入：构建期由 lightningcss 编译成哈希类名映射，并把样式文本以
// <style data-plugin="dsh-aqua-glass"> 注入；宿主卸载插件时会清掉它。
import './material.module.css'
import './ambient.module.css'

/** 包版本，由 tsdown 的 define 注入；诊断角标用它确认页面跑的是哪一版产物。 */
declare const __AQUA_VERSION__: string
const VERSION = typeof __AQUA_VERSION__ === 'string' ? __AQUA_VERSION__ : 'dev'

/** cordis 客户端上下文里本插件真正用到的那一小部分。 */
export interface ClientContext {
  effect(callback: () => (() => void) | void, label?: string): () => void
}

/** 运行时可调参数写到的自定义属性名。 */
const TOKEN = {
  blur: '--aqua-blur',
  frost: '--aqua-frost',
  radius: '--aqua-radius',
} as const

/** 把配置值写到 `documentElement` 上，让样式表用 var() 消费。 */
function writeTokens(config: GlassConfig): void {
  const style = document.documentElement.style
  style.setProperty(TOKEN.blur, `${config.blur}px`)
  style.setProperty(TOKEN.frost, String(config.frost))
  style.setProperty(TOKEN.radius, `${config.radius}px`)
}

function clearTokens(): void {
  const style = document.documentElement.style
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
    let unmountDiagnostic: (() => void) | null = null
    let unmountAmbient: (() => void) | null = null
    let stopStamper: (() => void) | null = null

    const mount = (): void => {
      if (lease !== null) return
      const body = document.body
      if (body === null) return
      writeTokens(config)
      lease = createAttributeLease(body, BODY_ATTRIBUTE)
      lease.acquire()
      // 盖章必须在样式生效之前：材质层有一部分规则只认 data-aqua-* 锚点。
      // 之后 MutationObserver 会跟随 React 重挂持续补章。
      stopStamper = startSeamStamper()
      // 流体板随后挂上（WebGL 初始化是同步的）。
      unmountAmbient = mountAmbient({ hue: config.hue, depth: config.depth })
      // 角标最后挂，所以「看到角标」等价于「apply 跑到底了」。
      // 它是辅助工具，自身出错绝不能影响主题 —— 冒烟脚本曾在这里抓到过一次。
      if (config.debug) {
        try {
          unmountDiagnostic = mountDiagnostic(VERSION)
        } catch (error) {
          console.warn('aqua: 诊断角标挂载失败，已跳过', error)
        }
      }
    }

    mount()
    const onReady = (): void => mount()
    if (lease === null) document.addEventListener('DOMContentLoaded', onReady, { once: true })

    return () => {
      document.removeEventListener('DOMContentLoaded', onReady)
      unmountDiagnostic?.()
      unmountDiagnostic = null
      // 环境层先撤：它的 dispose 会停掉渲染循环并移除自己 prepend 的 DOM。
      unmountAmbient?.()
      unmountAmbient = null
      // 盖章器最后停（已盖的章保留 —— 总开关属性一撤，它们就无害了）。
      stopStamper?.()
      stopStamper = null
      lease?.release()
      lease = null
      clearTokens()
    }
  }, 'aqua: glass material')
}
