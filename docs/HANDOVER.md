# dsh-aqua-glass 交接文档

> 给**接手的人**（其他开发者，或换了电脑的我自己）。
> 目标：读完这一份 + 下面四份，就能在不问人的情况下继续改这个主题。
>
> 最后更新：2026-09-30（对应提交 `997de71` + 5 个未提交文件，见 §5）

---

## 0. 这是什么

**DSH 桌面端的液态玻璃主题插件**。安装后在 DSH 里多出一个皮肤：
顶栏 / 侧栏 / 发送栏三张悬浮玻璃卡 + 流体背景 + 可选的环境动画。

- 包名 `dsh-aqua-glass`，版本 `0.1.0`，Loader 行 id **`aqua-glass`**
- 总开关：`<body data-dsh-aqua-glass>` —— 属性一撤，**所有**样式作用域退出，宿主原样
- 开关关闭时：不写 body 属性、不挂环境层 DOM、不挂诊断角标、不残留任何宿主属性

## 1. 文档索引

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| **HANDOVER.md**（本文） | 环境、接手步骤、纪律 | 第一天 |
| [STATUS.md](./STATUS.md) | 现在到底改了什么：表面清单、token 表、文件地图、提交历史 | 动手前 |
| [PITFALLS.md](./PITFALLS.md) | **踩过的坑 + 被否的方案 + 禁区** | **每次改代码前必读** |
| [DIFF-VS-REFERENCE.md](./DIFF-VS-REFERENCE.md) | 与参考项目 `DSH-Transparent-UI-Plugin` 的差异、还没做的点 | 想加新功能时 |
| [CONTRACT-AUDIT.md](./CONTRACT-AUDIT.md) | 宿主 DOM 锚点审计（早期） | 升级 DSH 后 |
| [archive/PORTING-0.2.0-rc.1.md](./archive/PORTING-0.2.0-rc.1.md) | ⚠️ **已过期且有害**（版本基线/peer 号/槽位全部过时），只当历史看 | 一般不用 |

## 2. 环境与路径

| 东西 | 路径 |
|---|---|
| 本项目（插件源码） | `D:\Developer\dsh-ui` |
| DSH 桌面端安装目录 | `D:\Applocation\dsh`（主代码在 `resources\app.asar`） |
| DSH **源码**仓库（当"地图"用，强烈建议留一份） | `E:\deepseek-harness-master`（版本 `0.2.0-rc.2`，已与 asar 逐值核对过） |
| 用户目录 / profile | `C:\Users\12140\.dsh` / `…\.dsh\profiles\desktop` |
| 参考项目（参考皮肤，gitignored） | `reference/probe/ref/duuck|hi320|wyh/DSH-Transparent-UI-Plugin-main` |
| 探针脚本（asar 解析、会话日志解压等） | `reference/probe/*.mjs`（Node 直接跑） |

- Node `v22.19.0`、pnpm `9.15.4`
- `reference/` **在 .gitignore 里**（参考料不进仓库）——换电脑后它不会跟过来，见 §6 重建。

### 插件是怎么装进 App 的

profile 的 `package.json` 里用 `link:D:/Developer/dsh-ui` 把这个目录链进去，并在 bundle 列表里注册。
所以**改完源码 `pnpm bundle` 就会热更**（宿主对 `/plugins/*` 强制 `no-store`，客户端侧 500ms 轮询产物）。
`C:\Users\12140\.dsh\profiles\desktop\node_modules\dsh-aqua-glass` 是一个指向本仓库的 **Junction**。

## 3. 命令链

```powershell
pnpm bundle     # tsdown 构建 → lib/client.js（宿主实际加载的就是它）
pnpm test       # vitest，64 项结构断言（读 CSS 文本，不渲染页面）
pnpm verify     # 产物验收（零 require / 无 -webkit- 前缀 / 缝合点在位）+ 冒烟加载
pnpm check      # node --check 产物语法
pnpm typecheck  # tsc --noEmit
pnpm watch      # 开发时挂着，改完自动重建
```

**顺序很重要**：`pnpm smoke`/`verify` 读的是**产物**，所以改完源码必须先 `pnpm bundle`，否则验的是旧代码（这个坑踩过，会出现"假绿"）。

## 4. 交付纪律（用户明确要求过的）

1. **改完让用户完整重启一次 App 再验收**。HMR 会掩盖"特指度平手"这类顺序相关 bug —— 已经骗过两次。
2. **实验性改动先不提交**，留在工作区让用户看效果（`git checkout -- .` 可回滚）。
   用户拍板满意后再 `git add -A && git commit`。
3. **用户否掉的方案不要再试**，清单在 [PITFALLS.md §4](./PITFALLS.md)。
4. 用户是**按截图报细节**的工作方式：他给一张图 + 一句话，我去定位根因再改。
   **不要凭感觉调数值**，能对照渲染就对照渲染（见 §7）。

## 5. 当前状态（重要）

- HEAD = **`997de71`**（滚动条半透明细胶囊）
- **工作区有 5 个未提交文件**：`material.module.css` / `seam.ts` / `seam.test.ts` / `lib/client.js` / `lib/client.js.map`
  → 内容是「设置弹窗 + 差异预览卡玻璃化」（用户已看过、尚未拍板提交）
  → 想留：`git add -A && git commit`；想扔：`git checkout -- .` 然后 `pnpm bundle`
- 测试 **64 项**（HEAD 上是 61 项）
- 产物 `lib/client.js` ≈ 56 KB（源码 `material.module.css` 53.6 KB、`seam.test.ts` 42.7 KB —— 测试比样式还大，这是刻意的）

## 6. 换电脑后怎么重建

1. 装 DSH 桌面端，确认能跑
2. `git clone` 本仓库到 `D:\Developer\dsh-ui`
3. `pnpm install` → `pnpm bundle` → `pnpm test`（应 64 项全绿）
4. 注册插件：在 DSH 的插件页添加，或在 profile 的 `package.json` 里加 `"dsh-aqua-glass": "link:D:/Developer/dsh-ui"`
5. **完整重启 App**，看 `body` 上有没有 `data-dsh-aqua-glass`
6. （可选但强烈建议）把 DSH 源码拉到本地当"地图"：`E:\deepseek-harness-master`（版本必须与 App 一致，否则结论会错）
7. （可选）重建参考料：`reference/probe/ref/` 放 `duuck / hi320 / wyh` 三份参考皮肤，`reference/repos/` 放上游 aqua

## 7. 怎么在这个项目里干活（三步法）

1. **先在宿主源码里找真身**（`E:\deepseek-harness-master`）—— 找到那条 CSS 规则 / 那个组件，别猜类名。
2. **需要判断观感时，用 Chrome headless 对照渲染**，不要凭感觉调数值：
   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
     --force-device-scale-factor=1 --user-data-dir="$env:TEMP\p" --window-size=800,600 `
     --screenshot="$env:TEMP\out.png" "file:///C:/path/to/probe.html"
   ```
   放大看像素：把截图用 `<img style="image-rendering:pixelated;transform:scale(8)">` 再截一次。
   探针页要注意两个坑（都踩过）：伪元素 `z-index:-1` 在没有层叠上下文的容器里会掉到背景层后面；`feImage` 不能引用渐变。
3. **改完补一条断言**（`seam.test.ts`），并在 `material.module.css` 里写下"为什么这么改"的注释 ——
   本项目的注释密度是刻意的高，多数结论都带反例与验证方式。
