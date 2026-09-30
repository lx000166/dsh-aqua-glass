> # ⚠️ 本文档已作废（SUPERSEDED）
>
> 方案已由 [PLAN.md](../../PLAN.md) 取代。**不要按本文施工。**
>
> 作废原因：① 目标环境已是 **0.2.0-rc.2**（桌面端自动升级），本文的 rc.1 版本基线、包清单、peer 号全部过期；
> ② 本文选定的模板（du-u-uck）其 lib/client.js require 了已被删除的 `@deepseek-ai/dsh-client-runtime`；
> ③ 本文的代码路线（`settings.plugin.item` / `settingsScope` / store / React 设置面板）已被 2026-09-30 的决策推翻——
> 新方案是**零 require、零 React、零 slot** 的 DOM 缝合架构，且本轮**不做设置面板**。
>
> 保留本文仅为历史留档与 rc.1→rc.2 的差异佐证。

---
# Aqua 玻璃主题 → dsh-desktop 0.2.0-rc.1 移植方案

> 记录日期：2026-09-29　计划动工：2026-09-30　项目目录：`D:\Developer\dsh-ui`
> 本文档只记录**已验证的事实**与**明天可直接执行的动作**，不含未验证的猜测；每条结论后面都附了复现方式（见 §8）。

---

## 0. 结论与已确认的决策

| 项 | 结论 |
|---|---|
| 模板仓库 | **du-u-uck/DSH-Transparent-UI-Plugin**（= WYH 上游 v1.3.0 内容 + 一次 API 适配 + 独立构建配置） |
| 总开关落点 | **只保留「通用设置 → 外观」行里的「玻璃效果」开关**；删除旧的插件页卡片注册（`settings.plugin.item` 在 0.2.0-rc.1 已被官方删除） |
| 本轮节奏 | 2026-09-29 只落文档，2026-09-30 开始动手 |
| 功能范围 | **只有视频背景（视频壁纸）与粒子鲸鱼不做，其余功能全部保留**（2026-09-29 最终确认） |
| 工作量预估 | 「装上去不崩 + 玻璃能用」≈ 1.5–2 天；「完整落地（原版功能集 − 视频壁纸 − 粒子鲸鱼）」≈ 5 天 |

---

## 0.5 需求范围（2026-09-29 最终确认）

> 原话：**「只需要玻璃质感与浅色深色两种切换，别的什么视频背景、像素鲸鱼什么的全都不需要」**
> 澄清（第三次）：**「除了视频背景、粒子鲸鱼，别的都要」** → 只砍这两项，其余功能一件不删。
> 另两条补充：浅深两态**跟随宿主「通用设置 → 外观」**（不新增开关）；鼠标辉光 / 悬停下压 / 铭牌替换**保留**。

### 保留（= 原版 v1.3.0 功能集 − 视频背景 − 粒子鲸鱼）
| 项 | 承载文件 | 说明 |
|---|---|---|
| 玻璃材质本体（顶栏 / 侧栏 / 发送栏+数据栏 / 内容区等磨砂玻璃、圆角、边框、投影） | `theme-layer.ts` + `aqua.module.css` + `seam-stamper.ts` | 核心 |
| 流体背景（WebGL 流体板 + 色调/深浅滑杆 + 背景亮度 + 涟漪交互） | `fluid-shader.ts` + `fluid-tones.ts` + `fluid-interactions.ts` | 玻璃透出的底色 |
| **图片壁纸**（选图、模糊度、磨砂柔光；含本地存储） | `wallpaper-store.ts`（图片部分）+ `theme-layer.ts` | 保留 |
| 粒子小鱼 / 气泡 / 浮游生物 | `critters.ts` | 保留 |
| 网状交互（点阵 repel） | `mesh.ts` | 保留 |
| 鼠标辉光 + 悬停下压（3D 倾斜） | `spotlight.ts` + `spot-core.ts` | 保留 |
| HARNESS 光泽铭牌替换（深色态） | `wordmark-badge.ts` | 保留 |
| 浅色 / 深色两态适配 | `theme-layer.ts`（现靠 `body[data-ds-dark-theme]` 判定） | **不新增开关**，跟随宿主 `ui-theme` 的浅色/深色/跟随系统 |
| 参数：模式 / 模糊度 / 磨砂度 / 流体颜色 / 背景亮度 / 辉光 / 下压 | `AquaAppearanceRow.tsx` + `settings-store.ts` + `AquaControls.tsx` | 保留（仅视频相关控件删） |
| 总开关（通用设置 → 外观行） | `AquaAppearanceRow.tsx` | 保留（已定） |
| 双模式（云母=悬浮玻璃卡片 / 兼容=只换材质） | `theme-layer.ts` | 两个都留 |
| 英雄区问候语池 | `greetings.ts` | 保持原样（当前无引用、不进 bundle，不删不动） |

