# 与参考项目的差异

> 参考项目：**DSH-Transparent-UI-Plugin**（作者 WYH66666666 / 打包者 du-u-uck，包名 `@deepseek-ai/dsh-client-ui-aqua`，社区里就叫 "aqua 皮肤"）。
> 我们最初的玻璃配方就是从它的上游版本移植的，之后各自演进 —— 这份文档说清楚"它有什么、我们有什么、还差什么"。

---

## 1. 参考料在哪

| 来源 | 位置 |
|---|---|
| 三份参考皮肤（duuck / hi320 / wyh） | `reference/probe/ref/<name>/DSH-Transparent-UI-Plugin-main/`（**gitignored**，换电脑后需重新放） |
| 上游 aqua 原版（我们配方的出处） | `reference/repos/aqua-upstream/` |
| 其它参考料 | `reference/repos/deep-whale/`（鲸鱼/粒子相关的参考）、`reference/repos/dsh-font/`（字体参考） |
| 在线 | GitHub `WYH66666666/DSH-Transparent-UI-Plugin` |

**开关属性的差异**：参考项目把 `data-dsh-aqua` 挂在 **`<html>`** 上（`document.documentElement.toggleAttribute(...)`），
我们挂在 **`<body>`** 上（`body[data-dsh-aqua-glass]`）。所以它的选择器**不能直接粘**过来。

### ⚠️ 许可证：它是 AGPL-3.0，我们也必须是

| 上游 | `LICENSE` 文件 | `package.json` |
|---|---|---|
| `WYH66666666/DSH-Transparent-UI-Plugin`（aqua） | **GNU AGPL-3.0** | 写 MIT ← **自相矛盾** |
| `reference/repos/aqua-upstream`（我们直接照搬数值的那份） | **GNU AGPL-3.0** | 写 MIT |
| 另一个 fork（`hi320` 那份） | MIT（"Copyright (c) 2026 John Wu"） | — |
| `reference/repos/deep-whale` | 无 LICENSE 文件 | 写 MIT |

我们移植了 aqua 的实质内容（玻璃配方数值、`ambient.module.css` 里那段环境层样式、流体着色器、探针表），
属于衍生作品 → **本仓库整体采用 AGPL-3.0**（根目录 `LICENSE`），源码本就公开，满足其源码可得性要求。
**两条规则**：① 以后从上游搬任何东西，先看它的 `LICENSE` 文件而不是 `package.json`；
② 别把本仓库改回 MIT。

> ⚠️ 它自带 README 里额外加了一节「适配 0.1.1-rc.2」，说明它对宿主做过 **API 修补**。
> 我们对着的宿主是 **0.2.0-rc.2**，槽位/API 又变过（`settings.plugin.item` 现在是 0），所以**不能照抄它的注册代码**。

## 2. 架构对照

| | 参考项目 | 我们 |
|---|---|---|
| 产物形态 | 预构建 `lib/client.js`（234 KB）+ `window.__ModuleLoader__.load` 包裹 | 同（`lib/client.js` ≈ 56 KB，tsdown 构建，源码在 `src/`） |
| 宿主耦合 | `theme-layer.ts`（44 KB）+ `aqua.module.css`（37 KB） | `material.module.css`（54 KB）+ `seam.ts`（唯一选择器登记处） |
| 运行时盖章 | `seam-stamper.ts` | 同（我们就是从它移植的） |
| **测试** | ❌ 无 | ✅ **64 项结构断言**（缝合点契约 + 禁区 + "踩过的坑不许复发"） |
| 产物验收 | ❌ | ✅ `verify-bundle.mjs`（零 require / 无 -webkit- 前缀 / 缝合点在位）+ 冒烟加载卸载 |
| 参数调整 | ✅ 设置页面板（`AquaAppearanceRow` 18 KB + store + 插件卡片） | ⚠️ 只有 `localStorage` + 控制台调参 + 诊断角标 |
| 字体 | ✅ 打包了自己的字体（`fonts.module.css` 65 KB） | ❌ 用宿主字体 |
| 装饰层 | mesh / spotlight / spot-core / whale / wordmark-badge / greetings | 只做了 ambient（小鱼/气泡/浮游）+ 流体 |

## 3. 功能矩阵

