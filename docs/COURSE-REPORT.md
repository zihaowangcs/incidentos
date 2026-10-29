# IncidentOS：Harness 能力与 DSH 特性说明

## 项目概述

IncidentOS 是一个证据优先的事故响应 Agent 产品。用户打开页面后，无需阅读使用文档、配置 API Key 或连接真实生产系统，即可从两个内置事故中选择一个，完成多角色调查、证据核验、反证审查、人工审批、处置模拟、恢复验证和复盘导出。

- 在线体验：https://zihaowangcs.github.io/incidentos/
- 代码仓库：https://github.com/zihaowangcs/incidentos
- DSH 插件安装包：https://github.com/zihaowangcs/incidentos/releases/tag/v0.1.0
- 知识库：仓库根目录 `knowledge/`

## 1. 使用的 Harness 能力

本项目实际使用了六项 Harness 能力，超过课程要求的三项。

| Harness 能力 | 对应文件路径 | 解决的开发问题 | 使用前 | 使用后 |
|---|---|---|---|---|
| AGENTS.md | `AGENTS.md` | 多轮开发时容易改变目录边界、把演示动画当成真实状态，或产生无法追溯到证据的结论 | 约束只存在于对话中，每一轮都可能遗漏 | 目录职责、命令、禁止事项、证据规则、审批规则和验收标准成为仓库级契约，每轮 Agent 都能重新读取 |
| 知识库 | `knowledge/incident-policy.md`、`knowledge/event-contract.md`、`knowledge/report-schema.md` | 事故等级、有效证据、事件顺序和复盘结构容易散落在 UI、提示词与代码中 | “恢复”“证据充分”“报告完整”没有统一定义 | Skill、领域引擎、测试和插件引用同一套规则；知识变更可以被审查和回滚 |
| Skill | `.agents/skills/add-investigator/SKILL.md` | 新增调查员时容易只改 UI，漏掉类型、两个事故夹具、证据位置、测试和调用记录 | 依靠开发者记忆多个同步修改点 | 固定为“读取知识 → 声明职责 → 更新模型与夹具 → 添加断言 → 运行验证 → 记录调用”的可重复流程 |
| Skill 调用证据 | `docs/harness/skill-invocations.md` | 只存在 Skill 文件不能证明流程被实际复用 | 无法判断 Skill 是事后摆设还是开发工具 | 记录 Change Auditor 和 Metrics Investigator 两次应用，包括触发原因、读取知识、产物和验证结果 |
| Goal 模式 | `docs/harness/goal-prompt.md`；持久状态由 DSH 会话日志保存 | 产品、插件、测试、文档和部署需要跨多轮完成，普通单轮容易在局部完成后提前结束 | 需要人工反复说明剩余任务，长目标和停止条件容易丢失 | 一个持久 Goal 跨四个自动 Round 保留 objective、revision、phase 和轮数；整体验证通过后才标记 complete |
| Loop | `package.json` 中的 `verify`、`tests/engine.test.ts`、`.github/workflows/pages.yml` | 修改夹具、引擎或插件后可能破坏证据和审批不变量，手工点 UI 无法覆盖失败路径 | 只能依靠人工演示确认主路径 | `test → Web build → plugin build → package dry-run → Pages deploy` 形成开发、测试、修复和部署闭环 |
| Plugin | `plugins/incidentos/package.json`、`plugins/incidentos/cordis.patch.yml`、`plugins/incidentos/src/index.ts` | 专项流程和行为约束如果只留在仓库，其他 dsh 用户无法作为 Agent 能力安装 | 同学只能复制提示词或阅读文档 | 一个可安装 DSH bundle 同时注册运行时 Skill 和系统提示词约束，安装、作用域和卸载均由插件生命周期管理 |

### 一个问题一个解法

- Agent 容易无证据下结论：使用稳定证据 ID、来源位置和跨来源测试断言。
- 多个角色容易重复赞同：引入独立 Skeptic、最强替代解释和判别测试。
- 自动化容易越权操作：高风险处置必须显式人工审批；拒绝后不会产生 `action-executed` 事件。
- 动作成功容易被误判成事故恢复：显式比较恢复指标，全部通过后才能导出复盘。
- 新增调查能力容易漏改：使用 `add-investigator` Skill 固化同步修改与验证流程。
- 长任务容易半途交付：使用持久 Goal 和明确停止条件。
- Agent 能力无法分发：使用 DSH Profile Bundle 打包 Skill 与 guardrails。

