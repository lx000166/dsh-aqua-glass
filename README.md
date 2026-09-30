# dsh-aqua-glass

为 **DeepSeek Harness Web GUI** 提供磨砂玻璃材质、流体背景与浅色/深色双态适配的主题插件。

> 施工方案见 [PLAN.md](PLAN.md)；宿主契约与升级审计见 [docs/CONTRACT-AUDIT.md](docs/CONTRACT-AUDIT.md)。

## 安装

在桌面端侧栏打开**插件**页 → **添加插件**，输入包名（或本地绝对路径）→ **安装** → 装完点**立即启用**。

本地开发时直接输入本仓库目录的绝对路径即可（会以 link 方式装入 profile）：

```
D:\Developer\dsh-ui
```

## 开发

```powershell
pnpm install
pnpm bundle          # 产出 lib/index.js + lib/client.js
pnpm test            # 结构测试：缝合点是否还完整
pnpm verify          # 产物验收：零 require + 冒烟加载
pnpm typecheck
pnpm watch           # 改代码自动重建
```

改完重新 `pnpm bundle` 即可，宿主按产物 `mtime + size` 派生 revision，HMR 会自动重载客户端产物，**不用重启**。

## 配置

本轮不做设置面板。参数是写死的默认值，需要改时在页面控制台写 `localStorage`：

```js
localStorage.setItem('dsh-aqua-glass', JSON.stringify({
  enabled: true,   // 总开关；false 时插件释放全部副作用
  blur: 18,        // 玻璃模糊半径 px（0–60）
  frost: 0.55,     // 磨砂度 0–1
  radius: 14,      // 圆角 px（0–40）
}))
```

刷新页面生效。

## 这一版的范围

| 状态 | 内容 |
|---|---|
| ✅ 已实现 | 玻璃材质打在**顶栏 / 侧栏 / 发送栏 / 新建会话按钮**四个表面；浅深两态；总开关与四项可调参数 |
| ⏳ 待移植 | 流体背景、鼠标辉光、悬停下压、小鱼/气泡、网状交互、图片壁纸、HARNESS 铭牌替换、云母/兼容双模式 |
| ❌ 不做 | 视频壁纸、粒子鲸鱼 |

## 架构约束（改代码前先读）

1. **产物零 `require`**。不 import 任何宿主 client 包、不写 React。宿主通过 `window.__ModuleLoader__` 提供一张冻结的模块表，表外的任何 `require` 都会在运行期抛错。`pnpm verify` 会把这条钉死。
2. **宿主 DOM 选择器只出现在 `src/client/seam.ts`**。那是本插件唯一与宿主耦合的文件；改选择器必须同步改 `src/client/material.module.css`，`pnpm test` 会拦住漏改。
3. **所有副作用经 `ctx.effect` 注册**，返回 disposer。bundle 的 factory 体内不许有副作用（宿主是惰性 CJS，factory 只负责注册）。
4. **`peerDependencies` 必须开口区间**（`>=0.2.0-rc.1 <0.3.0-0`）。写闭区间会让插件在宿主升级后被静默禁用——profile 里已经躺着一条这样的前例。

## ⚠️ 临时补丁（**宿主修好后请删除**）

本插件原则上**只加样式、不改宿主行为**。下面这条是唯一的例外，等上游修好就撤掉。

### 侧栏收起/展开缺少滑动动画

| | |
|---|---|
| **症状** | 侧栏收起常常**瞬间到位**、没有滑动动画（展开一般正常），快速点击时更明显 |
| **归属** | **宿主 bug**，非本皮肤引起。已核实：本插件没有覆盖框架的 `transition`，也没碰 `data-animating` 的逻辑 |
| **根因** | 滑动是 `AppFrame` 的栅格轨道做的，过渡挂在框架元素上、由 `data-animating` 开关：<br>`.frame[data-animating] { transition: grid-template-columns: … }`<br>而那个开关**靠 `transitionend` 撤下**（`AppFrame.tsx` 的 `useEffect`）。中途反向切换时，浏览器对被取消的那段过渡派发的是 **`transitioncancel`**（宿主没有监听），于是"没有事件来收尾"的那一段就瞬间到位 |
| **我们的做法** | 把过渡属性**常驻**在框架上，不再依赖宿主的开关时机；同时保留宿主所有需要"瞬时"的场景——拖拽中、右栏瞬时态、`prefers-reduced-motion`，以及**窗口缩放中 / 启动头 1.2s**（后两者由 `animation-patch.ts` 在 `<body>` 上打 `data-aqua-resizing` 标记） |
| **为什么需要缩放那一段** | 宿主刻意让"缩放引发的自动收起"瞬时完成（否则缓动会追着窗口边缘跑）；不补这个，拖窗口边缘时侧栏会跟着缓动 |

**上游修好后的删除清单**（缺一会留下死代码）：

1. `src/client/animation-patch.ts` —— 整个文件；
2. `src/client/material.module.css` —— 搜 `临时补丁`，删掉那个 `@media (prefers-reduced-motion: no-preference)` 块；
3. `src/client/index.ts` —— 删 `startViewportGuard` 的 import、调用与 `stopViewportGuard`；
4. `src/client/seam.test.ts` 与 `scripts/smoke-load.mjs` —— 删标题里带 **【临时补丁】** / `补丁标记` 的断言。

判定"已修好"的依据：宿主不再用 `data-animating` + `transitionend` 这对组合（例如改监听 `transitioncancel`、或改用 Web Animations / `@starting-style`）。对照源码：`apps/.../packages/client/ui-layout/src/client/AppFrame.tsx` 的 `animating` 一段。

## 许可

MIT。构建预设改写自 [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale)（MIT）的 `maid-atelier/build/tsdown.client.ts`；
玻璃材质与后续装饰层移植自 [WYH66666666/DSH-Transparent-UI-Plugin](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin)（Aqua）。
