# dsh-aqua-glass 施工方案（DSH 玻璃主题插件）

> 定稿：2026-09-30　项目目录：`D:\Developer\dsh-ui`　目标环境：dsh-desktop **0.2.0-rc.2**
> 本文取代 `docs/archive/PORTING-0.2.0-rc.1.md`。旧文档的版本基线（rc.1）、包清单、peer 号、代码路线（设置行 + settingsScope + store）均已作废，仅作为历史留档。

---

## 0. 目标与验收

**最终目标**：打包成 npm 插件，在官方桌面端「插件 → 添加插件 → 输入包名」即可安装并生效。

**本轮里程碑**（2026-09-30 定）：先用**本地绝对路径**装进 desktop profile 跑通，不急着发 npm；视觉定稿后再决定发布名与 scope。

**验收标准**：插件页出现卡片 → 顶栏/侧栏/发送栏三处玻璃可见 → 日志无加载异常 → `lib/client.js` 顶层 `require` 数为 **0**。

---

## 1. 环境事实（本机实测，2026-09-30）

| 项 | 值 |
|---|---|
| 桌面端版本 | **0.2.0-rc.2**（`runtime.json` → `desktopVersion`） |
| 安装位置 | `D:\Applocation\dsh` |
| 前端打包 | `D:\Applocation\dsh\resources\app.asar`，121,348,951 字节，写于 2026-09-29 18:34 |
| asar 内 `@deepseek-ai` 包 | **289 个，全部 0.2.0-rc.2** |
| 运行时 | node 24.21.0 / pnpm 11.7.0 |
| profile | `C:\Users\12140\.dsh\profiles\desktop`（`package.json` 的 `dsh.profile.bundles` + `cordis.patch.yml`） |
| 桌面端日志 | `C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-YYYY-MM-DD.log` |
| 本机 npm registry | `registry.npmmirror.com`（`~/.npmrc`） |

> ⚠️ 桌面端会**自动升级**：上一轮方案记录的 rc.1 在 24 小时内已被 rc.2 取代。任何版本号都必须现查。

---

## 2. 安装契约：六道门禁（逐条已从官方产物源码验证）

### ① spec 形式
「添加插件」接受：包名（可带版本）/ Git 地址 / tarball / **本地绝对路径**。包名走 `pnpm view` 预检，因此正式发布必须上 npm registry。

### ② inspect 预检（pnpm 之前）
失败码：`invalid-spec` `already-installed` `not-found` `not-a-package` **`not-bundle`** `network`。
→ **`dsh.bundle.patch` 是强制项**，没有它安装会被直接拒绝。

### ③ 版本兼容预检（唯一的硬门禁）
`@deepseek-ai/dsh-app-boot` → `evaluatePluginCompatibility`：

```js
if (name !== "@deepseek-ai/dsh" && !name.startsWith("@deepseek-ai/dsh-")) continue;
if (!semver.satisfies(runtimeVersion, range, { includePrerelease: true })) peers[name] = range;
```

- 只检查 `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*`；`react`、`@deepseek-ai/cordis` **不受检**。
- `runtimeVersion` = `dsh-app-boot` 自身版本 = **0.2.0-rc.2**。
- 不兼容 → 安装**直接失败且不下载任何东西**；装机后还会复查：bundle 级不兼容整包跳过，行级不兼容置 `disabled: true`。
- 活例：`@smalltailqwq/…skin-maid-atelier@0.1.6` 写 `>=0.1.7-rc.1 <0.1.8-0`，在 profile 里留下 `disabled: true`；其 main 分支已改成 `>=0.1.7-rc.1 <0.3.0-0`。

→ **本插件 peer 写 `">=0.2.0-rc.1 <0.3.0-0"` + `peerDependenciesMeta.optional`。**

### ④ bundle 声明与挂载

```jsonc
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
```
```yaml
- insert:
    - id: aqua-glass
      name: dsh-aqua-glass
```
安装成功后包名追加进 `dsh.profile.bundles`，默认启用。失败或取消会把 `package.json` / `pnpm-lock.yaml` 恢复原样。

