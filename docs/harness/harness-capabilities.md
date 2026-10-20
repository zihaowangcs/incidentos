# IncidentOS Harness 能力与 DSH 特性说明

## 1. 能力、路径和解决的问题

| Harness 能力 | 文件路径 | 具体问题 | 使用前 | 使用后 |
|---|---|---|---|---|
| AGENTS.md | `AGENTS.md` | 多轮开发容易把演示动画当真实状态、让证据与结论脱节 | 每轮只能依赖聊天中的临时约定 | 目录、命令、禁止事项和十条工程约束成为仓库级验收契约 |
| 知识 | `knowledge/incident-policy.md`、`knowledge/event-contract.md`、`knowledge/report-schema.md` | 事故规则容易散落在 UI、夹具和提示词中 | “恢复”“有效证据”“可导出报告”没有统一定义 | Skill、测试、领域引擎与插件均引用同一套政策和事件词汇 |
| Skill | `.agents/skills/add-investigator/SKILL.md` | 每加一个调查员都可能漏掉夹具、测试或来源位置 | 需要人工记忆多个同步修改点 | 固定为知识检查、类型、两个夹具、测试、调用记录和验证命令；已应用两次，见 `docs/harness/skill-invocations.md` |
| Goal 模式 | `docs/harness/goal-prompt.md`，持久状态位于 DSH 会话日志 | 产品、插件、测试和文档跨多轮完成，单轮容易提前停止 | 长目标靠人工重复交代，重启后续行意图容易丢失 | 一个持久目标跨 Goal Round 保留 objective、revision、轮数和 phase；只有整体验证通过才完成 |
| Loop | `package.json` 的 `verify`、`tests/engine.test.ts` | 修改夹具或引擎后容易破坏审批和证据不变量 | 手动点 UI 无法覆盖拒绝、提前导出等失败路径 | `test → build → plugin build → package dry-run` 构成可重复开发—测试—修复闭环 |
| Plugin | `plugins/incidentos/package.json`、`cordis.patch.yml`、`src/index.ts` | 知识和行为约束只留在仓库，无法交给其他 dsh 用户组合使用 | 同学只能阅读文档或复制提示词 | 可安装 bundle 同时贡献运行时 Skill 和系统提示词约束，安装/卸载跟随插件生命周期 |

## 2. 使用的 dsh 差异化特性

### 特性：一切皆插件的 Profile 组合

IncidentOS 不是只给模型一段提示词。`plugins/incidentos/package.json` 声明 `dsh.bundle.patch`，`cordis.patch.yml` 把 `incidentos-agent` 作为 Cordis 插件行插入 profile。插件 `apply(ctx)` 在同一个生命周期中向两个注册表贡献能力：

1. `ctx.skills.register(...)` 注册可由模型和用户调用的 `incident-response` Skill。
2. `ctx.systemPrompt.section(...)` 注册证据引用、反证、人工审批和指标验证 guardrails。

插件卸载时，Cordis effect disposer 会同时移除这些贡献，不留下另一个配置真源。bundle dry-run 证明交付物是独立四文件 npm 包。

### 为什么选择它

事故响应不是单个工具调用：它同时需要专项流程、模型行为约束和可分发生命周期。把这些贡献封装为一个 profile bundle，用户安装一次即可获得一致能力，也能由 dsh 的 profile 组合决定在哪个 Agent 上启用。

### 与 Claude Code / Codex 的差别

Claude Code/Codex 通常通过仓库指令、Skill 或 MCP 给已有 Agent 增加说明和工具；这些能力往往分属不同配置入口。dsh 的核心组合单位是插件行：插件可以向服务、事件、模型工具、Skill、系统提示词和浏览器 Slot 注册表贡献内容，并由 Cordis 统一管理作用域与生命周期。IncidentOS 实际使用了其中的 Skill 与 system-prompt 两个注册表，以及 profile bundle 安装机制。

这里的差别不是“其他 Agent 完全做不到事故分析”，而是 **dsh 把 Agent 自身能力的组合和生命周期原生做成插件运行时**。因此同一个 IncidentOS 包不是文档附件，而是可以被 profile 安装、组合和卸载的能力单元。

## 3. Goal 模式

原始交代词、目标、资料、验证、授权和停止条件完整保存在 `docs/harness/goal-prompt.md`。本次开发创建了最多 20 Round 的持久 Goal。

验证环境提前做了以下准备：

- 固定两个事故夹具，避免外部日志平台不可用；
- 所有恢复指标采用确定性 before/after 数据和显式比较器；
- 产品不需要 API Key；
- Vitest 覆盖证据引用、被拒绝假设、审批门禁、验证与导出；
- Vite 生产构建验证浏览器交付；
- 插件 TypeScript 构建和 `npm pack --dry-run` 验证 bundle。

这使每个 Goal Round 都能独立读取仓库状态并运行验证，而不是等待未准备好的真实生产环境。

## 4. 一个问题一个解法

- **Agent 容易无证据下结论** → 证据 ID、来源位置、跨来源测试断言。
- **多个 Agent 容易集体赞同** → 独立 Skeptic、最强替代解释和判别测试。
- **自动化容易越权处置** → 高风险动作由领域引擎强制人工审批，拒绝后不生成执行事件。
- **按钮点完被误判为恢复** → `metricPasses` 对每个声明阈值计算，全部通过后才能导出。
- **新增调查能力容易漏改** → `add-investigator` Skill，并记录两次应用。
- **项目知识无法分发** → DSH profile bundle 同时注册 Skill 与 guardrails。
- **长任务容易半途交付** → 持久 Goal 与完整 `verify` 停止条件。

## 5. 没做好的地方和下一步

1. 当前“多 Agent”是确定性角色编队和事件归因，保证演示可复现；下一步接入 dsh subagent 运行时，让调查员并行执行真实分析，同时保留同一证据契约。
2. 当前动作全部在模拟器中执行；下一步开发只读 Prometheus/Loki 连接器，并继续把写操作置于审批和沙箱边界后。
3. 当前插件贡献 Skill 和 prompt，还未贡献 IncidentOS 浏览器 Slot；下一步把证据面板封装为 client plugin，使安装 bundle 后直接出现在 dsh Web 中。
4. 当前只有 Java 服务相关的两种事故；下一步通过 `add-investigator` Skill 增加消息积压、缓存击穿和配置漂移场景。
5. 当前仓库没有内部 Git 远端地址和正式录屏，这两项需要提交方在组织环境中完成；仓库已提供三分钟演示脚本。

## 6. 验收清单

- [x] 使用至少一个 dsh 独有或明显不同的特性：Profile + Cordis 插件组合。
- [x] 使用至少三个 Harness 能力：实际使用六项。
- [x] 用户不读文档即可从首屏完整体验两个事故。
- [x] 首屏有用途和示例，等待有真实事件反馈，拒绝和错误状态有提示。
- [x] 知识库说明 dsh 特性和 Harness 能力。
- [x] Goal 原始交代词和验证环境已保存。
- [x] 自动化测试、构建和插件打包纳入统一验证。