### 移除（只此两项）
| 项 | 涉及位置 | 规模 |
|---|---|---|
| **视频背景**（视频壁纸：选视频、循环播放、铺满裁剪、模糊/亮度滑杆、File System Access 授权、IndexedDB 视频 blob 存储、视频层与柔光罩） | 分散在 `wallpaper-store.ts` / `theme-layer.ts` / `AquaAppearanceRow.tsx` / `locales.ts` / `aqua.module.css` | 约 150–250 行（开工时按实际拆） |
| **粒子鲸鱼** | `whale.ts` | 351 行（整文件删除，另删设置开关与词条） |
| **合计** | — | **≈ 500–600 行 TS** + 对应 CSS 规则与词条 |

拆除的连带影响（B 阶段要做）：
- `wallpaper-store.ts`：只留图片壁纸的压缩与本地存储；去掉视频 blob（IndexedDB）与文件授权（File System Access）两条链路。
- `theme-layer.ts`（1059 行）：去掉视频层渲染、`videoBlur` / `videoBrightness` 参数与视频柔光罩；图片壁纸层保留。
- `aqua.module.css`（959 行）：删视频层规则块与视频柔光罩。
- `AquaAppearanceRow.tsx`（406 行）：删「视频模糊 / 视频亮度」两个滑杆与视频授权入口；「背景：流体 / 壁纸」选择器、壁纸模糊/柔光保留。
- `locales.ts`（91 行）：删视频相关词条与「粒子鲸鱼」开关文案。

---

## 0.6 三个追问点的结论（已闭环）

| 问题 | 结论 |
|---|---|
| 玻璃背后放什么 | **流体背景（可调色）与图片壁纸都保留**，只有视频壁纸砍掉 |
| 浅色 / 深色切换由谁提供 | **跟随宿主「通用设置 → 外观」**（`ui-theme@0.2.0-rc.1` 的浅色/深色/跟随系统），Aqua 不新增切换控件 |
| 悬停效果与铭牌 | **三样全留**（鼠标辉光、悬停下压、铭牌替换） |

---

## 0.7 功能全清单（供勾选去留）

> 来源：`src/client/locales.ts`（设置面板文案 = 用户可见功能全集）+ `AquaAppearanceRow.tsx`（控件顺序）+ `aqua.module.css`（常开样式分区）+ `theme-layer.ts`（行为方法）。
> 「去留」列留空 = 默认保留，需要去掉的项由你标记。

### A. 设置面板里有开关/滑杆的（14 项）