### ⑤ 客户端半侧加载
`dsh.client`（`platform: 'web'`）+ `exports["./client"]` → 宿主把 `lib/client.js` 做成 boot graph 的一行；浏览器侧是**惰性 CJS**：`window.__ModuleLoader__.load({ id, factory })`。**factory 必须无副作用**，所有副作用放进 `apply(ctx)` 并用 `ctx.effect` 注册清理。

| 字段 | 语义 |
|---|---|
| `platform` | 必填 `'web'` |
| `inject` | 只做**加载顺序**；列出的包若是图行就先加载，不是行则静默跳过（不会挂） |
| `external` | 声明基座之外的模块请求；解析到图行或静态表键，否则静默忽略 |
| `immediately` | 提前加载（`ui-theme`/`ui-renderer` 用它）；主题类建议加 |

**合法 require 清单**（从 asar 内全部 shipped client bundle 反推，括号为使用它的官方包数）：

```
react(52)  react/jsx-runtime(55)  react-dom(14)  react-dom/client(1)
@deepseek-ai/cordis(21)
@deepseek-ai/dsh-client-ui-primitives(53)
@deepseek-ai/dsh-client-store(40)
@deepseek-ai/dsh-client-ui-slots(7)
@deepseek-ai/dsh-client-ui-dockkit(1)
```
外加 `dsh.client.inject` 点名的那些图行（api-*/client-*/ui-* 共 34 个）。
**`@deepseek-ai/dsh-client-runtime` 在整个 asar 的客户端产物里 0 次引用 —— 该包已删除。**

> 本插件的目标是 **require 数为 0**：不写 React、不 require 任何宿主包（做法见 §4）。

### ⑥ 桌面端额外约束
- pnpm 11.7.0 **默认拦截依赖安装脚本**（变成 `pendingBuilds`，用户需手动批准）→ **不使用 postinstall**，CSS 由 tsdown 内联进 JS。
- **没有自动更新**，升级 = 卸载后重装。
- 管理器配置项：`pnpmCommand` / `registry` / `fallbackRegistries`（默认 `https://registry.npmmirror.com/`）/ `inspectTimeoutMs` 等。

---

## 3. 技术路线：DOM 缝合 + 三条工程纪律

### 为什么必须走 DOM 缝合
实测当前页面 `Theme.listTokens`：官方可覆盖 token **只有 14 个且全是颜色**（`bg-base`、`bg-layer-1/2/overlay`、`border-l1/l2`、`brand-primary`、`label-*`、`state-*`、`sidebar-fill`），全部 `requiresLightAndDark`。

→ **推不出 `backdrop-filter`、圆角、阴影、发丝线、磨砂。纯 slot + token 做不出玻璃。**

### 这不是野路子，是生态标准做法
实测 `Small-tailqwq/dsh-deep-whale`（活跃维护、兼容 0.2）的 `maid-atelier` 皮肤：

- `lib/client.js` 274,017 字节，**`require(...)` 调用 0 次**（连 `react` 都不 require）
- `dsh.client.inject: []`，devDeps 只有 `cordis / jsdom / lightningcss / tsdown / vitest`
- 239,889 字节样式表、649 条规则：**617 条命中宿主 `data-*`，230 条用 `[class*='…']`**
- 主体机制：`window.__ModuleLoader__` 注册 → 注入 `<style>` → 在 `body` 打 `data-*` → `MutationObserver` 监听宿主 DOM → 属性选择器覆盖

### 三条纪律（本项目的差异化所在）

| 纪律 | 做法 | 目的 |
|---|---|---|
| **D1 选择器常量表** | 全部选择器集中在 `src/client/seam.ts`，写成 `:is([data-*], [class*='x'])`——**宿主 `data-*` 优先、CSS Module 类名兜底**，每条带版本注释 | DSH 升级只改这一个文件 |
| **D2 逐版本审计清单** | `docs/CONTRACT-AUDIT.md`：每次宿主升级按四层级比对——名称 / 语义 / 关系 / 生命周期 | 不靠"属性还在"就判定兼容 |
| **D3 结构测试** | `src/client/seam.test.ts`：vitest 读 CSS 文本，断言关键选择器与 `!important` 规则存在 | 断裂立刻暴露，而不是等肉眼发现 |

