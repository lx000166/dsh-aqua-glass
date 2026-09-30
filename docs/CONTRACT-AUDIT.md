# 宿主契约审计清单

> 每次 dsh-desktop 升级后**先读这一页，再改代码**。
> 本文件记录的是「本插件依赖了宿主的哪些事实」，以及每条事实在某个版本上的实测结果。
> 当前基线：**dsh-desktop 0.2.0-rc.2**（app.asar 121,348,951 字节，2026-09-29 18:34）

---

## 0. 为什么需要这份清单

皮肤类插件最常见的退化**不是构建失败，而是选择器静默失配**：CSS 规则还在、构建也成功，但没有任何元素命中，界面悄悄回到宿主原样。三种情况都真实发生过：

1. **portal 化** —— rc.1 的设置对话框挂在 `[data-slot='sidebar.settings']` 槽内，rc.2 改成 portal 到 `<body>` 并带 `data-shortcut-modal='settings'`。只写槽内选择器的规则全部失配。
2. **结构换包** —— 右侧面板从 `detailsCol` 换成 `dsh-client-ui-sidebar-right`，旧类名片段归零。
3. **属性名存实亡** —— `data-pane` 在 0.2.0-rc.2 全 asar **0 次命中**，写在 `:is()` 里的那一支是死支。

**「属性还在」不等于「兼容」。** 必须走下面的四层级比对。

---

## 1. 审计坐标（每次升级先填）

| 项 | 值 |
|---|---|
| 宿主版本（升级前） | `0.2.0-rc.2` |
| 宿主版本（升级后） | 待填 |
| `runtime.json` 路径 | `D:\Applocation\dsh\resources\runtime\primary-runtime\runtime.json` |
| app.asar 大小 / 时间戳 | 待填 |
| profile | `C:\Users\12140\.dsh\profiles\desktop` |
| 桌面端日志 | `C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-YYYY-MM-DD.log` |

---

## 2. 本插件依赖的全部宿主事实

### 2.1 构建面（manifest / 模块系统）