| # | 功能 | 面板位置 | 承载文件 | 去留 |
|---|---|---|---|---|
| 1 | 玻璃效果总开关（开/关） | 通用设置 → 外观行（常驻） | `AquaAppearanceRow.tsx` + `theme-layer.ts` | 保留（已定） |
| 2 | 模式：云母效果 / 兼容模式 | 外观行首行 | `theme-layer.ts` | 保留 |
| 3 | 玻璃模糊度（滑杆） | 玻璃材质 | `theme-layer.ts` | 保留 |
| 4 | 磨砂度（滑杆） | 玻璃材质 | `theme-layer.ts` | 保留 |
| 5 | 背景源：流体 / 壁纸（二选一） | 背景 | `theme-layer.ts` | 保留 |
| 6 | 色调（滑杆，流体配色） | 背景 → 流体 | `fluid-tones.ts` | 保留 |
| 7 | 颜色深浅（滑杆，流体配色） | 背景 → 流体 | `fluid-tones.ts` | 保留 |
| 8 | 选择图片（图片壁纸） | 背景 → 壁纸 | `wallpaper-store.ts`（图片部分） | 保留 |
| 9 | 选择视频（视频壁纸） | 背景 → 壁纸 | `wallpaper-store.ts`（视频部分） | **已定去掉** |
| 10 | 删除壁纸 | 背景 → 壁纸 | `wallpaper-store.ts` | 保留 |
| 11 | 壁纸模糊度 / 壁纸磨砂度（两条滑杆） | 背景 → 壁纸 | `theme-layer.ts` | 保留 |
| 12 | 视频模糊度 / 视频亮度（两条滑杆） | 背景 → 壁纸 | `theme-layer.ts` | **已定去掉** |
| 13 | 背景亮度（滑杆，随深浅模式切换 0–50 / 50–100） | 背景 | `theme-layer.ts` | 保留 |
| 14 | 环境装饰：粒子鲸鱼 / 小鱼 / 网状交互（三个开关） | 环境装饰分组 | `whale.ts` / `critters.ts` / `mesh.ts` | 粒子鲸鱼**已定去掉**；小鱼、网状交互保留 |
| 15 | 悬停效果：鼠标辉光 / 悬停下压（两个开关） | 悬停效果分组 | `spotlight.ts` + `spot-core.ts` | 保留 |

### B. 没有开关、随主题常开的（10 项）

| # | 行为 | 落点 | 承载文件 | 去留 |
|---|---|---|---|---|
| 16 | HARNESS 光泽铭牌替换（深色态侧栏铭牌） | 侧栏底部铭牌 | `wordmark-badge.ts` | 保留 |
| 17 | 侧边栏收起态悬浮玻璃 + 渐隐动画 | 侧栏 rail | `aqua.module.css`（`Collapsed rail` 区块） | 保留 |
| 18 | 设置面板玻璃化（固定 50px 背板模糊） | 设置弹窗 | `aqua.module.css`（`Settings panel glass` 区块） | 保留 |
| 19 | 聊天气泡玻璃化（深色黑玻璃 / 浅色磨砂） | 会话区 | `aqua.module.css`（`Chat bubbles` 区块） | 保留 |
| 20 | 发送栏 + 数据栏「融合成一块玻璃」（含一道发丝分界线、平板化） | 输入区 | `aqua.module.css`（`Fused state` 区块） | 保留 |
| 21 | 新建会话按钮玻璃化 | 内容区顶部 | `aqua.module.css`（`new-session button` 区块） | 保留 |
| 22 | 代码 / 终端 / diff / read / web / search 区块的玻璃标题栏 | 消息内工具块 | `aqua.module.css`（`Block family` 区块） | 保留 |
| 23 | 菜单 / 对话框 / 提示 / 悬浮卡 / 插件卡（raised surfaces）玻璃化 | 全局浮层 | `aqua.module.css`（`Raised surfaces` 区块） | 保留 |
| 24 | 会话选中态：强调条 + 柔光晕 | 侧栏列表 | `aqua.module.css`（`selected session` 区块） | 保留 |
| 25 | 浅色模式聊天文字微投影 + 1px 光晕；发送区激活/非激活的淡出带 | 会话区 / 输入区 | `aqua.module.css`（`text-shadow` / `data-phase` 规则） | 保留 |
| 26 | 轨迹视图玻璃面板（工具栏与时间线透明化） | 轨迹窗 | `aqua.module.css`（`Trajectory view` 区块） | 保留 |
| 27 | 英雄区问候语池（时时段池、随机不重复） | 新会话英雄区 | `greetings.ts` | **当前无任何引用**（不进 bundle，等同已停用）；文件保留不删 |
| — | 视频壁纸柔光罩 / 深浅色下的实底气泡 | 会话区 | `aqua.module.css`（`Video wallpaper` 区块） | **随视频壁纸一并去掉** |