参考：maid 的 `contract-audit.md` 记录了真实断裂——rc.1→rc.2 设置对话框由槽内改为 portal 到 `<body>` 并带 `data-shortcut-modal='settings'`，只写槽内选择器的规则静默失配。

---

## 4. 架构分层

| 层 | 内容 | 与宿主耦合 |
|---|---|---|
| **L0 契约层** | `package.json` / `cordis.patch.yml` / `icon.svg` / 构建配置 | 仅 manifest |
| **L1 缝合层** | `seam.ts`（选择器常量）+ `dom-lease.ts`（body 属性租约） | **唯一耦合点** |
| **L2 材质层** | `material.module.css`（玻璃规则）+ `fonts.module.css` | 通过 L1 选择器 |
| **L3 装饰层** | 流体背景 / 鼠标辉光 / 悬停下压 / 小鱼 / 网状 / 图片壁纸 / 铭牌 | **零耦合**（自带 canvas，自有 data 属性），原样搬 |
| **L4 配置层** | `config.ts`：常量 + `localStorage` 读写，**无 UI**（本轮决定） | 零 |
| **L5 审计层** | `seam.test.ts` + `docs/CONTRACT-AUDIT.md` | 元层 |

### 客户端入口形状

```ts
// src/client/index.ts —— 零 require，不碰 slot / store / settings
export function apply(ctx) {
  ctx.effect(() => { /* 挂载全部图层，返回 disposer */ }, 'aqua: layers')
}
```

---

## 5. 功能范围

**范围 = 原版 v1.3.0 功能集 − 视频壁纸 − 粒子鲸鱼。**

### 保留
玻璃材质本体、流体背景（色调/深浅/背景亮度/涟漪）、**图片壁纸**（模糊/柔光）、小鱼气泡、网状交互、鼠标辉光、悬停下压、HARNESS 铭牌替换、浅深两态（跟随宿主「通用设置→外观」，不新增开关）、双模式（云母/兼容）。

### 移除
| 项 | 位置 | 规模 |
|---|---|---|
| 视频壁纸（选视频/循环/铺满裁剪/视频模糊与亮度/文件授权/IndexedDB blob/视频层与柔光罩） | 分散在 `wallpaper-store.ts` / `theme-layer.ts` / `aqua.module.css` / 设置面板 | ≈150–250 行 |
| 粒子鲸鱼 | `whale.ts` 整文件 + 开关与词条 | 351 行 |

### 本轮额外作废（因为「先不做设置面板」）
`AquaAppearanceRow.tsx`(18KB) + `.module.css`(5KB) + `AquaControls.tsx`(3.2KB) + `AquaPluginCard.tsx`(2.1KB) + `.module.css`(1.5KB) + `settings-store.ts`(4KB) + `locales.ts`(3.9KB) ≈ **38KB 源码不移植**。

> `greetings.ts`（问候语池，当前无引用）按项目习惯保留原样、不删不动。

---

## 6. 宿主 DOM 锚点清单（L1 底稿，0.2.0-rc.2 实测）

在 app.asar 内逐个字符串计数得到的、**宿主包真的会发出**的属性：

| 区域 | 属性（命中次数） |
|---|---|
| 浅深色 | `data-ds-dark-theme`(29) |
| 布局 | `data-slot`(14)、`data-shell-overlay`(1)、`data-shell-leading`(1)、`data-windows-titlebar`(42)、`data-sidebar-collapsed`(5)、`data-state`(49)、`data-side`(68)、`data-open`(19)、`data-variant`(12) |
| 会话区 | `data-phase`(13)、`data-chat-flow`(24)、`data-chat-flow-kind`(19)、`data-chat-running`(1)、`data-conversation-scroll`(10)、`data-step-process`(9)、`data-disclosure-row`(4) |
| 输入区 | `data-composer-card`(5)、`data-composer-seat`(3)、`data-composer-input`(1)、`data-conversation-composer-overlay`(5)、`data-queue-dock`(1)、`data-width-handle`(1) |
| 浮层 | `data-shortcut-modal`(4，rc.2 起设置对话框 portal 到 body 的标记) |
| 局部 | `data-tool`(12)、`data-goal-bar`(2)、`data-cordis-panel`(1)、`data-workflow-run`(1)、`data-plan-review-key`(1)、`data-scroll-up/down`(各 1)、`data-testid`(2) |

