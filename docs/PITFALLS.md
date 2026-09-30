# 踩坑与关键结论

> **改代码前必读**。每条都是实际踩过、并且多数已经写成断言或注释的。
> 格式：症状 → 根因 → 修法 → 验证方式。§4 是**被否的方案，不要再试**。

---

## 1. 三条铁律（违反任何一条都会"静默失效"）

### 1.1 主题属性必须写两遍（特指度提权，不是冗余）

```css
body[data-dsh-aqua-glass][data-dsh-aqua-glass] … { }
```

- **症状**：HMR 下正常，**冷启动后整个深色态的 token 覆盖全部失效**（颜色全变）
- **根因**：宿主深色 token 块是 `body[data-ds-dark-theme]` = (0,1,1)，我们单写一遍的前缀**也是** (0,1,1) → 平手 → 由 `<head>` 顺序决定。HMR 时我们的 `<style>` 重新注入排在最后（赢），冷启动时插件 `immediately: true` 注入更早（输）
- **修法**：属性写两遍 → (0,2,1)，与注入顺序彻底解耦
- **不要用 `!important`**：`--aqua-*` 可调参数写在 body 行内样式上，`!important` 会把行内值一起压掉、运行时调参就废了
- 验证：`seam.test.ts` 有一条读**原始文本**的断言专门盯这个

### 1.2 自定义属性：在元素**自己身上**声明 > 祖先继承

- **症状**：祖先上覆盖了一个变量，元素纹丝不动
- **根因**：自定义属性可继承，但**元素自身的声明永远赢过继承值**
- **踩过三次**：① 调参变量写到 `documentElement`，被材质层声明在 `body` 上的默认值盖掉（blur/frost/radius 整整一轮是死的）；② `--changes-fill` 由「已编辑文件卡」在自身声明；③ `--dsw-hovercard-bg: #2C2C2E` 写死在 HoverCard 的 `.card` 上
- **修法**：写到**同一个元素**上（选择器要能命中它本身，不是祖先）
- **推论**：`--dsw-alias-settings-card-fill` 在 `base.css` 里声明成 `var(--dsw-alias-bg-layer-2)`，是在 `body` 上就**解析成结果**再继承下来的 —— 在弹窗里改 layer-2 **摸不到它**，必须单独再写一遍

### 1.3 `backdrop-filter` 会让元素成为 **backdrop root**

- **症状**：元素内部/后代的浮层，模糊**静默失效**（没有报错、没有警告，就是没糊）
- **根因**：后代的 `backdrop-filter` 只能采样「该元素内部已经画好的东西」。浮层若定位在这个元素**之外**（例如浮层挂在卡片顶部之上），采样到的是空 → 只剩半透明填充，底下的文字原样透出来
- **踩过两次**：① 发送卡自己带 `backdrop-filter`，而宿主的 `conversation.input.overlay` 槽在卡**内部**、浮层定位在卡**上边缘之外** → `/` `@` 候选菜单看不清；② 设置弹窗里若有下拉菜单，弹窗自己带 `backdrop-filter` 就会吃掉菜单的模糊
- **修法**：**玻璃画在伪元素上**（`::before`，`z-index: -1`），容器本身不碰 `backdrop-filter`
- **⚠️ 前提**：伪元素敢用 `z-index: -1`，容器必须**自成层叠上下文**（`position: relative` + `z-index` 非 auto）—— 否则那层玻璃会掉到背景层后面去（做探针页时踩过，卡片直接看不见）
- **另一个副作用**：`backdrop-filter` 还会为 `position: fixed` 后代**创建包含块**。宿主侧栏开关就是 `fixed; left:12px`，玻璃糊在列上 → 开关"偏到 logo 的位置"
- 验证：`seam.test.ts` 断言「发送卡 / 弹窗自己不许有 backdrop-filter，玻璃必须在 ::before 上」

---

## 2. 逐个坑

