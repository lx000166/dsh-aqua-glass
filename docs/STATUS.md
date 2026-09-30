# 现状：这个主题到底改了什么

> 对应提交 `997de71` + 5 个未提交文件（末尾标注）。改动清单按「表面」组织 —— 找问题时先在这张表里定位。

---

## 1. 一句话

把宿主 DSH 的**四个外壳表面**换成悬浮玻璃卡，把**内容表面**降成半透明凹槽，
再加一层**流体背景**（L3），最后把宿主那些"实心色块"逐个换成玻璃或半透明。

## 2. 表面清单（改了什么 / 锚点 / 手法）

| 表面 | 锚点 | 手法 |
|---|---|---|
| **侧栏卡** | `:is([data-pane='sidebar'], [class*='sidebarCol'])` | 玻璃画在 `::before`（列本身**不许**带 backdrop-filter，会毁掉 fixed 定位的侧栏开关）；`::after` 用 mask 裁 1px 描边环 |
| **顶栏卡** | `:is([data-pane='conversation'], [class*='centerCol']) header[class*='header']` | 同款配方；**只改 `padding-left`**，右侧那对内边距/负外边距绝不碰 |
| **发送栏卡** | `[data-composer-card]` | 玻璃在 `::before`；卡上**显式 `background: transparent`**（宿主 `.card` 自己画着一层 `--dsw-specific-input-major`） |
| 会话顶栏「返回顶部」等浮动按钮 | `--dsw-alias-button-floating-*` | token 覆盖 |
| **内容凹槽** | `--dsw-alias-markdown-code-block` / `-banner` / `--dsw-alias-markdown-inline-code` / `--dsw-specific-input-major` | token 覆盖（**行内代码刻意不加模糊**：一屏几十个 `<code>`，逐元素模糊会掉帧） |
| 工具卡 / 代码块标题栏 | `[data-conversation-scroll]` 子树内覆盖 `--dsw-alias-bg-base` | 限定在转写滚动容器里，范围外仍是根值 |
| 代码块 header 底座 | `[class*='bannerWrap']`、`:has(> [data-code-block-banner])` | **只补模糊、不给填充**（那里本来就叠了三层，再加一层就是"实心"的真凶） |
| 「已编辑 N 个文件」卡 | `[data-changed-files]` | 元素上覆盖 `background` + `--changes-fill: transparent`（该变量由卡片在自己身上声明） |
| **差异预览卡**（悬停文件行） | `> div:has([data-changes-hover-preview])` | 玻璃（宿主用不透明的 `--dsw-alias-bg-layer-1`）**（未提交）** |
| 工作区会话行悬浮卡 | `> div:has([class*='hoverContent'])` | 玻璃 |
| **菜单浮层**（`/` `@` 候选、下拉） | `[data-menu-material]` | ① 内部把 `--dsw-specific-menu` 退回菜单材质；② 底部提示带**不画底色**，改 `mask-image` 淡出内容 |
| **应用弹窗**（设置面板 + Modal） | `[role='dialog']` | 玻璃在 `::before`；弹窗内部把 layer-1/layer-2/settings-card-fill 三档层色一起玻璃化 |
| **浮层族：提问 / 计划确认 / 审批** | `[data-question-key]` / `[data-plan-review-key]` / `[data-approval-key]` | 补 `backdrop-filter`（它们吃 `--dsw-specific-input-major`，宿主原值不透明所以没写模糊） |
| 图片灯箱 | `[role='dialog'] > img` / `> button` | 衬底用回宿主静态色保持**不透明**，关闭钮补模糊 |
| 账号提示浮卡 | `> aside`（body 直接子元素） | 补模糊 |
| 提示气泡 | `[role='tooltip']` | 底色 token + **文字色跟着主题**（否则浅色态白底白字） |
| 侧栏按钮（新会话 / 记忆） | `button[class*='newSession']` | 按钮专用一档（16%），比卡片淡 |
| 「+」附件按钮 | `[data-aqua-add]`（自盖章） | 玻璃 + 18% 描边 |
| 发送键 | `[data-composer-card] button[class*='primary']` | `color-mix` 把品牌蓝降到 70%，**不换色** |
| 轨迹视图 | `[data-aqua-trajectory]`（自盖章） | 玻璃面板 |
| **滚动条** | `--dsw-alias-scrollbar-bg/hover-l1/l2` + `--dsh-scrollbar-thumb-border` | 半透明冷色（浅深两态），基础档 1px 内缩成 3px 细胶囊 |
| 原生标题栏（Windows 那条带子） | `--dsw-specific-sidebar-fill: transparent` | preload 探针读它当 `titleBarOverlay` 底色 |
| L3 流体背景 + 环境动画 | `[data-dsh-aqua-ambient]` 等自建 DOM | canvas 流体着色器 + 小鱼/气泡/浮游 |