### C. 归类提示

- 若要进一步瘦身，成本最低的是 **B 组里没有开关的装饰性项**（16 铭牌、17 收起态、24 选中态、25 文字微投影）——去掉只删 CSS 区块，不牵动 JS。
- 成本次低的是 **A 组里独立的装饰开关**（14 小鱼、14 网状交互、15 辉光、15 下压）——删对应模块 + 一个开关行。
- 成本最高的是 **2 模式、3/4 材质参数、5 背景源、6/7/13 背景色**——它们是玻璃本体的骨架，去掉会连带改 `theme-layer.ts` 的挂载/令牌逻辑。

---

## 1. 目标环境事实（本机实测）

| 事实 | 值 / 位置 |
|---|---|
| dsh-desktop 版本 | 0.2.0-rc.1（注册表项 `DeepSeek Harness 0.2.0-rc.1`，InstallLocation `D:\Applocation\dsh`） |
| 运行时清单 | `D:\Applocation\dsh\resources\runtime\primary-runtime\runtime.json` → `desktopVersion: 0.2.0-rc.1`，node 24.21.0，pnpm 11.7.0，python 3.12.14 |
| 桌面端前端打包 | `D:\Applocation\dsh\resources\app.asar`（118,651,499 字节） |
| asar 内 `@deepseek-ai` 包 | **287 个，全部为 `0.2.0-rc.1`**；含 `dsh-client-ui-slots` / `dsh-client-ui-settings` / `dsh-client-ui-theme` / `dsh-client-locale` / `dsh-client-ui-primitives` / `dsh-web-app` / **`dsh-client-store`** / `dsh-client-modules` / `dsh-client-ui-settings-plugin-inventory` / `dsh-client-ui-sidebar-right` |
| profile（插件登记点） | `C:\Users\12140\.dsh\profiles\desktop`（`cordis.patch.yml` + `package.json` 的 `dsh.profile.bundles`） |
| 桌面端日志 | `C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-YYYY-MM-DD.log`（插件加载失败会落在这里） |
| 本机可用的「正确样例」 | `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager@0.1.5`、`@smalltailqwq/dsh-client-ui-skin-maid-atelier@0.1.6`、`dsh-tweaks-prompt-history@0.1.0`（都在 0.2.0-rc.1 上正常工作，bundle 包装格式与 Aqua 相同） |
| 上游基线克隆 | `D:\Developer\dsh-transparent-ui`（origin = WYH66666666，工作区干净，停在 v1.3.0，留作对照） |

### asar 关键字符串计数（0.2.0-rc.1 真实产物）

| 串 | 命中 | 含义 |
|---|---|---|
| `settings.plugin.item` | **0** | 旧插件卡片槽**已删除** |
| `settings.plugins.tab` | 22 | 新的插件分区标签槽 |
| `settings.general.item` | 35 | 通用设置行槽**仍在**（list，带 id/order） |
| `settingsScope` | **0** | 旧服务名**已删除** |
| `configForms` | 85 | 新的配置表单服务 |
| `dsh-client-runtime` | 2（且都出现在文档表格文本里） | **该包已不存在** |
| `dsh-client-store` | 112 | store 体系的新家 |
| `window.__ModuleLoader__` | 85 | 插件 bundle 包装协议**未变** |
| `--dsw-alias` | 3042 | 主题 token 体系**未变** |
| `sidebarCol` / `newSession` / `data-composer-card` / `data-conversation-composer-overlay` / `conversation.composer.dock` | 17 / 168 / 5 / 5 / 11 | DOM 缝合点仍在 |
| `detailsCol` | **0** | 右侧面板结构变了（换成 `dsh-client-ui-sidebar-right`，65 处引用） |