| # | 症状 | 根因 | 修法 / 断言 |
|---|---|---|---|
| 2.1 | 玻璃完全没有模糊，看着像"主题没生效" | lightningcss 在同一声明块里同时看到 `backdrop-filter` 与 `-webkit-backdrop-filter` 时，会**丢掉标准那条**只留前缀；而 Electron 的 Chromium 忽略前缀别名 | **绝不写 `-webkit-` 前缀**；`verify-bundle.mjs` 扫产物禁止出现 |
| 2.2 | 整个背景变成一块渐变 | 用「1px 透明边框 + `border-box`/`padding-box` 两层背景」画描边：border-box 层铺的是**整个盒子**，上层玻璃只有 30% 不透明盖不住 | 描边改用 `mask` + `mask-composite: exclude` 裁 1px 环 |
| 2.3 | 描边像"一条普通白边框" | 渐变端点顶到 **100% 纯白** | 峰值压到 0.62（深色 0.34），亮段收到 9% —— 变成"掠光" |
| 2.4 | 圆角处有锯齿 / 亮线断成一小截（缺口） | ① mask 裁出的环是**硬边**；② `corner-shape: squircle` 下内外轮廓**不是等距曲线**，1px 环在 45° 对角处间距趋近 0，而斜对角最亮那段正好落在那儿 | ① `filter: blur(0.5px)` 做亚像素抗锯齿；② **缺口已接受，不再修**（见 §4） |
| 2.5 | 代码块 header 比正文"实" | 那里叠了**三层**半透明（`.block` 40% + `.bannerWrap` 40% + 工具栏 header 40% ≈ 78%），正文只有两层 | 底座**只补模糊、不给填充**（`background-color: transparent`） |
| 2.6 | 改了 `--dsw-alias-markdown-code-block-banner` 却没变化 | 那条 token 在 markdown 代码块组件上**根本没被消费**（只有 CodeCard 的 header 用它） | 直接瞄元素：`[class*='bannerWrap']`、`:has(> [data-code-block-banner])` |
| 2.7 | 「已编辑 N 个文件」卡一直实心 | 它用的不是 `bg-base` 而是 `--dsw-alias-bg-layer-1` | 瞄 `[data-changed-files]` 元素本身，绕开 token |
| 2.8 | 文本提示气泡在浅色态"白底白字" | 宿主把 `color` 硬编码成白色（配它的不透明深底没问题，配我们的浅玻璃就废） | `[role='tooltip'] { color: var(--dsw-alias-label-primary) }` |
| 2.9 | 菜单底部多出一条 16px 深色带，滚到底消失 | 宿主 `.menu[data-overflow-below]::after` 是「下面还有内容」的渐隐提示，它**在菜单材质之上再叠一层同色**：0.45 + 0.45 ≈ 0.70 | ① 菜单内部把 `--dsw-specific-menu` 退回菜单材质；② **把 `::after` 的 background 置空**，改用 `mask-image` 淡出内容。**只做①不够**（用户复测"还是有"） |
| 2.10 | 侧栏「新会话 / 记忆」两颗按钮不知道谁画的 | 早期归因 `--dsw-alias-button-floating-fill` 是**错的**（该 token 在宿主侧栏包里零引用） | 实际由 `button[class*='newSession']` 一条规则画；记忆插件的入口复用了它 |
| 2.11 | 侧栏内边距过大（36px） | 宿主的侧栏内容根**自己**已有 `--dsh-sidebar-inline-padding: 12px`，我们又加了一层 | 卡片只留 2px 圆角避让，水平留白交还 root |
| 2.12 | 顶栏右侧按钮贴边、左边间距大 | 宿主 `.header { padding: 10px 28px 0 20px }` 与 `.headerCorner { margin-right: -16px }` 是**一对** | 只改 `padding-left: 12px`；**绝不**写 `padding` 简写或 `padding-right` |
| 2.13 | 发送卡比侧栏/顶栏"更实、还发蓝" | 卡片上补了 `::before` 玻璃后，忘了掐掉宿主 `.card` 自带的 `background: var(--dsw-specific-input-major)`（= `--aqua-well`，深色态 40% 蓝灰）—— 它压在玻璃**下面**，还会被 `backdrop-filter` 一起采样 | 卡上显式 `background: transparent`（**以前的 `background: var(--aqua-glass)` 是把它替换掉的，所以搬走填充就露出来了**） |
| 2.14 | 运行时调参（blur/frost/radius）一直是死的 | 写到 `documentElement` 上，被材质层在 `body` 上的默认值盖掉（见 §1.2） | 改写到 **body 行内样式**；并补"负向断言"（只测写入方 = 假绿） |
| 2.15 | 诊断角标在"插件页"误报 ✗ | 会话相关的探针在无会话时读到空 | 无会话时显示 `– n/a（无会话）`，不计入健康度 |

---

## 3. 禁区（不许全局覆盖的 token）

| token | 消费点数量 | 为什么不能全局动 |
|---|---|---|
| `--dsw-alias-bg-layer-1` | **35+** | 大量是**输入框与小控件**（search input / address / 徽章 / 箭头 / 表格单元格），且多数在不透明父面板内、背后没有流体 → 全局降透明 = 既糊又白改 |
| `--dsw-alias-bg-layer-2` | **17+** | 轨迹表、浏览器视图、文档预览、输入框、徽章… |
| `--dsw-alias-bg-layer-3` | — | 同上 |
| `--dsw-alias-settings-card-fill` | 5（全在设置类面板） | 虽少，但定义成 `var(--dsw-alias-bg-layer-2)`，直接改它等于改 layer-2 |

**唯一允许的例外**：`[role='dialog']` **作用域内**（弹窗里的控件本来就压在玻璃上、背后是模糊过的底）。
`seam.test.ts` 的做法是：先把弹窗那条规则从文本里剔掉，再全文扫描 —— 既守住禁令，又给例外留了口子。
**加新的例外必须同时改这条断言的"剔除范围"，并在注释里说明理由。**

**可以安全下手的**（各自有清晰且唯一的消费方）：
`--dsw-specific-menu`（18 个消费点，几乎全部自带 backdrop-filter）、四个 `--dsw-alias-scrollbar-*`
（宿主 `scrollbar.css` 自称是它们的**唯一消费者**）、`--dsw-specific-*` 系列。

