/**
 * 客户端 bundle 构建预设。
 *
 * 产出的是「闭包工厂」产物：bundle 调用
 * `window.__ModuleLoader__.load({ id, factory })`，通过注入的 `require`
 * 解析 externals（即宿主的冻结模块表）。这是 DSH 客户端插件的唯一合法
 * 格式 —— 直接产出 ESM 是装不上的。
 *
 * CSS Modules 由 lightningcss 在 bundle 内编译：`import './x.module.css'`
 * 得到哈希类名映射，同时把 CSS 文本以 `<style data-plugin data-plugin-css>`
 * 的形式在 factory 执行时注入（宿主卸载插件时会清理插件自己的标签）。
 *
 * 预设来源：`reference/repos/deep-whale/maid-atelier/build/tsdown.client.ts`
 * （MIT，已在本地验证可在 DSH 0.2 上工作）。相对原版做了三处删改：
 * 1. 去掉 `DSH_BUILD_FACE` 构建面机制 —— 本项目只有一种构建；
 * 2. 去掉 `@deepseek-ai/dsh-client-runtime/client` 豁免 —— 该包在
 *    0.2.0-rc.2 已被删除，留着只会把死包写进产物；
 * 3. 平台模块表换成本仓库按实测反推的清单（见 web-platform.ts）。
 */
import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'
import { PLATFORM_MODULES } from './web-platform.ts'

const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** 包版本，注入成 `__AQUA_VERSION__` 供诊断角标显示。 */
function readPackageVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: unknown }
    return typeof manifest.version === 'string' ? manifest.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * 虚拟 id 前缀：把 module CSS 挡在 tsdown 自己的 css 管线之外。
 * 后缀必须不是 `.css` —— tsdown 的守卫按这个结尾匹配。
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** 构建期纯净门禁的白名单后缀：只允许 type-only（会被擦除）与这三类值导入。 */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

export interface ClientBundleOptions {
  /** 插件 id，写进 `__ModuleLoader__.load` 与 `<style data-plugin>`。 */
  readonly id: string
  /** 宿主半侧入口（通常 `src/index.ts`）。 */
  readonly nodeEntry: readonly string[]
  /** 客户端半侧入口，默认 `src/client/index.ts`。 */
  readonly clientEntry?: string
}

/** 构建一个 UI 插件包：宿主半侧 `lib/index.js` + 客户端半侧 `lib/client.js`。 */
export function aquaBundle(options: ClientBundleOptions): UserConfig[] {
  return [nodeHalf(options), clientHalf(options)]
}

function nodeHalf({ id, nodeEntry }: ClientBundleOptions): UserConfig {
  return {
    name: `${id}/node`,
    entry: [...nodeEntry],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    // 必须关掉：tsdown 默认给 ESM 输出 .mjs，而 package.json 的 exports
    // 与 Loader 行都指向 lib/index.js。
    fixedExtension: false,
    dts: false,
    clean: false,
    // cordis 由 dsh profile 树在运行时解析，绝不打进产物。
    external: ['@deepseek-ai/cordis'],
  }
}

function clientHalf({ id, clientEntry = 'src/client/index.ts' }: ClientBundleOptions): UserConfig {
  const cssFiles = new Map<string, string>()
  return {
    name: `${id}/client`,
    entry: { client: clientEntry },
    // 浏览器产物与宿主半侧同落 lib/；entryFileNames 钉死为 client.js。
    // clean 必须关闭，否则会擦掉上面宿主半侧的输出。
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...PLATFORM_MODULES],
    define: {
      __AQUA_VERSION__: JSON.stringify(readPackageVersion()),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    // tsdown 会自动 external 掉 package.json 的 dependencies；模块表里没有的
    // 东西必须内联 —— 表答不上来的 require 就是运行期必抛。
    noExternal: (specifier: string) => (PLATFORM_MODULES.includes(specifier as never) ? undefined : true),
    plugins: [
      {
        // 纯净门禁：平台模块保持 external，其余 @deepseek-ai/* 值导入一律构建失败。
        // 跨插件协作走 cordis service，不做值导入。
        name: 'aqua-client-bundle-purity',
        resolveId(source: string) {
          if (!source.startsWith('@deepseek-ai/')) return null
          if (PLATFORM_MODULES.includes(source as never)) return null
          if (INLINE_SAFE.test(source)) return null
          throw new Error(
            `client bundle purity: "${source}" 不是平台模块（PLATFORM_MODULES）也不是 inline-safe 的 wire 层 —— `
            + '跨插件值导入被禁止；请通过 cordis service 协作（type-only 导入会被擦除，不会走到这里）。',
          )
        },
      },
      {
        name: 'aqua-css-modules-inline',
        resolveId(source: string, importer: string | undefined) {
          if (!source.endsWith('.module.css')) return null
          const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
          const sourceId = relative(REPOSITORY_ROOT, abs).split(sep).join('/')
          const virtualId = CSS_VIRTUAL_PREFIX + sourceId + CSS_VIRTUAL_SUFFIX
          cssFiles.set(virtualId, abs)
          return virtualId
        },
        async load(virtualId: string) {
          if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
          const sourceId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
          const fileId = cssFiles.get(virtualId) ?? sourceId
          // 否则虚拟 id 会把物理样式表藏出 Rolldown 的 watch 图。
          this.addWatchFile(fileId)
          const source = await readFile(fileId)
          const { code, exports: cssExports } = transform({
            filename: sourceId,
            code: source,
            cssModules: { pattern: '[hash]_[local]' },
            minify: true,
          })
          const classMap: Record<string, string> = {}
          // 确定性排序：lightningcss 的 cssExports 迭代顺序依赖进程哈希种子，
          // 不排会让每次重建的 lib/client.js 都变。
          for (const [local, exp] of Object.entries(cssExports ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
            classMap[local] = exp.name
          }
          return [
            `const css = ${JSON.stringify(code.toString())};`,
            `const tagId = ${JSON.stringify(`${id}/${basename(sourceId)}`)};`,
            "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
            "  const tag = document.createElement('style');",
            `  tag.dataset.plugin = ${JSON.stringify(id)};`,
            '  tag.dataset.pluginCss = tagId;',
            '  tag.textContent = css;',
            '  document.head.appendChild(tag);',
            '}',
            `export default ${JSON.stringify(classMap)};`,
          ].join('\n')
        },
      },
    ],
    outputOptions: {
      entryFileNames: 'client.js',
      // 去掉注释：产物是给浏览器读的，注释只留 sourcemap 里就够了；
      // 也让「产物里零 require」这条验收判据不被注释文本干扰。
      comments: false,
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

/** 把产物路径上的 JS 资源导入解析回源码树。 */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const marker = `${sep}lib${sep}types${sep}`
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}