---

## 2. 三个仓库的实际关系（逐文件哈希比对结论）

| 仓库 | 内容 | peer 目标 | 判定 |
|---|---|---|---|
| WYH66666666（上游，406★，最后推送 08-22） | v1.3.0，功能最全 | `^0.1.0-rc.5` | 最干净但**没有**独立构建配置；`lib/client.js` 同样是坏的（见 §3.1） |
| **du-u-uck**（09-01 建，09-08 最后推送） | v1.3.0 + 未发布适配 | `^0.1.1-rc.2` | 与上游比对：仅 3 个 src 文件有差异（+62/−16）+ `package.json` + README/CHANGELOG；**新增** `tsconfig.standalone.json`、`tsdown.standalone.config.ts`、`DEVELOPMENT.md`，并同步手补了 `lib/client.js` → **选它** |
| Hearingimpaired-conversion320（最后推送 09-29） | 停留在 **v1.1.0** | `^0.1.0-rc.5` | 缺 `spot-core / spotlight / mesh / fluid-tones / wallpaper-store`，bundle 是旧构建，还夹带 `src/client/v1.0-alpha.5.zip` → 只能当参考 |

duuck 相对上游的 3 处源码改动（明天要在这基础上继续改）：
1. `index.ts`：`inject` 加 `settingsScope`；加 `ctx.settingsScope.bind({ namespace: NS })`；`settings.plugin.item` 由 `id/order` 改为 `key: NS`；`ctx.slots.inject(...)` → `ctx.effect(() => ctx.slots.register(...))`
2. `AquaAppearanceRow.tsx`：外观行顶部常驻「玻璃效果」总开关（关闭时下方旋钮隐藏）
3. `locales.ts`：补 `aqua.glassEffect` / `aqua.offHint` 两条词条

---

## 3. 在 0.2.0-rc.1 上会挂的断点 + 处置

### 3.1【致命】`lib/client.js` 顶层 require 了不存在的包
- 现状（上游与 duuck 的 bundle 都一样）：`lib/client.js:10` → `require("@deepseek-ai/dsh-client-runtime/client")`
- 证据：npm 上 `@deepseek-ai/dsh-client-runtime` 最后一个版本是 `0.1.1-rc.2`，请求 0.2.0-rc.1 返回 404；asar 里 287 个包中没有它；host 自身 bundle 里 0 处引用
- DSH 实际加载的是 `lib/client.js`（不是 src），所以**插件根本起不来** —— 这正是上游 README 说"安装会崩溃"的根因之一
- **处置**：不再手改产物，直接重建 bundle；`defineStore` / `EngineStoreHandle` 从 **`@deepseek-ai/dsh-client-store`** 取（该包在 0.2.0-rc.1 存在，已确认同名导出）

### 3.2【致命】`settings.plugin.item` 槽已删除
- 旧的插件页卡片注册会**在加载时抛错**（slot 未声明即注册 → 加载期异常）
- **处置（按决策）**：删掉该注册与 `AquaPluginCard` 的接线；总开关保留在外观行（duuck 已经做好了这个开关）
- 备选（若以后想要插件分区入口）：注册 `settings.plugins.tab`（list 槽，`id` + `order` + 本地化 `label`），样例见 §4.2

### 3.3 `ctx.settingsScope` 服务已不存在
- duuck 新增的 `ctx.settingsScope.bind({ namespace: NS })` 与 `inject` 里的 `'settingsScope'` 必须删除（服务缺失会让插件 inject 失败）
- 若将来要把主题设置持久化到宿主配置：新 API 是 `ctx.configForms.get(namespace)` + `inject: ['remote', 'configForms']`（host 的 `ui-theme@0.2.0-rc.1` 就是这么用的，见 §4.1）

