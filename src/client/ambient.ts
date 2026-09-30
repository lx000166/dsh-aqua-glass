/**
 * L3 装饰层的第一个子系统：流体背景板。
 *
 * 上游 Aqua 把这套东西的挂载逻辑埋在 1059 行的 `theme-layer.ts` 里（连同壁纸、
 * 鲸鱼、设置接线一起）。这里只搬运**流体背景**这一条链路，用一个薄适配器
 * 顶替那一大坨：
 *
 *   ambient-scene.ts       环境层 DOM（流体 canvas + 小鱼/气泡/浮游）
 *   fluid-shader.ts        WebGL2 两趟流体模拟（deepseek.com join 区同款）
 *   fluid-tones.ts         色调/深浅 → 三色渐变（HSL 连续插值）
 *   fluid-interactions.ts  按钮悬停/点击的涟漪
 *
 * 四个文件都是从上游**原样搬过来**的，零依赖、不碰宿主 API，唯一改动是
 * ambient-scene 里去掉了视频壁纸元素（不在本轮范围）。
 *
 * ## 为什么这一步是玻璃的前提
 *
 * `backdrop-filter` 只是把**背后已有的东西**糊掉。宿主默认背景是纯色，
 * 玻璃糊在纯色上等于纯色——S0 第一版「界面没变化」就是这个原因。流体板
 * 提供了一块有结构的背景，玻璃才第一次真的像玻璃。
 *
 * @module ambient
 */
import { ensureAmbientScene, removeAmbientScene } from './ambient-scene.ts'
import { attachFluidInteractions } from './fluid-interactions.ts'
import { SITE_FLUID_PARAMS, attachFluidShader, type FluidParams, type FluidShaderHandle } from './fluid-shader.ts'
import { fluidToneColors } from './fluid-tones.ts'

/** 流体配色参数（色调 0–360、深浅 0–100）。 */
export interface AmbientOptions {
  readonly hue: number
  readonly depth: number
}

/** 宿主把深色态标记放在 `<body>` 上。 */
export function isDark(): boolean {
  return document.body.hasAttribute('data-ds-dark-theme')
}

/** 可变配色（`AmbientOptions` 的字段是只读的，实时调色需要能写）。 */
interface MutableTone {
  hue: number
  depth: number
}

/**
 * 当前挂载中的流体配色句柄（卸载时自动清空）。
 *
 * 只给实时调色用 —— 改它不会重建 WebGL 上下文，只更新着色器的 uniform。
 */
let liveTone: { tone: MutableTone; refresh: () => void } | null = null

/**
 * 实时改流体配色（色调 0–360 / 深浅 0–100），**不重建 WebGL**。
 *
 * 用途：将来「设置面板里的色调/深浅滑条」的现成钩子 —— 参数语义与 `config.ts`
 * 的 `hue`/`depth` 完全一致，写进 localStorage 后下次启动会走同一条路径。
 *
 * （写它的时候配了一个临时调色面板 `tune-tmp.ts` 用来定默认值，面板已按约定删除；
 *   这个接口保留：没挂载环境层时它是空操作，零副作用。）
 */
export function setAmbientTone(tone: AmbientOptions): void {
  if (liveTone === null) return
  liveTone.tone.hue = tone.hue
  liveTone.tone.depth = tone.depth
  liveTone.refresh()
}

/**
 * 挂载流体背景板。
 *
 * WebGL2 不可用时 `attachFluidShader` 会返回一个全空操作的句柄——此时环境层
 * 自己的渐变背景仍在，界面不会坏，只是没有流动感。
 *
 * @param options - 配色参数。
 * @returns disposer：停掉渲染循环、解开监听、移除环境层 DOM。
 */
export function mountAmbient(options: AmbientOptions): () => void {
  const disposers: Array<() => void> = []
  // 可变配色对象：实时调色（见 setAmbientTone）直接改它，params() 每次重算都读到最新值。
  const tone: MutableTone = { hue: options.hue, depth: options.depth }
  try {
    ensureAmbientScene()
    const canvas = document.querySelector<HTMLCanvasElement>('[data-dsh-aqua-fluid-canvas]')

    const params = (): FluidParams => ({
      ...SITE_FLUID_PARAMS,
      ...fluidToneColors(isDark(), tone.hue, tone.depth),
    })

    // WebGL2 不可用时 attachFluidShader 返回全空操作的句柄 —— 环境层自己的
    // 渐变背景仍在，界面不会坏，只是没有流动感。
    let shader: FluidShaderHandle | null = null
    if (canvas !== null) {
      shader = attachFluidShader(canvas, params())
      disposers.push(() => shader?.dispose())
      disposers.push(attachFluidInteractions({ main: shader, mainCanvas: canvas }))
    }

    // 浅深切换时重算配色：depth 的取值域本身随 scheme 变化，必须整组重算。
    const live = shader
    const observer = new MutationObserver(() => live?.setParams(params()))
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    disposers.push(() => observer.disconnect())

    // 登记当前这一份，供 setAmbientTone 实时调色。
    const handle = { tone, refresh: (): void => live?.setParams(params()) }
    liveTone = handle
    disposers.push(() => {
      if (liveTone === handle) liveTone = null
    })
  } catch (error) {
    // 装饰层的失败绝不能拖垮材质层：环境层挂不上时安静退化成「没有流体背景」，
    // 玻璃本身照常工作。这条边界由 scripts/smoke-load.mjs 覆盖。
    console.warn('aqua: 流体背景层挂载失败，已退化为无背景', error)
    for (const dispose of disposers.reverse()) dispose()
    removeAmbientScene()
    return () => {}
  }

  return () => {
    // 逆序回收：先解主题监听与涟漪监听，再停渲染循环，最后移除 DOM。
    for (const dispose of disposers.reverse()) dispose()
    removeAmbientScene()
  }
}