### 两个必须知道的坑

1. **`data-pane` 在 0.2.0-rc.2 里是 0 次**。maid 写的 `:is([data-pane='sidebar'], [class*='sidebarCol'])` 前一半是死支，真正扛住主导航列的是 `[class*='sidebarCol']`（`dsh-client-ui-layout/lib/client.js`，17 次）。**类名片段不是契约，但目前是唯一可用的底座**——所以 D1 纪律里两条一起写。
2. **portal 化**：设置对话框已从 `[data-slot='sidebar.settings']` 槽内移到 `<body>` 下并带 `data-shortcut-modal='settings'`。只写槽内选择器会静默失配。

### 通用写法

```ts
export const SIDEBAR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
export const SETTINGS_DIALOG =
  ":is([data-slot='sidebar.settings'] [role='dialog'], [role='dialog'][data-shortcut-modal='settings'])"
```

- `!important` 通配覆盖时**连带 `*::before` / `*::after`**。
- `body` 属性用**租约**（`WeakMap<body, Map<attr, {owners: Set<symbol>}>>`）避免多次激活互相踩。

---

## 7. 目标文件树

```
D:\Developer\dsh-ui\
├─ PLAN.md                    本文件
├─ README.md                  插件说明（发布用）
├─ package.json               L0
├─ cordis.patch.yml           L0
├─ icon.svg                   L0
├─ tsconfig.json              L0
├─ tsdown.config.ts           L0（CSS inline，externals 为空）
├─ vitest.config.ts           L5
├─ .gitignore                 忽略 reference/ 与 lib/ 之外的一切产物
├─ src/
│  ├─ index.ts                宿主半侧：export function apply() {}
│  └─ client/
│     ├─ index.ts             入口：apply(ctx) 挂载/卸载
│     ├─ seam.ts              ★ L1 选择器常量表（唯一耦合点）
│     ├─ seam.test.ts         ★ L5 结构测试
│     ├─ dom-lease.ts         body 属性租约
│     ├─ config.ts            L4 常量 + localStorage（无 UI）
│     ├─ material.module.css  ★ L2 玻璃材质
│     ├─ fonts.module.css     L2 字体（原样搬）
│     ├─ theme-layer.ts       图层编排（拆掉视频与设置接线）
│     ├─ fluid-shader.ts      ┐
│     ├─ fluid-tones.ts       │
│     ├─ fluid-interactions.ts│
│     ├─ spotlight.ts         │ L3 装饰层：自带 canvas，零耦合，原样搬
│     ├─ spot-core.ts         │
│     ├─ critters.ts          │
│     ├─ mesh.ts              │
│     ├─ wallpaper-store.ts   │（仅图片部分）
│     └─ wordmark-badge.ts    ┘
├─ docs/
│  ├─ CONTRACT-AUDIT.md       ★ L5 逐版本审计清单
│  └─ archive/
│     └─ PORTING-0.2.0-rc.1.md   旧文档（已作废，仅留档）
└─ reference/                 ← 参考料，不进包、不进 git
   ├─ probe/                  我写的 asar 解析工具 + 快照 + npm 包解包
   └─ repos/
      ├─ aqua-upstream/       WYH66666666 上游 v1.3.0（源码移植基线）
      ├─ deep-whale/          Small-tailqwq（L1 纪律的参照实现）
      └─ dsh-font/            tianyhjg-lab（字体插件参考）
```

---

## 8. 分阶段计划