### 3.4 其余需要改的元数据/代码
| 位置 | 改法 |
|---|---|
| `package.json` `peerDependencies` | 全换 0.2.0-rc.1 组：删 `dsh-client-runtime`，加 `dsh-client-store`；其余 6 个 client 包 + `dsh-invariants` + primitives 对齐 0.2.0-rc.1 |
| `package.json` `devDependencies` | 同上（类型校验要能解析新 .d.ts），保留 `tsdown@0.22.x` + `@tsdown/css` |
| `package.json` `dsh.client.inject` | 数组里去掉已不存在的包名，保留 `dsh-client-ui-slots / ui-settings / ui-theme / client-locale / ui-primitives` |
| `src/client/settings-store.ts` | import 路径改 `@deepseek-ai/dsh-client-store`（只有这一行） |
| `src/client/index.ts` | 删 §3.2 / §3.3 的内容；`settings.general.item` 行**保持原样**（见 §4.1，写法与 0.2.0-rc.1 官方逐字一致） |
| `src/client/seam-stamper.ts` | `[class*="detailsCol"]` 失效，需按新右侧栏重新定位（§5） |
| `src/client/theme-layer.ts`、`locales.ts` | 主题 token 与 locale API 未变，原则上不动；等类型检查报错再说 |

---

## 4. 可以照抄的 0.2.0-rc.1 官方写法（来自真实产物）

### 4.1 `settings.general.item` 注册（host 的 ui-theme@0.2.0-rc.1 原文）
```js
const inject = ["slots", "locale", "remote", "configForms"]
function apply(ctx) {
  installThemeStyles(ctx)
  const theme = new ThemeRuntime(ctx, ctx.configForms.get(THEME_SETTINGS_NAMESPACE))
  ctx.provide("theme", theme)
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "ui-theme: settings row dictionaries")
  // ...
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "appearance",
    order: 10,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, AppearanceRow))
}
```
→ Aqua 现在的写法与之同形，**外观行不用改结构**；`ctx.slots.inject` 在 0.2.0-rc.1 依然存在且是官方推荐用法。

### 4.2 `settings.plugins.tab` 注册（host 的 plugin-inventory@0.2.0-rc.1 原文）
```js
ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
  name: "settings.plugins.tab",
  id: "all",
  order: 10,
  label: () => t("tab"),        // 本地化标签由注册方提供
  locale: NS,
  inject: injected,
}, PluginInventorySettingsTab))
```
（本轮不用，留档；如果哪天想让玻璃主题在「内置插件」区有个整页入口就用这个。）

### 4.3 store 引擎
`@deepseek-ai/dsh-client-store@0.2.0-rc.1` 导出：`createSnapshotStore`、`defineStore`、`notifySubscribers`、`shallowEqual`，类型 `EngineStoreHandle` / `EngineStoreInstance` / `SnapshotStore`。docs 里说明其引擎是 zustand vanilla + immer + subscribeWithSelector + raf 批处理，**不提供 selector hook**（hook 由 ui-renderer 合成）。

---

## 5. DOM 缝合层核对表（`seam-stamper.ts`，共 10 个 stamp）

Aqua 的 214 处 `[data-dsh-*]` CSS 规则全部建立在这些 stamp 之上：stamp 定位失败 → 那块玻璃整体失效（不崩，只是没效果或错位）。