| 事实 | 0.2.0-rc.2 实测 | 复核命令 |
|---|---|---|
| 客户端产物格式 | `window.__ModuleLoader__.load({ id, factory })`，懒 CJS | `node reference/probe/asar-rc2-scan.mjs` → `window.__ModuleLoader__` 85 处 |
| `dsh.client` 字段 | `platform` / `inject` / `external` / `immediately` 四键 | `node reference/probe/asar-dsh-manifests.mjs` |
| 平台模块表 | `react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`-ui-slots`、`-ui-primitives`、`-client-store`、`-ui-dockkit` | `node reference/probe/asar-require-universe.mjs` |
| `@deepseek-ai/dsh-client-runtime` | **已删除**（asar 内客户端产物 0 次引用） | 同上 |
| bundle patch | `dsh.bundle.patch` 是安装硬门禁，缺失 → `not-bundle` | 见 `PLAN.md` §2 |

> ⚠️ 本项目目标是产物 `require()` 数为 **0**，所以平台模块表即使整表变化也不影响运行 —— `build/web-platform.ts` 的清单只用于构建期纯净门禁。

### 2.2 宿主 DOM 锚点

**宿主包真的会发出**（在 asar 内逐字符串计数得到）：

| 区域 | 属性（命中次数） |
|---|---|
| 浅深色 | `data-ds-dark-theme`(29) |
| 布局 | `data-slot`(14)、`data-shell-overlay`(1)、`data-shell-leading`(1)、`data-windows-titlebar`(42)、`data-sidebar-collapsed`(5)、`data-state`(49)、`data-side`(68)、`data-open`(19)、`data-variant`(12) |
| 会话区 | `data-phase`(13)、`data-chat-flow`(24)、`data-chat-flow-kind`(19)、`data-chat-running`(1)、`data-conversation-scroll`(10)、`data-step-process`(9)、`data-disclosure-row`(4) |
| 输入区 | `data-composer-card`(5)、`data-composer-seat`(3)、`data-composer-input`(1)、`data-conversation-composer-overlay`(5)、`data-queue-dock`(1)、`data-width-handle`(1) |
| 浮层 | `data-shortcut-modal`(4) |
| 局部 | `data-tool`(12)、`data-goal-bar`(2)、`data-cordis-panel`(1)、`data-workflow-run`(1)、`data-plan-review-key`(1)、`data-scroll-up/down`(各 1)、`data-testid`(2) |

**复核命令**：`node reference/probe/asar-data-attrs.mjs`

### 2.3 CSS Module 类名片段（**不是契约，但是当前唯一可用的底座**）

| 片段 | 出处 | 0.2.0-rc.2 命中 |
|---|---|---|
| `sidebarCol` | `dsh-client-ui-layout/lib/client.js` | 17 |
| `newSession` | 多包 | 168 |
| `centerCol` | `dsh-client-ui-layout` | 有（与 `sidebarCol` 同文件） |
| `logoRow` | `dsh-client-ui-sidebar` | 有 |
| `detailsCol` | — | **0，已失效**（右侧面板换包） |
| `data-pane` | — | **0，死支** |

**复核命令**：`node reference/probe/asar-tree.mjs grep "sidebarCol" /dsh/node_modules/@deepseek-ai`

### 2.4 本插件当前用到的缝合点

全部集中在 `src/client/seam.ts`。**改这里 → 同步改 `material.module.css` → `pnpm test` 必须通过。**

---

## 3. 四层级比对（逐条填，不能跳）

对每个缝合点回答四个问题。**只有四层都闭合才能标「无变化」。**

| 层级 | 要回答的问题 | 常见误判 |
|---|---|---|
| **名称** | import / 属性 / 类名片段是否仍存在 | 名称还在就判定兼容 |
| **语义** | 值、状态机、可用时机是否相同 | 属性同名但含义变了 |
| **关系** | owner、父子、兄弟、portal、滚动/定位上下文是否相同 | 中间插了一层 wrapper，`>` 静默失配 |
| **生命周期** | 出现时机、卸载、热重载、重复激活是否相同 | manifest 元信息被当成就绪信号 |

### 结构修复的判定写法

宿主插入无语义 wrapper 后，直属关系会失效——但**不要直接把 `>` 放宽成无界后代查询**，先证明目标仍属于当前 owner：

```ts
const target = candidate.querySelector<HTMLElement>(targetSelector)
const owner = target?.closest<HTMLElement>(ownerSelector)
if (owner === candidate) return candidate
```

`targetSelector` / `ownerSelector` 必须**从本次目标版本的源码与实际调用者推导**，不能从上一版答案复制。

---

## 4. 版本审计记录

### 0.2.0-rc.2（当前基线，2026-09-30 实测）

| 宿主变化 | 本插件触点 | 状态 | 动作 | 证据 |
|---|---|---|---|---|
| rc.1 → rc.2 升级 | 全部 | 已适配 | 骨架按 rc.2 建立 | app.asar 121,348,951 B；289 个 `@deepseek-ai` 包全为 rc.2 |
| `@deepseek-ai/dsh-client-runtime` 删除 | 旧模板的 `lib/client.js:10` | **受影响** | 本项目零 require，天然规避 | asar 客户端产物 0 次引用 |
| `settings.plugin.item` 槽删除 | 旧模板的插件卡注册 | **受影响** | 本项目不注册任何 slot | asar 0 次命中 |
| `settingsScope` 服务删除 | 旧模板的 `inject` | **受影响** | 本项目不 inject 任何服务 | asar 0 次命中 |
| 设置对话框 portal 到 body | 设置面板玻璃（后续阶段） | **受影响** | 选择器同时写槽内与 `[data-shortcut-modal='settings']` 两支 | `seam.ts` 的 `SETTINGS_DIALOG`（S1 阶段补） |
| `data-pane` 不存在 | 列选择器 | 已降级 | `:is()` 第二条腿由 `sidebarCol` / `centerCol` 兜底 | asar 0 次命中 |
| `detailsCol` 不存在 | 右侧栏玻璃（后续阶段） | **待处理** | 右侧栏已换 `dsh-client-ui-sidebar-right`，S2 阶段重定位 | asar 0 次命中 |

### 模板（下次升级照抄）

```markdown
### <旧版本> → <新版本>（YYYY-MM-DD 实测）

| 宿主变化 | 本插件触点 | 状态 | 动作 | 证据 |
|---|---|---|---|---|
| | | 受影响 / 无变化 / 未证实 | | |
```

**状态定义**
- **受影响**：存在真实触点，且名称 / 语义 / 关系 / 生命周期之一已变。
- **无变化**：宿主源码或等价行为可证明相同，**且**触点已逐项覆盖。
- **未证实**：需要真实页面 / 浏览器 / 性能数据才能判断。

---

## 5. 升级后必跑

```powershell
cd D:\Developer\dsh-ui

# 1) 结构测试：选择器是否还完整
pnpm test

# 2) 宿主锚点是否还在（把输出与 §2.2 的表对照）
node reference\probe\asar-data-attrs.mjs

# 3) 客户端模块宇宙是否变了
node reference\probe\asar-require-universe.mjs

# 4) 产物自检：require 必须为 0
pnpm bundle; node --check lib\client.js
(Select-String -Path lib\client.js -Pattern 'require\(' -AllMatches).Matches.Count

# 5) 装机实测 + 看日志
Get-Content "C:\Users\12140\AppData\Roaming\DSH Desktop\logs\dsh-$(Get-Date -f yyyy-MM-dd).log" -Tail 60
```

**真实页面的最小 census**（静态审计证明不了视觉）：对每个已迁移关系记录目标数量与稳定 owner，读取关键计算样式（`backdrop-filter` 是否真的生效、`background` 是否被覆盖），并验证旧的直属/兄弟关系已不再被代码依赖。

**冷验证的边界**：单元测试、build、typecheck 通过**不能**证明视觉、焦点、拖拽、portal 与热切换。没有浏览器授权时，把缺口写成「未证实」，不要写成「已适配」。
