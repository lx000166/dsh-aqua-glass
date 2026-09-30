/**
 * L4 配置层。
 *
 * 本轮决定：**不做设置面板**。参数是一组写死的默认值，只留一个总开关与
 * 少量可调项落在 `localStorage`，供开发期与重度用户手工设置：
 *
 * ```js
 * localStorage.setItem('dsh-aqua-glass', JSON.stringify({ enabled: false }))
 * ```
 *
 * 这样做的收益是连锁的：不需要 React、不需要 slot 注册、不需要 store 服务，
 * 客户端产物可以做到 `require()` 数为 0。设置面板是可选后续项。
 *
 * @module config
 */

const STORAGE_KEY = 'dsh-aqua-glass'

export interface GlassConfig {
  /** 总开关。关闭后插件释放全部 DOM 副作用，宿主回到原样。 */
  enabled: boolean
  /** 玻璃模糊半径（px）。 */
  blur: number
  /**
   * 背景饱和度提升（%）。`backdrop-filter` 的第二半 —— 真实玻璃的"折射感"
   * 一半来自模糊，另一半来自提饱和；只做模糊会像一层白雾。
   *
   * 宿主自己的菜单材质就是 `blur(40px) saturate(150%)`
   * （`--dsw-menu-backdrop-filter`），这里跟它对齐。
   */
  saturate: number
  /** 磨砂度**乘数**（0–2，1 = 上游原版）。作用在配方的基础不透明度上。 */
  frost: number
  /** 圆角（px）。 */
  radius: number
  /** 流体色调（0–360，连续）。上游默认 320 落在青蓝上。 */
  hue: number
  /** 流体深浅（0–100：0 = 深而饱和，100 = 极淡）。 */
  depth: number
  /**
   * 诊断角标开关。
   *
   * @deprecated 角标已下线（不再挂载，`diagnostic.ts` 保留并标注废弃）。
   * 字段保留是为了兼容旧的 localStorage 配置，也方便需要时一行恢复；
   * 当前**没有任何消费方**。
   */
  debug: boolean
}

export const DEFAULT_CONFIG: GlassConfig = {
  enabled: true,
  // 上游 aqua.module.css 的默认是 blur 14px / frost 1；本主题把模糊降到 12px
  // 并把玻璃填充从 42% 降到 30%，因为流体本身较饱和，42% 会"泛白"。
  blur: 12,
  // 宿主菜单用 150%；我们的玻璃更透（30% vs 58%），略低一档避免过艳。
  saturate: 140,
  frost: 1,
  radius: 14,
  hue: 320,
  depth: 25,
  debug: true,
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

/**
 * 读取配置。任何解析失败都退回默认值 —— 一份坏掉的本地设置不应该让主题
 * 挂不上。
 */
export function readConfig(): GlassConfig {
  let raw: string | null = null
  try {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null
  } catch {
    // 隐私模式等场景下 localStorage 可能直接抛错。
    return { ...DEFAULT_CONFIG }
  }
  if (raw === null) return { ...DEFAULT_CONFIG }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_CONFIG }
    const candidate = parsed as Partial<Record<keyof GlassConfig, unknown>>
    return {
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_CONFIG.enabled,
      blur: clamp(Number(candidate.blur), 0, 60, DEFAULT_CONFIG.blur),
      saturate: clamp(Number(candidate.saturate), 0, 300, DEFAULT_CONFIG.saturate),
      frost: clamp(Number(candidate.frost), 0, 2, DEFAULT_CONFIG.frost),
      radius: clamp(Number(candidate.radius), 0, 40, DEFAULT_CONFIG.radius),
      hue: clamp(Number(candidate.hue), 0, 360, DEFAULT_CONFIG.hue),
      depth: clamp(Number(candidate.depth), 0, 100, DEFAULT_CONFIG.depth),
      debug: typeof candidate.debug === 'boolean' ? candidate.debug : DEFAULT_CONFIG.debug,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}