---

## 4. 被否 / 不采用的方案（不要再试）

| 方案 | 结论 | 用户原话 / 理由 |
|---|---|---|
| **竖直光轴描边**（上下亮发丝线 + 左右暗线，来自 kube.io 那篇对 macOS 控制中心的实测） | ❌ 否 | 能治圆角缺口，但「现在的上下/左右感觉不如之前的」—— 横向长条上读成两条平行线，丢立体感 |
| 斜对角 + 描边环**加厚到 1.5px** | ❌ 否 | 「更丑了 直接放弃代码回滚到初版」（1.5px 确实能补上缺口，但整体变重） |
| **肩部高光** `--aqua-shoulder`（上下 16px 渐隐） | ❌ 否 | 随上一轮一起被否，一行代码都没留下 |
| **左上镜面光斑** `--aqua-specular`（radial 扫光） | ❌ 否 | 同上；且用户明确**不喜欢玻璃泛白** |
| **真折射 / 边缘透镜**（canvas 按元素实际像素尺寸生成位移图 → `feImage` → `feDisplacementMap` → `backdrop-filter: url(#lens)`） | ⏸️ 可行但不做 | 原型验证成功（边缘确实把背景弯折了），但：① `backdrop-filter` 尺寸**不自适应元素**，位移图必须按实际像素尺寸生成 → 要 JS + canvas + ResizeObserver 逐卡维护；② SVG 滤镜版 backdrop-filter 比纯 blur 重得多，三块大面板每帧跑，对皮肤插件性价比低 |
| **竖排/其他几何改动** | ❌ | 几何属于宿主：侧栏/顶栏/发送栏的 padding、margin 一律不动（已经因此回退过两次） |

**左上圆角那一点点小缺口 = 已接受**，不要再"顺手优化"。要动描边先问。

---

## 5. 锚点纪律（选择器优先级）

**从高到低**，能用前面的就不要用后面的：

1. **标准 ARIA role / 属性**：`[role='dialog']`、`[role='tooltip']`、`[role='listbox']`
2. **宿主语义属性**：`[data-composer-card]`、`[data-changed-files]`、`[data-menu-material]`、`[data-changes-hover-preview]`、`[data-code-block-banner]`、`[data-conversation-scroll]`
3. **我们自己盖的章**：`[data-aqua-add]`、`[data-aqua-trajectory]`、`[data-aqua-frame]`、`[data-aqua-sidebar-root]`（`seam-stamper.ts`，只给"需要唯一元素语义"的地方用）
4. **稳定字面类名**：`.md-code-block`
5. **类名片段**：`[class*='newSession']`、`[class*='bannerWrap']`（预构建产物与插件构建的哈希前缀**不同**，片段选择器两边都能命中）
6. ❌ **哈希类名**：`_bannerWrap_7gxqk_24`、`xz4KEq_bannerWrap` —— 禁止

**内容反查容器**用 `:has()`：卡片是 body 直接子元素时选择器收紧到 `> div`。
**所有选择器只许出现在 `src/client/seam.ts`**，改完必须同步 CSS（测试会拦）。

---

## 6. 验证这件事本身的坑

| 坑 | 说明 |
|---|---|
| **HMR 会骗人** | 它掩盖"特指度平手"这类**顺序相关** bug（已经骗过两次）→ 改完必须让用户**完整重启** App 验收 |
| **冒烟/验收读产物** | `pnpm smoke` / `verify` 读的是 `lib/client.js`，改完源码**必须先 `pnpm bundle`**，否则验的是旧代码（出现过"假绿"） |
| **只测写入方 = 假绿** | 调参那次只断言了"写进了 localStorage"，没断言"样式真的生效" → 补负向断言 |
| **`String.match` 带 `/g` 返回整段匹配、不是捕获组** | 用 `matchAll` 取捕获组，否则断言会假通过 |
| **探针页的两个坑** | ① 伪元素 `z-index: -1` 在没有层叠上下文的容器里会掉到背景层后面（卡片直接看不见）；② `feImage` **不能引用渐变**（`href="#某个radialGradient"` 会让整条 `backdrop-filter` 失效 —— 我就是这样误判了"SVG 滤镜不被支持"） |
| **Windows 上 `ReplaceFileW EIO (Win32 1175)`** | 编辑器偶发写文件失败，重试即可 |
| **产物里查不到 `::before` 不代表没生效** | lightningcss 会把 `::before` 压成 `:before`，按压缩后的写法核对 |

---

## 7. 一条重要的"纠错记录"

**`backdrop-filter: url(#svg滤镜)` 在本机 Chromium 上是生效的。**
我一度得出"不支持"的错误结论，原因是探针页里那个滤镜写成了 `feImage href="#渐变"`（非法）→ 整条属性被带崩。
控制变量重测：`url(#feGaussianBlur)` 正常磨砂、`url(#feTurbulence+feDisplacementMap)` 背景被明显扭曲、普通 `filter: url()` 也正常。
**教训**：得出"某特性不支持"这种结论前，先证明**自己的探针是有效的**（用同一份滤镜在另一条路径上跑通）。