## 2. 使用的 DSH 差异化特性

### 特性：一切皆插件的 Profile + Cordis 组合

IncidentOS 使用了 DSH 的“一切皆插件”运行时，而不是仅在仓库里放一段提示词。

`plugins/incidentos/package.json` 通过以下声明把项目定义为可安装的 DSH bundle：

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

`plugins/incidentos/cordis.patch.yml` 将 `incidentos-agent` 作为 Cordis 插件行插入 profile。插件入口 `plugins/incidentos/src/index.ts` 在同一个 `apply(ctx)` 生命周期内贡献两项能力：

1. `ctx.skills.register(...)` 注册模型和用户都可调用的 `incident-response` Skill；
2. `ctx.systemPrompt.section(...)` 注册证据引用、反证审查、人工审批和指标验证 guardrails。

插件通过 `ctx.effect(...)` 注册贡献。插件卸载时，对应 disposer 会一起移除 Skill 和提示词章节，不需要维护第二套启停状态。发布的 `incidentos-dsh-plugin-0.1.0.tgz` 经 dry-run 验证，仅包含 `README.md`、`cordis.patch.yml`、`lib/index.js` 和 `package.json` 四个文件。

### 为什么选择这个特性

事故响应不是一个孤立工具调用。它同时需要：

- 可重复的专项调查流程；
- 证据和反证规则；
- 高风险动作审批约束；
- 可安装、可卸载、可限定作用域的生命周期；
- 交给其他同学后能直接组合进其 Agent profile 的交付形式。

因此，Profile Bundle 比复制提示词或单独提供脚本更合适。用户安装一次，就能获得一致的 Skill 与系统约束。

### 与 Claude Code / Codex 的差别

Claude Code 和 Codex 也可以使用仓库指令、Skill 或 MCP 工具完成事故分析。差别不在于“只有 dsh 能分析事故”，而在于能力的组合模型：

- Claude Code / Codex 常见做法是分别配置仓库指令、Skill、Hook 或 MCP 工具；它们通常属于不同入口。
- DSH 把 Agent 本身看成插件组合。插件可以向服务、事件、模型工具、Skill、系统提示词和浏览器 Slot 等注册表贡献能力，并由 Cordis 统一管理作用域和生命周期。
- IncidentOS 实际使用了 Profile Bundle、Skill 注册表和 System Prompt 注册表。安装包不是文档附件，而是可以被 profile 安装、组合和卸载的 Agent 能力单元。

这正是本项目选择 DSH 的原因：最终交付的不只是一个普通 React 页面，而是一套可安装的 Agent 能力组合，以及用于无配置体验该能力的 Web 产品。

## 3. Goal 模式原始交代词

本项目使用了 DSH Goal 模式，最多允许 20 个自动 Round，实际在第 4 个 Round 完成。下面保留开发时的原始 objective：

> 在 /Users/naplescode/Desktop/dshstudy 完整实现 IncidentOS：一个可直接体验的多 Agent 事故调查与处置 Web 产品，包含至少两个确定性事故场景、证据化根因分析、反证审查、人工审批、处置模拟、验证和复盘导出；提供真实可审查的 DSH 插件交付、AGENTS.md、可重复触发的 Skill、知识库、Goal 原始交代词、开发/测试闭环、Harness 能力说明、演示脚本和自动化测试。完成前运行全部验证，并启动可供用户访问的本地开发服务器。

### 完整交代结构

#### 目标

交付一个同学打开即可体验的 IncidentOS 产品，同时交付可安装 DSH 插件、代码、知识和开发证据。

#### 资料

- DSH 实现 checkout：`/Applications/DSH Desktop.app/Contents/Resources/app/`
- 仓库规则：`AGENTS.md`
- 事故政策：`knowledge/incident-policy.md`
- 事件契约：`knowledge/event-contract.md`
- 报告结构：`knowledge/report-schema.md`

#### 验证

1. 两个事故都能完成选择、调查、查证、反证、审批、处置、验证和导出。
2. 根因引用至少三条、至少两类来源证据。
3. 每个事故包含一个明确被排除的假设。
4. 高风险处置未经人工批准不能执行或验证。
5. `npm run verify` 全部通过。
6. DSH 插件可以编译，且 `npm pack --dry-run` 只包含声明的交付文件。
7. 本地体验服务成功响应。