| stamp 属性 | 选择器 | 0.2.0-rc.1 状态 | 明天动作 |
|---|---|---|---|
| `data-dsh-frame` | `:has(> [class*="sidebarCol"])` | `sidebarCol` 仍在（17） | 复验 |
| `data-dsh-sidebar-root` | `[class*="sidebarCol"] [class*="root"]` | 在 | 复验 |
| `data-dsh-surface` | `button[class*="newSession"]` | `newSession` 在（168） | 复验 |
| `data-dsh-trajectory` | `[data-conversation-composer-overlay]` | 在（5） | 复验 |
| `data-dsh-details` | `[class*="detailsCol"] [class*="root"]` | **失效（0）** | **重定位**：0.2.0-rc.1 右侧面板已由 `dsh-client-ui-sidebar-right` 接管 |
| `data-dsh-inputbar` | `:has(> [data-composer-card])` | 在（5） | 复验 |
| `data-dsh-add` | `[data-composer-card] [class*="add"]` | 需目测 | 复验 |
| `data-dsh-stats` | `[data-slot="conversation.composer.dock"] [class*="root"]` | `conversation.composer.dock` 在（11）；`data-slot=` 出现 8 次（属性是拼出来的） | 复验 |
| `data-dsh-aqua-spot` | `header` / `[class*="sidebarCol"]` / `[data-dsh-inputbar]` / `[data-dsh-trajectory]` / `[data-dsh-surface]` | 依赖上游 stamp | 复验 |
| `data-dsh-wordmark` | `[class*="sidebarCol"] [class*="brand"]` | 需目测 | 复验 |

---

## 6. 分阶段计划

### A. 起步（0.5 天）
1. 把 duuck 源码铺进 `D:\Developer\dsh-ui`（不含 `.git`），`git init` 建新仓
2. 包名/版本自定（建议沿用 `@deepseek-ai/dsh-client-ui-aqua` 或换成自己的 scope，避免与上游混淆）
3. 依 §3.4 改 `package.json`，`pnpm i`
4. `npx tsc -p tsconfig.standalone.json` → 拿到**准确的报错清单**（这一步会把 §3 的推断变成确定清单）
- 验收：tsc 报错清单成文，数量收敛到已知条数

### B. Host API 迁移（1–2 天）
1. 按 §3.2 / §3.3 清理 `index.ts`；§3.4 改 `settings-store.ts` 与依赖
2. `pnpm bundle`（tsdown standalone）重建 `lib/index.js` / `lib/invariant.js` / `lib/client.js`
3. `node --check lib/client.js`；确认 bundle 顶层 `require(...)` 只剩 host 真实提供的 id
- 验收：类型检查通过、bundle 可解析、require 清单全部命中 0.2.0-rc.1 的模块表

### C. 装机 + DOM/视觉校正（3–5 天）
1. 装进 desktop profile 实测（见 §7 第 7 步），看日志有无加载异常
2. 逐个复验 §5 的 10 个 stamp，重定位 `data-dsh-details`
3. 按新 UI 结构校正**全部保留的表面**：顶栏、侧栏（含收起态）、发送栏 + 数据栏、内容区、新建会话按钮、设置页、流体背景层、图片壁纸层、小鱼/气泡、网状交互、铭牌替换、鼠标辉光与悬停下压的落点
   （按 §0.5 仅视频壁纸层与粒子鲸鱼已移除，不再核对）
- 验收：按 §0.5「保留」清单逐项可见（双模式、模糊/磨砂、流体背景 + 色调/深浅、背景亮度、鼠标辉光、悬停下压、铭牌替换、浅深两态）

### D. 可选收尾（0.5–1 天）
- 新结构（`dsh-client-ui-sidebar-right`、settings shell）是否也要玻璃化
- 是否改走 schema 驱动的 `ctx.configForms` 配置表单（更贴新模型，但要重写设置 UI）

---

## 7. 明天第一步（按顺序执行）

