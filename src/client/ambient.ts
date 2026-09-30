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
  try {
    ensureAmbientScene()
    const canvas = document.querySelector<HTMLCanvasElement>('[data-dsh-aqua-fluid-canvas]')

    const params = (): FluidParams => ({
      ...SITE_FLUID_PARAMS,
      ...fluidToneColors(isDark(), options.hue, options.depth),
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