## 3. 我们自己的旋钮（`--aqua-*`）

运行时可在控制台调（写在 **body 行内样式**，所以样式表里绝不能用 `!important`）：

```js
localStorage.setItem('dsh-aqua-glass', JSON.stringify({ blur: 14, frost: 1.2, saturate: 150, radius: 16 }))
```

| 变量 | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `--aqua-blur` / `--aqua-saturate` | 12px / 140% | 同 | 玻璃滤镜（`--aqua-filter`） |
| `--aqua-frost` | 1 | 同 | **乘数**，同时缩放下面所有填充的不透明度 |
| `--aqua-glass` | 白 30% | `rgb(34 38 47)` 38% | 三张卡片的填充 |
| `--aqua-surface` / `-hover` | 48% / 62% | 48% / 58% | 抬升一档（按钮） |
| `--aqua-well` | 白 40% | `rgb(58 66 82)` 40% | 内容凹槽（代码块/工具卡/输入） |
| `--aqua-pill` / `-hover` / `-line` | 16% / 26% / 0.10 | 16% / 26% / 0.12 | 侧栏两颗按钮 |
| `--aqua-bubble` | 白 34% | `rgb(58 66 82)` 34% | 我发出的对话气泡 |
| `--aqua-edge` | 140° 斜对角渐变（峰值 0.62） | 同结构（峰值 0.34） | 1px 描边环 |
| `--aqua-edge-blur` | 0.5px | 同 | 环的亚像素抗锯齿 |
| `--aqua-corner` | `squircle` | 同 | 超椭圆圆角（Chrome 139+，不支持自动退回圆角） |
| `--aqua-inset` / `--aqua-shadow` | 顶部内高光 / 外投影 | 深色各一档 | |

## 4. 覆盖的宿主 token（`--dsw-*`）

```
--dsw-specific-sidebar-fill: transparent        ← 原生标题栏 + 侧栏内容根
--dsw-alias-bg-base                             ← 只在 [data-conversation-scroll] 子树内
--dsw-alias-markdown-code-block / -banner / --dsw-alias-markdown-inline-code
--dsw-specific-input-major / --dsw-specific-bubble / --dsw-specific-menu
--dsw-alias-button-floating-fill / -hover / --dsw-alias-button-elevated-fill / -tool-bar-fill
--dsw-alias-interactive-bg-hover-solid          ← 宿主那档不透明悬停色，深浅分层
--dsw-alias-tooltip-bg
--dsw-alias-scrollbar-bg-l1/l2 / --dsw-alias-scrollbar-hover-l1/l2
--dsw-alias-bg-layer-1 / -2 / --dsw-alias-settings-card-fill   ← ⚠️ **只允许出现在 [role='dialog'] 作用域内**
```

## 5. 文件地图