```powershell
# 1. 铺代码（源：已下载的 duuck 快照）
Copy-Item 'D:\Developer\_probe\ref\duuck\DSH-Transparent-UI-Plugin-main\*' 'D:\Developer\dsh-ui' -Recurse -Force
cd D:\Developer\dsh-ui; git init

# 2. 改 package.json（peer/dev 依赖 → 0.2.0-rc.1 组，删 dsh-client-runtime，加 dsh-client-store）

# 3. 装依赖
pnpm i

# 4. 先拿报错清单，别急着改代码
npx tsc -p tsconfig.standalone.json

# 5. 重建 bundle
pnpm bundle; node --check lib\client.js

# 6. 检查 bundle 顶层 require 是否全部存在于 0.2.0-rc.1
Select-String -Path lib\client.js -Pattern 'require\("' | Select-Object -First 10

# 7. 装进 profile 实测（可逆：只动 cordis.patch.yml 与 node_modules 软链）
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Source (Get-Location).Path -Profile desktop
#    装完看日志：C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-<今天>.log
```

回退方式：删除 `C:\Users\12140\.dsh\profiles\desktop\cordis.patch.yml` 里对应的 insert 条目 + 移除 `node_modules` 下的链接即可（插件是独立目录，不污染宿主）。

---

## 8. 证据与复现资料

### 本地资料（已就绪，可随时复查）
| 路径 | 内容 |
|---|---|
| `D:\Developer\_probe\ref\{wyh,duuck,hi320}\` | 三个仓库 main 分支快照（zip 解包） |
| `D:\Developer\_probe\npm\*.tgz` / `npmx\` | `ui-slots / ui-settings / ui-theme / client-locale / ui-primitives / ui-settings-plugins / invariants / client-store` 的 0.1.1-rc.2 与 0.2.0-rc.1 包与解包（含 `.d.ts`，用于 API 对照） |
| `D:\Developer\_probe\host\@deepseek-ai\` | 从 asar 解出的 0.2.0-rc.1 真实包（slots / settings / locale / theme / settings-plugins / plugin-inventory / store） |
| `D:\Developer\_probe\asar-*.mjs`、`extract-asar.mjs` | asar 解析、包清单、字符串计数、按包抽取 |

### 关键复现命令
```powershell
# asar 内 @deepseek-ai 包清单（287 个）
node D:\Developer\_probe\asar-dsh.mjs

# 从 asar 解出某个包
node D:\Developer\_probe\extract-asar.mjs dsh-client-ui-slots dsh-client-store

# 全 asar 字符串计数（slot 名 / 服务名 / DOM 钩子是否还在）
node D:\Developer\_probe\asar-scan.mjs ; node D:\Developer\_probe\asar-scan2.mjs

# npm 上某版本是否存在（例：确认 dsh-client-runtime 没有 0.2.0-rc.1）
Invoke-RestMethod 'https://registry.npmjs.org/@deepseek-ai%2fdsh-client-runtime/0.2.0-rc.1'
```

### 参考链接
- 模板（选定）：https://github.com/du-u-uck/DSH-Transparent-UI-Plugin
- 上游功能基线：https://github.com/WYH66666666/DSH-Transparent-UI-Plugin
- 旧版本改法参考：https://github.com/Hearingimpaired-conversion320/DSH-Transparent-UI-Plugin

---

## 9. 风险清单（明天开工时留意）

1. **store handle 兼容性**：宿主 renderer 期望新引擎产物；重建 bundle 后自动对齐，但若沿用旧 bundle 会踩坑（所以必须重建）。
2. **list 槽参数**：0.2.0-rc.1 的 list 槽要求 `id`（并支持 `priority`/`order` 排序）；`label` 只有部分槽（如 `settings.plugins.tab` / `settings.section`）需要。
3. **设置页结构变化**：settings shell 在新版有独立包与 onboarding 阶段，设置页玻璃化的选择器大概率要重挑。
4. **右侧栏/轨迹面板**：从 details 列改为 `sidebar-right`，Aqua 的「轨迹窗」玻璃与悬停下压配方要重新对位。
5. **流体背景 / 辉光 / 铭牌**：三者都与宿主 UI 结构解耦（自带 canvas、自有 data 属性），预期原样可用；主要风险在流体层是否仍能被玻璃正确「压在下面」（z-index/层级顺序随新布局可能变），以及铭牌注入目标选择器在新区块结构下的命中。

