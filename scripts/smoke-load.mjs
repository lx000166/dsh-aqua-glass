/**
 * 产物冒烟加载 —— `pnpm verify` 的第二段。
 *
 * 这比「构建成功」强一档：这里把 `lib/client.js` 放进一个**真实的 DOM 环境**
 * （jsdom）里跑完整条宿主加载路径 ——
 *
 *   __ModuleLoader__.load({ id, factory })
 *     → 校验 id 等于包名（宿主以包名作为浏览器模块身份）
 *     → 校验 factory 体无副作用（执行它不该碰 DOM）
 *     → 用「一调用就抛」的 require 执行 factory，证明产物零模块依赖
 *     → 取到 exports.apply 并真的调用它
 *     → 断言总开关属性、<style> 注入、CSS 变量、环境层 DOM、诊断角标
 *     → 断言卸载后完全回收
 *     → 断言 WebGL 不可用时优雅退化
 *
 * **不能替代的部分**：真实浏览器里的渲染、`backdrop-filter` 是否被祖先
 * stacking context 吃掉、WebGL2 是否真的编译通过、portal 与焦点行为。
 * jsdom 不实现 WebGL，所以流体着色器在这里永远走「无 WebGL」分支。
 */
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

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

/** 建一个隔离的浏览器环境，把产物跑起来并交出捕获到的注册项。 */
function boot({ storage = {}, materialize = true, html } = {}) {
  const dom = new JSDOM(
    html ?? '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    { url: 'http://127.0.0.1:19387/', pretendToBeVisual: true, runScripts: 'dangerously' },
  )
  const { window } = dom
  windows.push(window)
  // jsdom 不实现 WebGL：钉死成 null，让产物走「无 WebGL 优雅退化」分支，
  // 顺便避免 jsdom 打一堆 "Not implemented" 噪音。
  window.HTMLCanvasElement.prototype.getContext = () => null

  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value)

  const loaded = []
  window.__ModuleLoader__ = { load: (entry) => loaded.push(entry) }
  window.eval(code)

  // 惰性 CJS：执行 bundle 只注册 factory，模块体（**包括 CSS 注入**）在物化时
  // 才跑。这里把两步分开，好断言「注册阶段无副作用」。
  const stylesAfterRegister = window.document.querySelectorAll('style[data-plugin-css]').length
  const bodyTouchedAfterRegister = window.document.body.hasAttribute(EXPECTED_ID)

  if (!materialize) return { window, document: window.document, loaded, stylesAfterRegister, bodyTouchedAfterRegister }

  const exported = loaded[0].factory((specifier) => {
    throw new Error(`产物 require 了宿主模块 "${specifier}" —— 模块表答不上来就会在真机上抛错`)
  })

  return { window, document: window.document, loaded, exported, stylesAfterRegister, bodyTouchedAfterRegister }
}

/**
 * 关掉所有 jsdom 窗口。
 *
 * 必须做：诊断角标持有 `setInterval`、`pretendToBeVisual` 持有 rAF 循环，
 * 不关的话 node 进程跑完也不会退出。
 */
const windows = []
const closeAll = () => {
  for (const window of windows) window.close()
}

/** 收集 ctx.effect 注册的 disposer。 */
function makeContext() {
  const disposers = []
  return {
    disposers,
    ctx: {
      effect(callback) {
        const disposer = callback()
        if (typeof disposer === 'function') disposers.push(disposer)
        return () => {}
      },
    },
  }
}

// ── 主场景：正常启用 ───────────────────────────────────────────────────────
const app = boot()

check(app.loaded.length === 1, 'bundle 调用了 window.__ModuleLoader__.load')
check(app.loaded[0]?.id === EXPECTED_ID, `注册 id 等于包名（${app.loaded[0]?.id} === ${EXPECTED_ID}）`)
check(typeof app.loaded[0]?.factory === 'function', 'factory 是一个函数')
// 惰性 CJS 的纪律：注册阶段不许碰 DOM。CSS 注入发生在物化（factory 执行）时，
// 那是设计行为 —— 宿主卸载插件时会按 data-plugin 清掉这些标签。
check(app.stylesAfterRegister === 0, '注册阶段未注入任何 <style>（副作用推迟到物化时）')
check(app.bodyTouchedAfterRegister === false, '注册阶段未写 body 属性')
ok('factory 执行过程中一次 require 都没有发生（产物零宿主依赖）')

