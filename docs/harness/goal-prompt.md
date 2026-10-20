# IncidentOS Goal 原始交代词

本文件保留开发时提交给 DSH Goal 模式的完整原始交代词。实际持久 Goal ID、revision 和 Round 计数由 DSH 会话日志管理，不在仓库中伪造。

## 原始 objective

> 在 /Users/naplescode/Desktop/dshstudy 完整实现 IncidentOS：一个可直接体验的多 Agent 事故调查与处置 Web 产品，包含至少两个确定性事故场景、证据化根因分析、反证审查、人工审批、处置模拟、验证和复盘导出；提供真实可审查的 DSH 插件交付、AGENTS.md、可重复触发的 Skill、知识库、Goal 原始交代词、开发/测试闭环、Harness 能力说明、演示脚本和自动化测试。完成前运行全部验证，并启动可供用户访问的本地开发服务器。

## 展开的 Goal 契约

### 目标

交付一个同学打开即可体验的 IncidentOS 产品，同时交付可安装 DSH 插件、代码、知识和开发证据。

### 资料

- DSH 实现 checkout：`/Applications/DSH Desktop.app/Contents/Resources/app/`
- 仓库规则：`AGENTS.md`
- 事故政策：`knowledge/incident-policy.md`
- 事件契约：`knowledge/event-contract.md`
- 报告结构：`knowledge/report-schema.md`

### 验证

1. 两个事故都能完成选择、调查、查证、反证、审批、处置、验证和导出。
2. 根因引用至少三条、至少两类来源证据。
3. 每个事故包含一个明确被排除的假设。
4. 高风险处置未经人工批准不能执行或验证。
5. `npm run verify` 全部通过。
6. DSH 插件能编译，且 `npm pack --dry-run` 只包含声明的交付文件。
7. 本地体验服务成功响应。

### 授权

允许在工作区中创建和修改源码、安装固定版本依赖、执行构建和测试，并启动本地开发服务器。禁止真实生产操作、外发项目数据和绕过人工审批。

### 停止条件

只有全部验证通过且体验服务可访问时标记 Goal 完成。同一外部条件连续至少三轮阻塞才能标记 blocked；普通错误必须继续修复。

## 验证环境准备

Goal 创建前后立即检查了 Node/npm 版本和空工作区。随后建立固定事故夹具、无网络运行的确定性引擎、Vitest 合约测试、Vite 生产构建和插件 dry-run 打包。由于产品不依赖 API Key 或外部观测系统，后续 Goal Round 可以重复运行全部验证，不会受线上环境漂移影响。
