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

## 许可

MIT。构建预设改写自 [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale)（MIT）的 `maid-atelier/build/tsdown.client.ts`；
玻璃材质与后续装饰层移植自 [WYH66666666/DSH-Transparent-UI-Plugin](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin)（Aqua）。