const styles = [...app.document.querySelectorAll('style[data-plugin-css]')]
check(styles.length === 2, `注入了 2 个 <style>（每份 CSS module 一个；实际 ${styles.length}）`)
check(styles.every((tag) => tag.dataset.plugin === EXPECTED_ID), '<style> 都带 data-plugin 标记（宿主卸载时据此清理）')
const css = styles.map((tag) => tag.textContent).join('\n')
check(css.includes('backdrop-filter'), '样式里含 backdrop-filter')
check(css.includes(`body[data-dsh-aqua-glass]`), '样式以 body 总开关属性为作用域')
check(css.includes('[data-dsh-aqua-fluid-canvas]'), '样式覆盖流体板 canvas')
check(css.includes('dsh-aqua-fish-swim'), '样式含小鱼游动关键帧')

const { ctx, disposers } = makeContext()
check(typeof app.exported?.apply === 'function', 'exports.apply 是一个函数')

let applyError = null
try {
  app.exported.apply(ctx)
} catch (error) {
  applyError = error
}
check(applyError === null, `apply(ctx) 不抛错${applyError === null ? '' : `：${applyError.message}`}`)

const root = app.document.documentElement
check(app.document.body.hasAttribute('data-dsh-aqua-glass'), 'apply 后 body 带上了总开关属性')
check(root.style.getPropertyValue('--aqua-blur') === '14px', 'apply 后写入了 --aqua-blur 变量')
check(root.style.getPropertyValue('--aqua-frost') === '1', 'apply 后写入了 --aqua-frost 变量')
check(root.style.getPropertyValue('--aqua-radius') === '14px', 'apply 后写入了 --aqua-radius 变量')

// ── 环境层（L3 流体背景 + 小鱼）─────────────────────────────────────────────
const ambient = app.document.querySelector('[data-dsh-aqua-ambient]')
check(ambient !== null, '环境层容器已 prepend 到 body')
check(app.document.querySelector('[data-dsh-aqua-fluid-canvas]') !== null, '流体板 canvas 存在')
const critters = app.document.querySelectorAll('[data-aqua-critter]')
check(critters.length >= 8, `环境层里有 ${critters.length} 只装饰生物（小鱼/气泡/浮游）`)
check(ambient?.getAttribute('aria-hidden') === 'true', '环境层对无障碍树隐藏')
// 两层都在 body 的最前面：流体板（z-index:-1）与壁纸层都要落在应用内容之下。
const firstChildren = [...app.document.body.children].slice(0, 2).map((el) => el.tagName + JSON.stringify([...el.attributes].map((a) => a.name)))
check(
  ambient !== null && [...app.document.body.children].indexOf(ambient) <= 1
  && [...app.document.body.children].indexOf(app.document.querySelector('[data-dsh-aqua-wallpaper-layer]')) <= 1,
  `环境层与壁纸层都在 body 最前面（实际前两个：${firstChildren.join(' / ')}）`,
)

// ── 诊断角标（临时）───────────────────────────────────────────────────────
const badge = app.document.getElementById('dsh-aqua-glass-diagnostic')
check(badge !== null, '诊断角标已挂载（临时，定稿前删）')
check(String(badge?.textContent).includes('Aqua'), '角标文案里带插件名')
check(String(badge?.textContent).includes('框架层'), '角标列出了框架层探针')

check(disposers.length === 1, 'apply 通过 ctx.effect 注册了 1 个 disposer')

// ── 卸载：完全回收 ────────────────────────────────────────────────────────
for (const dispose of disposers) dispose()
check(app.document.body.hasAttribute('data-dsh-aqua-glass') === false, '卸载后 body 属性已移除')
check(root.style.getPropertyValue('--aqua-blur') === '', '卸载后 CSS 变量已清空')
check(app.document.querySelector('[data-dsh-aqua-ambient]') === null, '卸载后环境层 DOM 已移除')
check(app.document.querySelector('[data-dsh-aqua-wallpaper-layer]') === null, '卸载后壁纸层 DOM 已移除')
check(app.document.getElementById('dsh-aqua-glass-diagnostic') === null, '卸载后诊断角标已移除')
check(app.document.querySelectorAll('style[data-plugin-css]').length === 2, '卸载不重复注入 <style>')

