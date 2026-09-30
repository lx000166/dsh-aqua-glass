/**
 * ⚠️⚠️ **宿主 bug 的临时补丁 —— 上游修好后请整体删除。** ⚠️⚠️
 *
 * ## 症状
 *
 * 侧栏收起 / 展开**缺少滑动动画**（尤其"收起"经常是瞬间到位），而宿主代码里
 * 明明写了动画。
 *
 * ## 根因（宿主侧，非本皮肤引起）
 *
 * 滑动是 `AppFrame` 的栅格轨道做的，过渡挂在框架元素上、由一个开关属性控制：
 *
 * ```css
 * .frame[data-animating] { transition: grid-template-columns: var(--ds-transition-duration-slow) …; }
 * ```
 *
 * 而 `data-animating` 的生命周期是（`AppFrame.tsx`）：
 *
 * ```js
 * const [animating, setAnimating] = useState(0)
 * useLayoutEffect(() => {                       // 切换时 +1
 *   const viewportChanged = previousViewport.current !== viewport
 *   if (previousToggle.current === trackToggle) return
 *   if (viewportChanged) return                 // ← 与视口变化同帧：故意不加动画
 *   setAnimating(token => token + 1)
 * }, [trackToggle, viewport])
 * useEffect(() => {
 *   if (animating === 0) return
 *   frame.addEventListener('transitionend', (e) => {      // ← 只认 transitionend
 *     if (e.target === frame && e.propertyName === 'grid-template-columns') setAnimating(0)
 *   })
 *   setTimeout(() => setAnimating(0), 600)                // 兜底
 * }, [animating])
 * ```
 *
 * 问题在于**中途反向切换**：浏览器对被取消的那段过渡派发的是 `transitioncancel`
 * （宿主没有监听），只有真正跑完的那段才派发 `transitionend`。于是"快速点击"
 * 时很容易出现某一段**没有任何事件来收尾**、或过渡属性被过早撤下的情况 ——
 * 表现为单向（常常是收起）瞬间到位。宿主注释里"counter restarts the settle
 * window when a re-toggle interrupts a running transition"正是想处理这件事，
 * 但依赖 `transitionend` 这一点在反向切换下不成立。
 *
 * ## 本补丁做什么
 *
 * 1. **样式表侧**（`material.module.css`）：把那条过渡属性**常驻**在框架上
 *    （保留宿主所有需要"瞬时"的排除项：拖拽 / 右栏瞬时态 / 系统减弱动效）。
 *    属性常驻后，任何一次栅格变化都会有过渡，不再依赖宿主的开关时机。
 * 2. **本文件**：给常驻过渡补上宿主原本靠 `data-animating` 得到的两个"瞬时"场景 ——
 *    在 `<body>` 上打 `data-aqua-resizing` 标记：
 *      - **窗口缩放期间及其后 200ms**：宿主刻意让缩放引发的自动收起瞬时完成
 *        （"easing would chase the live window edge"），不补这个会变成侧栏缓动追边。
 *      - **启动后 1.2s 内**：视口宽度由 ResizeObserver + rAF 迟到一帧才写进 store，
 *        栅格值会在挂载后变一次；常驻过渡会把它演成"启动时侧栏滑一下"。
 *
 * ## 上游修好后怎么删
 *
 * 触发条件（任一）：宿主不再用 `data-animating` + `transitionend` 这对组合，
 * 例如改监听 `transitioncancel`、或改用 Web Animations / CSS `@starting-style`。
 *
 * 删除清单（三处一起删，缺一会留下死代码）：
 *  1. 本文件；
 *  2. `material.module.css` 里那条「过渡属性常驻」规则（搜 `data-animating` 的注释块）；
 *  3. `index.ts` 里的 `startViewportGuard()` 调用与 import；
 *  4. `seam.test.ts` 里对应的断言（搜 `常驻过渡`）。
 *
 * @module animation-patch
 */

/** 打在 `<body>` 上的标记：存在期间不启用常驻过渡（即保持宿主的"瞬时"语义）。 */
export const RESIZE_ATTRIBUTE = 'data-aqua-resizing'

/** 启动期抑制窗口：等布局 store 把真实视口宽度写进来（约一帧），别演成"启动滑一下"。 */
const STARTUP_SETTLE_MS = 1200

/** 缩放抑制窗口：最后一次 resize 事件之后再等这么久才恢复过渡。 */
const RESIZE_SETTLE_MS = 200

/**
 * 启动窗口缩放守卫。
 *
 * @param body - 目标 `<body>`（挂载时已确认存在）。
 * @returns disposer：摘掉监听、清掉定时器与标记。
 */
export function startViewportGuard(body: HTMLElement): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  const hold = (ms: number): void => {
    body.setAttribute(RESIZE_ATTRIBUTE, '')
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      body.removeAttribute(RESIZE_ATTRIBUTE)
    }, ms)
  }

  const onResize = (): void => hold(RESIZE_SETTLE_MS)

  hold(STARTUP_SETTLE_MS)
  window.addEventListener('resize', onResize, { passive: true })

  return () => {
    window.removeEventListener('resize', onResize)
    if (timer !== null) clearTimeout(timer)
    timer = null
    body.removeAttribute(RESIZE_ATTRIBUTE)
  }
}
