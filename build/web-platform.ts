/**
 * 宿主浏览器「冻结模块表」的键。
 *
 * 这份清单不是抄来的：它是把 dsh-desktop 0.2.0-rc.2 的 app.asar 里**全部**
 * shipped client bundle 的非相对 `require(...)` 反推出来、再去掉「图行」
 * （即自身带 `dsh.client` 声明的包，那些必须经 `dsh.client.inject` 声明）
 * 之后剩下的静态表键。
 *
 * 复现：`node reference/probe/asar-require-universe.mjs`
 *
 * 注意：
 * - `@deepseek-ai/dsh-client-runtime` 在 0.2.0-rc.2 已**不存在**，任何
 *   bundle 里出现它都会在 factory 执行时抛错。本项目不引用它。
 * - 本插件目标是 `require()` 数为 0，这份表主要用于构建期纯净门禁；
 *   真要用到其中某项时它必须是 external，绝不能被打包进产物。
 */
export const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-dockkit',
] as const

export type PlatformModule = (typeof PLATFORM_MODULES)[number]