// ── 总开关关闭：不产生任何副作用 ──────────────────────────────────────────
const off = boot({ storage: { [EXPECTED_ID]: JSON.stringify({ enabled: false }) } })
const offCtx = makeContext()
off.exported.apply(offCtx.ctx)
check(off.document.body.hasAttribute('data-dsh-aqua-glass') === false, 'enabled:false 时不写 body 属性')
check(off.document.querySelector('[data-dsh-aqua-ambient]') === null, 'enabled:false 时不挂环境层')
check(off.document.getElementById('dsh-aqua-glass-diagnostic') === null, 'enabled:false 时不挂角标')

// ── 配置可调：hue/depth/blur 生效 ─────────────────────────────────────────
const tuned = boot({
  storage: { [EXPECTED_ID]: JSON.stringify({ blur: 4, radius: 2, hue: 100, depth: 80 }) },
})
tuned.exported.apply(makeContext().ctx)
const tunedRoot = tuned.document.documentElement
check(tunedRoot.style.getPropertyValue('--aqua-blur') === '4px', 'localStorage 的 blur 生效')
check(tunedRoot.style.getPropertyValue('--aqua-radius') === '2px', 'localStorage 的 radius 生效')

// ── 缝合盖章器：在合成的宿主 DOM 上验证探针 ───────────────────────────────
//
// 这是 L1 的核心机制，也是踩过坑的地方：结构缝合点必须落到**唯一**元素上。
// 合成一份最小宿主结构 —— 关键是侧栏列下放**两个** `root`（侧栏内容根与
// 设置面板内部各一个），验证 `first: true` 只盖最靠上的那个。
const HOST_HTML = `<!doctype html><html><head></head><body><div id="root">
  <div class="layout_frame">
    <div class="layout_sidebarCol">
      <div class="sidebar_root">
        <button class="brandBtn">brand</button>
        <button class="newSession">新会话</button>
        <div class="settings_root">设置面板内部也有 root</div>
      </div>
    </div>
    <div class="layout_centerCol">
      <header class="chat_header">顶栏</header>
      <div class="composer_root">
        <div data-composer-card><button class="add">+</button></div>
      </div>
      <div data-slot="conversation.composer.dock"><div class="stats_root">数据行</div></div>
      <div data-conversation-composer-overlay>轨迹</div>
    </div>
  </div>
</div></body></html>`

const host = boot({ html: HOST_HTML })
host.exported.apply(makeContext().ctx)
const hostDoc = host.document

check(hostDoc.querySelectorAll('[data-aqua-frame]').length === 1, '框架层探针只盖 1 个元素（:has(> sidebarCol)）')
check(hostDoc.querySelector('.layout_frame')?.hasAttribute('data-aqua-frame') === true, '框架层盖在侧栏列的直接父上')
check(hostDoc.querySelectorAll('[data-aqua-sidebar-root]').length === 1, '侧栏内容根只盖 1 个元素（first:true 生效）')
check(hostDoc.querySelector('.sidebar_root')?.hasAttribute('data-aqua-sidebar-root') === true, '侧栏内容根盖在最靠上的 root 上')
check(hostDoc.querySelector('.settings_root')?.hasAttribute('data-aqua-sidebar-root') === false, '设置面板内部的 root 未被误盖')
check(hostDoc.querySelector('.composer_root')?.hasAttribute('data-aqua-inputbar') === true, '发送栏根盖在发送卡的直接父上')
check(hostDoc.querySelectorAll('[data-aqua-stats]').length === 1, '数据行探针命中 composer.dock 槽下的 root')
check(hostDoc.querySelector('.newSession')?.hasAttribute('data-aqua-surface') === true, '新建会话按钮被盖上 surface')
check(hostDoc.querySelector('.add')?.hasAttribute('data-aqua-add') === true, '发送栏「+」按钮被盖上 add')
check(hostDoc.querySelector('[data-conversation-composer-overlay]')?.hasAttribute('data-aqua-trajectory') === true, '轨迹视图被盖上 trajectory')

// ── 结果 ───────────────────────────────────────────────────────────────────
closeAll()

if (failures.length > 0) {
  console.error(`\n冒烟加载失败（${failures.length} 项）：`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log('\n冒烟加载通过：产物可注册、零 require、apply 可挂载可回收、环境层与角标就位')
