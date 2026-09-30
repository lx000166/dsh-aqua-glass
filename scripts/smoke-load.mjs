/**
 * 产物冒烟加载 —— `pnpm smoke`（已并入 `pnpm verify` 之前的独立一步）。
 *
 * 这比「构建成功」强一档：这里真的把 `lib/client.js` 执行一遍，走完宿主
 * 加载它的完整路径 ——
 *
 *   __ModuleLoader__.load({ id, factory })
 *     → 校验 id 等于包名（宿主以包名作为浏览器模块身份）
 *     → 校验 factory 体**无副作用**（执行它不应该碰 DOM）
 *     → 用一个「一调用就抛」的 require 执行 factory，证明产物零模块依赖
 *     → 取到 exports.apply 并真的调用它
 *     → 断言 body 标记、<style> 注入、CSS 变量、以及卸载后的完全回收
 *
 * 不能替代的部分：真实浏览器里的渲染、`backdrop-filter` 是否被祖先
 * stacking context 吃掉、portal 与焦点行为。这些必须在真机上看。
 */
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

const BUNDLE = new URL('../lib/client.js', import.meta.url)
const code = readFileSync(BUNDLE, 'utf8')

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const EXPECTED_ID = pkg.name

const failures = []
const ok = (message) => console.log(`  ok  ${message}`)
const check = (condition, message) => {
  if (condition) ok(message)
  else failures.push(message)
}

// ── 最小 DOM 桩 ────────────────────────────────────────────────────────────
function makeDom() {
  const attributes = new Map()
  const styles = new Map()
  const appended = []

  const head = { appendChild: (node) => appended.push(node) }
  const body = {
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => void attributes.set(name, value),
    removeAttribute: (name) => void attributes.delete(name),
  }
  const documentElement = {
    style: {
      setProperty: (name, value) => void styles.set(name, value),
      removeProperty: (name) => void styles.delete(name),
    },
  }

  return {
    attributes,
    styles,
    appended,
    document: {
      body,
      documentElement,
      head,
      // bundle 里的 CSS 注入守卫会问一次「这个 style 标签在不在」
      querySelector: () => null,
      createElement: () => ({ dataset: {}, textContent: '' }),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  }
}

// ── 捕获 __ModuleLoader__.load ─────────────────────────────────────────────
let loaded = null
const dom = makeDom()

const sandbox = {
  window: {
    __ModuleLoader__: {
      load: (entry) => {
        loaded = entry
      },
    },
  },
  document: dom.document,
  localStorage: {
    store: new Map(),
    getItem(key) {
      return this.store.get(key) ?? null
    },
    setItem(key, value) {
      this.store.set(key, value)
    },
    removeItem(key) {
      this.store.delete(key)
    },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout,
  clearTimeout,
  console,
}
sandbox.globalThis = sandbox

runInContext(code, createContext(sandbox), { filename: 'lib/client.js' })

// ── 1. 注册握手 ────────────────────────────────────────────────────────────
check(loaded !== null, 'bundle 调用了 window.__ModuleLoader__.load')
check(loaded?.id === EXPECTED_ID, `注册 id 等于包名（${loaded?.id} === ${EXPECTED_ID}）`)
check(typeof loaded?.factory === 'function', 'factory 是一个函数')

// ── 2. factory 体无副作用 ──────────────────────────────────────────────────
check(dom.appended.length === 0, 'factory 执行前没有注入任何 <style>（副作用应当在 apply 里）')
check(dom.attributes.size === 0, 'factory 执行前没有写 body 属性')

// ── 3. 零模块依赖：require 一调用就抛 ──────────────────────────────────────
const poisonedRequire = (specifier) => {
  throw new Error(`产物 require 了宿主模块 "${specifier}" —— 模块表答不上来就会在真机上抛错`)
}
let exported
try {
  exported = loaded.factory(poisonedRequire)
  ok('factory 执行过程中一次 require 都没有发生（产物零宿主依赖）')
} catch (error) {
  failures.push(`factory 执行失败：${error instanceof Error ? error.message : String(error)}`)
}

// ── 4. 样式已注入且作用域正确 ──────────────────────────────────────────────
check(dom.appended.length === 1, `注入了 1 个 <style>（实际 ${dom.appended.length}）`)
const injected = dom.appended[0]
check(injected?.dataset?.plugin === EXPECTED_ID, '<style> 带 data-plugin 标记（宿主卸载时会据此清理）')
check(String(injected?.textContent).includes('backdrop-filter'), '注入的样式里含 backdrop-filter')
check(String(injected?.textContent).includes(`body[${'data-dsh-aqua-glass'}]`), '样式以 body 总开关属性为作用域')

// ── 5. apply：挂载 ─────────────────────────────────────────────────────────
const disposers = []
const ctx = {
  effect(callback) {
    const disposer = callback()
    if (typeof disposer === 'function') disposers.push(disposer)
    return () => {}
  },
}

if (typeof exported?.apply === 'function') {
  ok('exports.apply 是一个函数')
  try {
    exported.apply(ctx)
  } catch (error) {
    failures.push(`apply(ctx) 抛错：${error instanceof Error ? error.message : String(error)}`)
  }
  check(dom.attributes.get('data-dsh-aqua-glass') === '', 'apply 后 body 带上了总开关属性')
  check(dom.styles.get('--aqua-blur') === '18px', 'apply 后写入了 --aqua-blur 变量')
  check(dom.styles.get('--aqua-frost') === '0.55', 'apply 后写入了 --aqua-frost 变量')
  check(disposers.length === 1, 'apply 通过 ctx.effect 注册了 1 个 disposer')
} else {
  failures.push('入口没有导出 apply')
}

// ── 6. 卸载：完全回收 ──────────────────────────────────────────────────────
for (const dispose of disposers) dispose()
check(dom.attributes.has('data-dsh-aqua-glass') === false, '卸载后 body 属性已移除')
check(dom.styles.size === 0, '卸载后 CSS 变量已清空')
check(dom.appended.length === 1, '卸载不重复注入 <style>')

// ── 7. 总开关关闭时不产生任何副作用 ────────────────────────────────────────
const dom2 = makeDom()
sandbox.document = dom2.document
sandbox.localStorage.setItem(EXPECTED_ID, JSON.stringify({ enabled: false }))
const loaded2 = []
sandbox.window.__ModuleLoader__.load = (entry) => loaded2.push(entry)
runInContext(code, createContext(sandbox), { filename: 'lib/client.js' })
const exported2 = loaded2[0].factory(poisonedRequire)
exported2.apply(ctx)
check(dom2.attributes.size === 0, 'enabled:false 时 apply 不写 body 属性')

// ── 结果 ───────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\n冒烟加载失败（${failures.length} 项）：`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log('\n冒烟加载通过：产物可注册、零 require、apply 可挂载可回收')