| 文件 | 职责 | 注意 |
|---|---|---|
| `src/index.ts` | 宿主半侧，空的 `apply()` | 它存在的唯一意义是让 Loader 树里有一行，宿主扫 `package.json` 的 `dsh.client` 才会加载客户端半侧 |
| `src/client/index.ts` | 挂载/卸载：写 body 属性、注入样式、起各模块 | 所有副作用走 `ctx.effect` |
| `src/client/material.module.css`（53.6 KB） | **L2 材质层**，所有规则以 `body[data-dsh-aqua-glass][data-dsh-aqua-glass]` 开头 | 属性**写两遍**是特指度提权，别当冗余删（`seam.test.ts` 有断言守着） |
| `src/client/ambient.module.css` | L3 环境层（流体板/小鱼/气泡/壁纸层 DOM 选择器） | 同上 |
| `src/client/seam.ts`（6.8 KB） | **唯一**登记宿主选择器的文件 | 改选择器必须同步改 CSS；测试逐条断言"原样出现在样式表里" |
| `src/client/seam-stamper.ts` | 给宿主元素盖 `data-aqua-*` 章 | 只给"需要唯一元素语义"的地方用 |
| `src/client/seam.test.ts`（42.7 KB，64 项） | 结构断言 | 读 CSS 文本，不渲染；换 DSH 版本后跑一次就知道哪条断了 |
| `src/client/animation-patch.ts` | ⚠️ **宿主 bug 的临时补丁**（侧栏收起动画） | 上游修好后按 README 的四步清单删除 |
| `src/client/config.ts` | localStorage 调参 | |
| `src/client/dom-lease.ts` | 属性租约（多实例时最后一个释放才恢复） | |
| `src/client/diagnostic.ts` | 诊断角标（computed 值探针） | **已下线**：不再挂载，模块按项目约定保留并标 `@deprecated`（需要时在 `index.ts` 放两行即可恢复）；`config.debug` 同样保留但已无消费方 |
| `src/client/fluid-*.ts` / `ambient*.ts` | L3 流体着色器与场景 | 从上游 aqua 移植 |
| `scripts/verify-bundle.mjs` + `smoke-load.mjs` | 产物验收 / 冒烟 | |

## 6. 提交历史（从旧到新，26 个）

```
4e4e9ea 换回上游原版玻璃配方，修掉 backdrop-filter 被丢掉的根因
4a97706 【L1】移植上游运行时盖章器
a99e64c 按反馈回退三处（不融合数据行 / 收起态交回原生 / 主题化原生标题栏）
afbe770 侧栏只换材质不动几何；内容根置透明
4f0f49f 玻璃挪到伪元素 —— 修掉侧栏开关错位
ec5f35f nav 栏真正透明 + 三处渐变描边 + 侧栏底部去白
cbbb82c 描边改为明暗成对；降低玻璃填充与模糊（去掉泛白）
bf8a1cb 渐变描边改用 mask 裁环
9ba3eb3 【L2】内容表面玻璃化（代码块/行内代码/工具卡/侧栏按钮）
e467b80 修掉运行时调节参数被静默盖掉 + 玻璃补提饱和
5abd68d 浮层材质降到 72%（走 --dsw-specific-menu，不碰 bg-layer-*）
622c59d 四处实心色块玻璃化 + 更正两条错误归因
7bcecc6 首页五处细节
29d21f3 特指度平手导致「重启后深色态全失效」+ 角标误报
a62be5b 代码块 header 的真身是「多叠了一层」
b9976aa 顶栏左右边距配平 + 悬浮提示气泡玻璃化
0d9c3ca 发送按钮改半透 + 侧栏宽度释放
817939f 侧栏收起动画 —— 临时补丁（README 已标注待删）
cb6881e / 与 @ 候选浮层看不清 —— 发送卡是 backdrop root
2d4cfe0 发送卡补 background:transparent
7f0c1dd 菜单底部那条深色带（第一步：token 退回）
1be3d25 菜单底部提示带（第二步：不叠底色，改遮罩淡出）
76bf8fd 卡片玻璃描边与圆角提质（掠光 / 抗锯齿 / squircle）
997de71 滚动条改半透明冷色细胶囊          ← 当前 HEAD
```

**未提交（工作区）**：差异预览卡玻璃化 + 设置弹窗（含内部控件层色）玻璃化。

## 7. 验收指标

| 项 | 现在 |
|---|---|
| `pnpm test` | **64 项**（HEAD 上 61 项） |
| `pnpm verify` | 零 `require`、无 `-webkit-backdrop-filter`、缝合点在位、冒烟加载/卸载可回收 |
| 产物 | `lib/client.js` ≈ 56 KB（gzip ≈ 15 KB 量级） |
| 副作用回收 | 卸载后 body 属性、环境层 DOM、诊断角标、注入的 `<style>` 全部撤净（冒烟逐条断言） |