| 阶段 | 内容 | 估时 |
|---|---|---|
| **S0** | 骨架 + L0 契约 + 3 条规则的材质 CSS + 本地路径安装跑通 | 0.5 天 |
| **S1** | L1 缝合表全量重写（10 个锚点按 rc.2 实测）+ L5 测试与审计清单 | 0.5 天 |
| **S2** | L3 装饰层搬运（≈1,700 行，零改动）+ L2 材质层移植（`aqua.module.css` 拆视频） | 1.5–2 天 |
| **S3** | 视觉校正：逐表面目测（顶栏/侧栏含收起态/发送栏+数据栏/内容区/新建会话/设置页/浮层/工具块/轨迹窗），浅深两态各过一遍 | 2–4 天 |
| **S4** | 发布验收：定包名与 scope → `npm publish` → 在插件页用**包名**真装一遍 | 0.5 天 |
| | **合计** | **5–8 天** |

---

## 9. 执行命令

```powershell
# 构建
cd D:\Developer\dsh-ui; pnpm bundle

# 零 require 自检（关键验收项）
node --check lib\client.js
(Select-String -Path lib\client.js -Pattern 'require\(' -AllMatches).Matches.Count   # 期望 0

# 结构测试
pnpm test

# 本地路径安装：桌面端「插件 → 添加插件」输入
D:\Developer\dsh-ui

# 看日志
Get-Content "C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-$(Get-Date -f yyyy-MM-dd).log" -Tail 60

# 卸载：插件页卸载，或移除 profile 的 node_modules 链接与 dsh.profile.bundles 条目
```

> 改完 CSS 重新 bundle 即可：宿主按 `mtimeMs + ctimeMs + size` 派生逐插件 revision，HMR 会自动重载客户端产物，**不用重启**。但若 mtime 与 size 同时不变则不会触发。

---

## 10. 风险清单

| # | 风险 | 处置 |
|---|---|---|
| 1 | 桌面端自动升级打破选择器 | D2 审计清单 + D3 结构测试；升级后先跑 `pnpm test` |
| 2 | peer 写窄了被静默禁用 | 固定写 `>=0.2.0-rc.1 <0.3.0-0` |
| 3 | 打包进 npm 后 require 了宿主没有的模块 | 验收项：`require` 数 = 0 |
| 4 | 本机 registry 是 npmmirror，新发布包同步延迟导致 `not-found` | 发布后在插件页「安装源」手动选 npm 官方源 |
| 5 | pnpm 拦构建脚本导致安装多一步 | 不使用 postinstall |
| 6 | 视觉校正的主观尺度决定工期波动 | S3 按 §5 保留清单逐项验收 |
| 7 | 本机 `D:\Developer\dsh-command-clear` 是你的插件，被 profile 用 Junction 指着 | **不动它**；它的位置变更需先解除 Junction |

---

## 11. 参考料位置（相对本目录）

| 路径 | 内容 |
|---|---|
| `reference/repos/aqua-upstream/` | WYH 上游 v1.3.0 干净克隆（源码移植基线，工作区无改动） |
| `reference/repos/deep-whale/` | Small-tailqwq 皮肤仓库（L1 纪律与零 require 架构的参照实现） |
| `reference/repos/dsh-font/` | tianyhjg-lab 字体插件 |
| `reference/probe/ref/{wyh,duuck,hi320}/` | 三个 Aqua 仓库的 zip 快照 |
| `reference/probe/host/@deepseek-ai/` | 从 asar 解出的 0.2.0-rc.2 真实包 |
| `reference/probe/npm{,x}/` | 各版本 npm 包与解包（含 `.d.ts`） |
| `reference/probe/asar-*.mjs` | asar 解析 / 包清单 / 字符串计数 / 提取 / 模块宇宙反推 / 属性计数 |

### 复现命令

```powershell
node reference\probe\asar-dsh-manifests.mjs        # 列出所有 dsh.client/dsh.bundle 声明
node reference\probe\asar-require-universe.mjs     # 反推合法 require 清单
node reference\probe\asar-data-attrs.mjs           # 宿主 DOM 锚点计数
node reference\probe\asar-rc2-scan.mjs             # slot/服务/API 字符串计数
node reference\probe\asar-tree.mjs grep "<正则>" /dsh/node_modules/@deepseek-ai
node reference\probe\extract-asar.mjs <包名>
```
