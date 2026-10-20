# IncidentOS

IncidentOS 是一个证据优先的多 Agent 事故响应指挥台。产品自带两个确定性事故，无需 API Key 或外部服务即可完成调查、反证、人工审批、恢复验证和复盘导出。

## 体验入口

开发环境运行 `npm run dev` 后访问 `http://127.0.0.1:4173/`。产品本身提供完整引导，用户体验不依赖本文件。

## 验证

```bash
npm install --cache .npm-cache
npm run verify
```

`verify` 依次运行领域测试、Web 生产构建、DSH 插件编译和插件 tarball 内容检查。

## 交付结构

- `src/`：产品界面、确定性引擎与两个事故数据。
- `plugins/incidentos/`：可安装 DSH bundle。
- `knowledge/`：事故政策、事件契约、复盘结构。
- `.agents/skills/add-investigator/`：反复新增调查能力的 Skill。
- `docs/harness/`：Harness 使用证据、Goal 原始交代词和验证记录。
- `docs/demo/`：三分钟演示脚本。
- `tests/`：领域与验收合约。

## DSH 插件

```bash
dsh plugin --profile web add ./plugins/incidentos
```

安装后，插件向当前 profile 组合贡献 `incident-response` Skill 和 `incidentos:guardrails` 系统提示词章节。

## 项目边界

当前版本使用确定性演练数据，不连接真实 Prometheus、日志平台、数据库或生产控制面。这让评审者每次都能复现完整结果，并确保高风险动作只是模拟。
