/**
 * 产物验收脚本 —— `pnpm verify`。
 *
 * 这是本项目的核心验收项：**客户端产物必须一个模块 require 都没有**。
 *
 * 为什么这条最重要：宿主通过 `window.__ModuleLoader__` 提供的是一张冻结的
 * 模块表。bundle 里任何一句表外的 `require("...")` 都会在 factory 执行时
 * 抛错，而那个错会表现为「插件加载失败」，且只在真机上才看得到。产物零
 * require 就等于把这一类失败从根上排除。
 *
 * 判据只认「对模块说明符的 require」——`require("x")` / `require('x')` /
 * `require(\`x\`)`。注释里出现的 `require()` 字样不算。
 */
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const notes = []

function read(relative) {
  try {
    return readFileSync(new URL(relative, import.meta.url), 'utf8')
  } catch (error) {
    failures.push(`${relative} 读不到：${error instanceof Error ? error.message : String(error)}`)
    return ''
  }
}

// ── 1. 客户端产物：格式 ────────────────────────────────────────────────────
const client = read('../lib/client.js')
const PKG_ID = 'dsh-aqua-glass'

/**
 * lightningcss 在压缩 CSS 时会去掉属性选择器里的引号
 * （`[class*='sidebarCol']` → `[class*=sidebarCol]`），
 * 所以比对前先把两边引号都去掉。
 */
const loose = (text) => text.replace(/['"]/g, '')

if (client.length > 0) {
  const head = client.slice(0, 200)
  for (const token of ['window.__ModuleLoader__.load(', `id: "${PKG_ID}"`, 'factory: (require) =>']) {
    if (!head.includes(token)) {
      failures.push(`lib/client.js 头部缺少 ${JSON.stringify(token)} —— 不是合法的闭包工厂产物`)
    }
  }
  if (!client.includes('return module.exports')) {
    failures.push('lib/client.js 缺少 footer（factory 没有返回 module.exports）')
  }
}

// ── 2. 客户端产物：零模块 require（核心验收项）─────────────────────────────
const moduleRequires = [...client.matchAll(/\brequire\(\s*(['"`])([^'"`]+)\1\s*\)/g)].map((m) => m[2])
if (moduleRequires.length > 0) {
  failures.push(
    `lib/client.js 里有 ${moduleRequires.length} 处模块 require —— 宿主模块表答不上来就会在运行期抛错：\n  `
    + [...new Set(moduleRequires)].join('\n  '),
  )
} else {
  notes.push('lib/client.js 模块 require 数 = 0')
}

// ── 3. 客户端产物：样式已内联 ──────────────────────────────────────────────
if (!client.includes('data-plugin-css')) {
  failures.push('lib/client.js 里没有 <style data-plugin-css> 注入代码 —— CSS Modules 没有内联进产物')
}
if (!client.includes('backdrop-filter')) {
  failures.push('lib/client.js 里找不到 backdrop-filter —— 玻璃样式没进产物')
}
// lightningcss 在同一声明块里同时看到标准与前缀版本的 backdrop-filter 时会丢掉
// 标准那一条，只留 -webkit- 别名；而 Electron 的 Chromium 忽略该别名 —— 结果是
// 玻璃完全没有模糊，看起来就像主题没生效。这条断言把该回归钉死。
if (client.includes('-webkit-backdrop-filter')) {
  failures.push('lib/client.js 里出现了 -webkit-backdrop-filter —— 标准属性会被 lightningcss 丢掉，模糊将整体失效')
}

// ── 4. 客户端产物：总开关与缝合点 ─────────────────────────────────────────
const looseClient = loose(client)
for (const needle of ['data-dsh-aqua-glass', "class*='sidebarCol'", "class*='centerCol'", '[data-composer-card]', "header[class*='header']"]) {
  if (!looseClient.includes(loose(needle))) failures.push(`lib/client.js 里找不到缝合点 ${JSON.stringify(needle)}`)
}

// ── 5. 宿主半侧 ────────────────────────────────────────────────────────────
const index = read('../lib/index.js')
if (index.length > 0 && !/export\s*\{[^}]*apply/.test(index)) {
  failures.push('lib/index.js 没有导出 apply —— Loader 行会挂不上')
}

// ── 6. 平台模块表不得出现在产物里（纯净门禁的产物侧复核）──────────────────
const leaked = ['@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-ui-primitives', '@deepseek-ai/dsh-client-store']
  .filter((name) => client.includes(`"${name}"`) || client.includes(`'${name}'`))
if (leaked.length > 0) {
  failures.push(`产物里出现了宿主 client 包名（应为 type-only 或不存在）：${leaked.join(', ')}`)
}

// ── 7. manifest ────────────────────────────────────────────────────────────
const pkg = JSON.parse(read('../package.json') || '{}')
if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') failures.push('package.json 缺少 dsh.bundle.patch —— 安装会被 not-bundle 拒绝')
if (pkg.dsh?.client?.platform !== 'web') failures.push('package.json 的 dsh.client.platform 必须是 "web"')
if (!pkg.exports?.['./client']) failures.push('package.json 的 exports 缺少 "./client" 入口')
if (!pkg.files?.includes('lib/client.js')) failures.push('package.json 的 files 里没有 lib/client.js，发布后会缺产物')

const peer = pkg.peerDependencies?.['@deepseek-ai/dsh'] ?? ''
if (!/^>=/.test(peer) || !/<0\.3\.0-0$/.test(peer)) {
  failures.push(`peerDependencies["@deepseek-ai/dsh"] = ${JSON.stringify(peer)} —— 必须写成开口区间（>=… <0.3.0-0），闭区间会导致宿主升级后被静默禁用`)
}

for (const file of ['../lib/index.js', '../lib/client.js', '../cordis.patch.yml', '../icon.svg', '../locale/zh.json', '../locale/en.json']) {
  try {
    statSync(new URL(file, import.meta.url))
  } catch {
    failures.push(`${file.slice(3)} 不存在（package.json files 里声明了它）`)
  }
}

// ── 输出 ───────────────────────────────────────────────────────────────────
for (const note of notes) console.log(`  ok  ${note}`)
if (failures.length > 0) {
  console.error(`\n产物验收失败（${failures.length} 项）：`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log(`\n产物验收通过（${ROOT}）`)
