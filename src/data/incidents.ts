import type { IncidentScenario } from '../domain/types'

export const incidents: IncidentScenario[] = [
  {
    id: 'inc-2025-041', title: '支付服务延迟突增', shortTitle: '支付延迟突增', severity: 'SEV-1', service: 'payment-api',
    startedAt: '2025-11-21 14:03:12', detectedAt: '14:04', statusText: '错误率 18.4% · P95 8.2s · 影响 12,840 笔订单',
    impact: '支付成功率从 99.2% 降至 81.6%，客户端重试将处理器超时放大为网关流量风暴。',
    summary: '处理器短暂超时后，客户端未遵守指数退避；同一幂等键以 120ms 间隔重试，使请求量放大 3.8 倍。', accent: 'red',
    evidence: [
      { id: 'pay-e1', kind: 'metric', source: 'Gateway Metrics', location: 'metrics/retry-ratio:14:03-14:09', observedAt: '14:05:03', title: '重试比率骤升至 3.8', detail: 'retry_attempts / initial_attempts 从 0.08 升至 3.80，与处理器超时拐点相差 18 秒。', supports: ['pay-h1'], contradicts: [], agent: 'metrics-investigator' },
      { id: 'pay-e2', kind: 'trace', source: 'Trace Store', location: 'traces/idempotency-key:pay_8f31', observedAt: '14:06:17', title: '重试间隔违反退避策略', detail: '同一幂等键请求间隔 P50=120ms，配置规定最小退避 2s；共捕获 17 次连续请求。', supports: ['pay-h1'], contradicts: [], agent: 'dependency-investigator' },
      { id: 'pay-e3', kind: 'log', source: 'payment-api', location: 'payment-api.log:1842-1861', observedAt: '14:06:42', title: '重试预算未在服务端生效', detail: 'RetryBudgetGuard disabled for client-version 7.14.2，随后出现相同 request fingerprint。', supports: ['pay-h1'], contradicts: [], agent: 'log-investigator' },
      { id: 'pay-e4', kind: 'database', source: 'Processor Ledger', location: 'ledger/join:14:00-14:10', observedAt: '14:08:10', title: '无处理器独立重复结算', detail: '所有疑似重复条目均能关联到重复网关请求；无一条只存在于处理器账本。', supports: [], contradicts: ['pay-h2'], agent: 'skeptic' },
      { id: 'pay-e5', kind: 'deployment', source: 'Release Audit', location: 'deploy/client-7.14.2', observedAt: '14:08:38', title: '客户端灰度与故障范围重合', detail: '7.14.2 灰度从 10% 扩至 80% 后五分钟开始放大；旧版本对照组重试比率保持 0.09。', supports: ['pay-h1'], contradicts: [], agent: 'change-auditor' },
    ],
    hypotheses: [
      { id: 'pay-h1', title: '客户端重试未遵守指数退避', explanation: '处理器超时触发客户端紧密循环，服务端未启用每幂等键重试预算。', confidence: 96, status: 'confirmed', evidenceIds: ['pay-e1','pay-e2','pay-e3','pay-e5'] },
      { id: 'pay-h2', title: '支付处理器独立重复结算', explanation: '若成立，应存在没有重复网关请求的重复账本条目。', confidence: 4, status: 'rejected', evidenceIds: ['pay-e4'] },
    ],
    skeptic: { alternative: '支付处理器自身重复结算', test: '把所有重复账本条目与网关 request ID、幂等键做全量关联。', result: '100% 疑似条目均存在上游重复请求，处理器独立重复数为 0。', verdict: '主因成立；最强替代假设被反证。', evidenceIds: ['pay-e2','pay-e4'] },
    remediation: { id: 'pay-r1', title: '启用服务端幂等键重试预算', command: 'retry_budget_v2 = ON · max 2 attempts / 10 min', expectedEffect: '阻断流量放大，同时保留首次支付请求和幂等结果缓存。', risk: 'high', blastRadius: '全球 payment-api 重试路径；不影响首次请求。', rollback: '关闭 retry_budget_v2 并恢复客户端策略优先级。', metrics: [
      { label: '重试比率', unit: '×', before: 3.8, after: 0.14, threshold: 0.2, comparator: '<=' },
      { label: '支付成功率', unit: '%', before: 81.6, after: 98.7, threshold: 98, comparator: '>=' },
      { label: '重复扣款', unit: '笔', before: 23, after: 0, threshold: 0, comparator: '==' },
    ] },
    timeline: [
      { time: '14:03', label: '处理器超时上升', detail: 'timeout rate 0.4% → 7.1%', tone: 'warning' },
      { time: '14:04', label: 'SLO 告警触发', detail: '支付成功率跌破 95%', tone: 'critical' },
      { time: '14:05', label: '重试流量放大', detail: 'initial traffic × 3.8', tone: 'critical' },
      { time: '14:09', label: '根因证据闭合', detail: '四源证据 + 反证审查', tone: 'neutral' },
    ],
    followUps: [
      { action: '修复 7.14.2 退避策略并补充混沌测试', owner: '客户端负责人', due: '2 个工作日' },
      { action: '所有支付入口默认启用服务端重试预算', owner: '支付平台', due: '1 周' },
      { action: '新增 retry amplification SLO', owner: 'SRE', due: '3 个工作日' },
    ],
  },
  {
    id: 'inc-2025-042', title: '报表发布导致连接池耗尽', shortTitle: '数据库连接池耗尽', severity: 'SEV-1', service: 'report-service',
    startedAt: '2025-11-21 15:17:06', detectedAt: '15:18', statusText: '连接池 40/40 · 等待 P95 1.8s · 核心请求超时 11.2%',
    impact: 'v42 报表导出查询长事务占满应用连接池，连带核心订单查询发生 acquire timeout。',
    summary: 'v42 新报表查询在导出期间保持事务，92% 超过 30 秒的事务来自 /reports/export；旧版本和控制客户端正常。', accent: 'amber',
    evidence: [
      { id: 'db-e1', kind: 'metric', source: 'Pool Metrics', location: 'metrics/hikari:v42', observedAt: '15:19:04', title: '仅 v42 池达到 40/40', detail: 'v42 in-use 40/40、wait P95 1800ms；v41 对照组 18/40、wait P95 20ms。', supports: ['db-h1'], contradicts: [], agent: 'metrics-investigator' },
      { id: 'db-e2', kind: 'database', source: 'pg_stat_activity', location: 'db/activity:tx>30s', observedAt: '15:20:31', title: '长事务集中于报表导出', detail: '92% 开放超过 30s 的事务来自 /reports/export v42，事务年龄 P95=74s。', supports: ['db-h1'], contradicts: [], agent: 'dependency-investigator' },
      { id: 'db-e3', kind: 'deployment', source: 'Release Audit', location: 'deploy/report-v42', observedAt: '15:21:12', title: 'v42 发布引入导出查询', detail: '14:55 发布 v42，包含 export-streaming-query；故障流量仅命中新版本。', supports: ['db-h1'], contradicts: [], agent: 'change-auditor' },
      { id: 'db-e4', kind: 'database', source: 'DB Config Audit', location: 'db/config:max_connections', observedAt: '15:22:09', title: '数据库连接上限未改变', detail: 'max_connections 保持 500，无审计变更；控制客户端连接和延迟均健康。', supports: [], contradicts: ['db-h2'], agent: 'skeptic' },
      { id: 'db-e5', kind: 'log', source: 'report-service', location: 'report.log:920-974', observedAt: '15:22:45', title: '导出响应期间事务保持开放', detail: 'transaction close 发生在 68MB 响应流结束之后，而非查询结果读取完成时。', supports: ['db-h1'], contradicts: [], agent: 'log-investigator' },
    ],
    hypotheses: [
      { id: 'db-h1', title: 'v42 报表查询长事务耗尽应用池', explanation: '流式响应将事务生命周期延长到文件传输结束。', confidence: 97, status: 'confirmed', evidenceIds: ['db-e1','db-e2','db-e3','db-e5'] },
      { id: 'db-h2', title: '数据库 max_connections 被调低', explanation: '若成立，所有客户端应同时出现饱和且存在配置审计记录。', confidence: 3, status: 'rejected', evidenceIds: ['db-e4'] },
    ],
    skeptic: { alternative: '数据库全局连接上限被降低', test: '比较配置审计、应用池和控制客户端的同期饱和度。', result: '没有配置变更；资源耗尽严格隔离在 report-service v42。', verdict: '主因成立；数据库全局故障被排除。', evidenceIds: ['db-e1','db-e4'] },
    remediation: { id: 'db-r1', title: '关闭 v42 报表导出并排空请求', command: 'feature.report_export_v42 = OFF · drain active exports', expectedEffect: '释放长事务和连接；核心读流量不受影响。', risk: 'high', blastRadius: '报表导出临时不可用；核心订单和查询保持服务。', rollback: '固定查询版本发布后重新开启开关；排空操作无需回滚。', metrics: [
      { label: '连接等待 P95', unit: 'ms', before: 1800, after: 42, threshold: 100, comparator: '<' },
      { label: 'Acquire 超时率', unit: '%', before: 11.2, after: 0.2, threshold: 0.5, comparator: '<' },
      { label: '连接池占用', unit: '%', before: 100, after: 55, threshold: 70, comparator: '<' },
    ] },
    timeline: [
      { time: '14:55', label: 'report-service v42 发布', detail: '新增流式导出查询', tone: 'neutral' },
      { time: '15:17', label: '连接池达到上限', detail: 'active 40 / max 40', tone: 'critical' },
      { time: '15:18', label: '核心请求超时告警', detail: 'acquire timeout 11.2%', tone: 'critical' },
      { time: '15:23', label: '根因证据闭合', detail: '版本对照 + DB 活动反证', tone: 'success' },
    ],
    followUps: [
      { action: '将事务边界移到流式响应之前', owner: '报表服务', due: '1 个工作日' },
      { action: '加入长事务和池隔离集成测试', owner: '质量平台', due: '3 个工作日' },
      { action: '按端点建立连接占用预算', owner: '数据库平台', due: '1 周' },
    ],
  },
]

export const getIncident = (id: string) => incidents.find((item) => item.id === id) ?? incidents[0]
