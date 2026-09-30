/**
 * 宿主半侧。本插件是纯浏览器视觉层：全部行为在 `src/client/`，宿主侧没有
 * 任何服务、工具或路由要注册。这个空 apply 的存在只是为了让本包作为一行
 * 出现在 profile 的 Loader 树里 —— `dsh-client-modules` 的宿主半侧正是
 * 扫描这些行、读取其 `package.json` 的 `dsh.client` 声明，才把
 * `lib/client.js` 组合进浏览器启动图。
 */
export function apply(): void {}