| 能力 | 参考项目 | 我们 | 说明 |
|---|---|---|---|
| **悬浮玻璃卡布局**（它叫 Mica） | ✅ | ✅ | 侧栏 / 顶栏 / 发送栏三张卡 |
| **兼容模式**（只换材质、布局不动，其他插件的 UI 自动跟着玻璃化） | ✅ | ❌ | **最大的结构性差异**。我们是"重排版"路线 |
| 流体背景（着色器） | ✅（可调色相） | ✅ | 同源移植；我们有 `fluid-shader.ts` + `fluid-tones.ts` |
| 背景亮度（深色变暗 / 浅色变亮） | ✅ 设置里可调 | ⚠️ | 变量在（`--aqua-brightness-white/black`），**没有 UI** |
| 色调 / 颜色深浅 双滑条 | ✅ | ⚠️ | `fluid-tones.ts` 有色相基础，无 UI |
| 图片壁纸（自带模糊/柔光） | ✅ | ⚠️ | **只有 DOM 与选择器**（`[data-dsh-aqua-wallpaper]`），没有选图入口 |
| 视频壁纸（原生解码 / 循环 / File System Access 记住授权） | ✅ v1.3.0 | ❌ | README 里明确写"不做" |
| **粒子鲸鱼**（官网粒子引擎 2D 移植） | ✅ `whale.ts` 17 KB | ❌ | 同上；我们只有小鱼/气泡/浮游的环境层 |
| **鼠标辉光**（跟随光标的青光晕，玻璃之下透出） | ✅ `spotlight.ts` + `spot-core.ts` | ❌ | |
| **悬停下压**（官网卡片同款 3D 倾斜，透视 800px / 放大 1.01） | ✅ v1.2.0 | ❌ | |
| **网状交互** mesh | ✅ `mesh.ts` | ❌ | |
| **边缘淡出**（上下 5px 渐变模糊带，内容滚到边缘时"融化"） | ✅ | ❌ | **最便宜、观感收益最高的一项** |
| 设置页玻璃化 | ✅（含"打开设置不卡顿"的优化） | ✅ | 我们用 `[role='dialog']` 一个锚点覆盖弹窗 + 内部三档层色 |
| 设置界面（外观行 / 插件卡片 / store） | ✅ | ❌ | 我们只有 localStorage + 控制台 |
| HARNESS 铭牌徽章（深色态渐变环胶囊） | ✅ | ⚠️ | 我们只把铭牌底色置透明 |
| 浅色模式聊天文字微投影 + 1px 光晕 | ✅ | ❌ | |
| 滚轮/滚动条材质 | — | ✅ | 我们把它做成了半透明胶囊（它没动这块） |
| 代码块 / 工具卡 / 悬停卡 / 菜单 / 弹窗 逐块玻璃化 | 部分 | ✅ | 我们是**逐个表面**定位根因改的，覆盖面更细 |

> 📌 我们 README 里那张「这一版的范围」表**已经过期**（把"流体背景、小鱼/气泡"列在"待移植"，其实早做完了）。以本文为准。

## 4. 还没加的点（按性价比排序）

### P1 · 便宜且立刻见效

1. **边缘淡出**（上下 5px 渐变模糊带，`position: fixed` + `backdrop-filter` 渐变 mask）
   —— 参考项目已有，纯 CSS，几十行；放在聊天滚动容器之上、玻璃卡之下。
2. **浅色模式聊天文字微投影**（浅底上白玻璃里文字发虚时很救场）—— 一两行 `text-shadow`。
3. **背景亮度 / 色调滑条接进 UI**（变量早在，缺的是入口）—— 可以先用现有的诊断角标思路做个临时面板。

### P2 · 中等成本（装饰层，逐个可加）

4. **鼠标辉光**（`spotlight` + `spot-core`）：跟随光标的径向光晕，画在玻璃**之下**、从磨砂里透出来。
   我们有 `fluid-interactions.ts`，接一个 pointermove → CSS 变量即可。
5. **悬停下压 3D 倾斜**：顶栏/侧栏/发送栏/轨迹窗统一配方（轨迹窗幅度减半），注意它对子元素 `transform` 的影响（会创建包含块）。
6. **网状交互 mesh**：鼠标划过时的几何网线，纯装饰。
7. **铭牌徽章**：深色态给侧栏 wordmark 换渐变环胶囊（纯 CSS + 一点 DOM）。

### P3 · 重（要先想清楚）

8. **兼容模式**：这是架构级差异 —— 需要把"重排版"与"只换材质"做成两套规则并允许切换。
   我们的 CSS 目前是**强版式耦合**的（大量 `margin`/`padding`/`position` 覆盖），拆出"只换材质"子集是一次重构。
   但它的价值很高：**其他插件的 UI 会自动跟着玻璃化**。
9. **设置界面**：参考项目用 `settings.plugin.item` + `ctx.settingsScope.bind` 注册外观行与插件卡；
   而 0.2.0-rc.2 上这些槽位变了（`settings.plugin.item` 实测为 0），需要重新适配，不能照抄。
10. **粒子鲸鱼**：17 KB 的粒子引擎移植 + 性能预算；README 里已被划为"不做"，除非用户重新提。
11. **视频壁纸**：体积、权限（File System Access）、性能三重成本，README 划为"不做"。

## 5. 我们有、它没有的

- **契约测试与产物验收**：64 项断言 + 零 require / 前缀 / 缝合点扫描。升级 DSH 后跑一次就知道哪条断了。
- **逐表面的根因定位**：代码块 header 三层叠加、菜单提示带叠加、发送卡的 backdrop root、宿主 `.card` 自带底色…
  这些都写进了注释与断言，别人踩同一个坑会被测试拦住。
- **临时补丁机制**：宿主 bug（侧栏收起动画）单独成文件 + README 四步删除清单 + 断言指向。
- **滚动条材质**、**诊断角标**、**属性租约**（多实例安全卸载）。

## 6. 真要移植时的注意点

1. **先看它的 `lib/client.js` 还是 `src/`**：它 README 明说"DSH 实际加载的是预构建产物"，源码与产物可能不同步（它的 CHANGELOG 里专门提过同步问题）。
2. **不要照抄注册代码**：`settings.plugin.item` 由 list 改 keyed、`ctx.slots.inject` 已移除改成 `ctx.effect(() => ctx.slots.register(...))`、
   新增 `ctx.settingsScope.bind({ namespace })` —— 那是 **0.1.1-rc.2 的写法**，我们是 0.2.0-rc.2。
3. **它的 CSS 与我们作用域不同**（它挂在 `html` 的属性上，我们挂 `body[data-dsh-aqua-glass]`），选择器要重写不要粘贴。
4. **它引用了自己的字体与资源**（65 KB 字体 CSS + assets）—— 我们的产物**零外部依赖**，引资源要先想清楚打包方式。