#### 授权

允许在工作区中创建和修改源码、安装固定版本依赖、执行构建和测试，并启动本地开发服务器。禁止真实生产操作、外发项目数据和绕过人工审批。

#### 停止条件

只有全部验证通过且体验服务可访问时标记 Goal 完成。同一外部条件连续至少三轮阻塞才能标记 blocked；普通错误必须继续修复。

### 验证环境如何提前准备

Goal 要发挥作用，必须让后续 Round 可以自行验证，而不是持续等待人工或不稳定外部系统。本项目提前准备了：

1. **固定事故夹具**：在 `src/data/incidents.ts` 内置支付重试风暴和数据库连接池耗尽，避免依赖真实日志平台。
2. **确定性领域引擎**：`src/domain/engine.ts` 使用固定事件、显式审批状态和指标比较器，不依赖随机值。
3. **无需 API Key**：产品没有模型账号、监控系统或数据库配置门槛。
4. **自动化合约测试**：`tests/engine.test.ts` 覆盖证据引用、多来源支持、反证、审批门禁、拒绝不执行、恢复验证和禁止提前导出。
5. **生产构建门禁**：Vite 和 TypeScript 验证浏览器交付物。
6. **插件门禁**：插件单独进行 TypeScript 编译和 `npm pack --dry-run`。
7. **部署闭环**：GitHub Actions 在 Pages 部署前执行完整 `npm run verify`。

最终验证结果记录在 `docs/harness/verification.md`。本地和 GitHub Actions 均通过 6 项测试、Web 构建、插件编译和四文件 tarball 检查。

## 4. 没做好的地方和下一步

### 4.1 多 Agent 目前是确定性编排

当前七个调查角色使用确定性角色编队、领域事件和证据归因，以确保课程演示每次可复现；它们不是七个实时并行的大模型实例。

下一步：接入 DSH subagent 运行时，让日志、指标、变更和反证调查员并行执行真实分析，同时继续强制输出同一证据契约。

### 4.2 尚未接入真实观测系统

当前日志、指标、链路、部署和数据库证据均来自安全夹具，处置动作也只在模拟器中执行。

下一步：增加只读 Prometheus、Loki 和 OpenTelemetry 连接器；任何写操作继续保留人工审批、最小权限和沙箱边界。

### 4.3 插件还没有贡献 DSH Web Slot

当前 DSH 插件贡献了 Skill 和系统提示词；独立 React Web 提供无需配置的完整产品体验。工作台尚未作为 Client Plugin Slot 直接嵌入 DSH Web。

下一步：将证据工作台封装为 DSH Client Plugin，让用户安装 bundle 后在 DSH Web 内直接打开 IncidentOS 页面。

### 4.4 场景覆盖有限

当前只有支付重试风暴和数据库连接池耗尽两个场景，能够证明流程，但不足以覆盖更广的线上事故类型。

下一步：继续使用 `add-investigator` Skill 增加消息积压、缓存击穿、配置漂移和依赖证书过期等场景。

### 4.5 正式演示视频仍需录制

仓库已经提供 `docs/demo/three-minute-script.md`，在线体验和代码仓库也已公开，但正式三分钟录屏仍需按提交平台要求上传。

下一步：使用正式 GitHub Pages 地址录制 1080p 视频，重点演示反证审查、先拒绝再批准、指标验证和 DSH 插件交付。

## 5. 课程要求对应关系

- [x] 至少一个 DSH 独有或明显不同的特性：Profile Bundle + Cordis 插件组合。
- [x] 至少三个 Harness 能力：实际使用 AGENTS.md、知识、Skill、Goal、Loop 和 Plugin 六项。
- [x] 用户无需阅读文档即可完整体验主要功能。
- [x] 首屏说明用途，输入提供两个示例，拒绝状态有提示，执行和验证状态有反馈。
- [x] 文档说明每项 Harness 能力的路径、问题和使用前后差异。
- [x] 文档包含 DSH 特性、选择原因和与 Claude Code / Codex 的差异。
- [x] 文档包含 Goal 原始交代词和验证环境准备。
- [x] 文档说明不足和下一步。
