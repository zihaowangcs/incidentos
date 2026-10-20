import type { AgentRole, DomainEvent, IncidentScenario, InvestigationState, MetricSnapshot } from './types'

const baseTime = (incident: IncidentScenario) => new Date(incident.startedAt.replace(' ', 'T') + 'Z')

const event = (incident: IncidentScenario, index: number, type: DomainEvent['type'], actor: DomainEvent['actor'], summary: string, references?: string[]): DomainEvent => ({
  id: `${incident.id}-event-${index}`,
  type,
  actor,
  summary,
  references,
  at: new Date(baseTime(incident).getTime() + index * 47_000).toISOString(),
})

export const startInvestigation = (incident: IncidentScenario): InvestigationState => ({
  incident,
  status: 'investigating',
  revealedEvidence: incident.evidence.map((item) => item.id),
  decision: undefined,
  verificationPassed: false,
  events: [
    event(incident, 0, 'incident-created', 'commander', `${incident.severity} 事故已创建`),
    event(incident, 1, 'investigation-started', 'commander', '并行调度日志、指标、依赖与变更调查员'),
    ...incident.evidence.map((item, i) => event(incident, i + 2, 'evidence-found', item.agent, item.title, [item.id])),
    event(incident, 8, 'hypothesis-proposed', 'commander', incident.hypotheses[0].title, incident.hypotheses[0].evidenceIds),
    event(incident, 9, 'hypothesis-challenged', 'skeptic', incident.skeptic.verdict, incident.skeptic.evidenceIds),
    event(incident, 10, 'action-approval-requested', 'commander', incident.remediation.title, [incident.remediation.id]),
  ],
})

export const decideRemediation = (state: InvestigationState, decision: 'approved' | 'rejected'): InvestigationState => {
  const index = state.events.length
  if (decision === 'rejected') {
    return {
      ...state,
      status: 'awaiting-approval',
      decision,
      events: [...state.events, event(state.incident, index, 'action-rejected', 'human', '处置动作已拒绝；系统未执行任何变更')],
    }
  }

  return {
    ...state,
    status: 'remediating',
    decision,
    events: [
      ...state.events,
      event(state.incident, index, 'action-approved', 'human', '事故指挥官批准高风险处置'),
      event(state.incident, index + 1, 'action-executed', 'commander', state.incident.remediation.command, [state.incident.remediation.id]),
    ],
  }
}

export const metricPasses = (metric: MetricSnapshot): boolean => {
  if (metric.comparator === '<') return metric.after < metric.threshold
  if (metric.comparator === '<=') return metric.after <= metric.threshold
  if (metric.comparator === '>') return metric.after > metric.threshold
  if (metric.comparator === '>=') return metric.after >= metric.threshold
  return metric.after === metric.threshold
}

export const verifyRemediation = (state: InvestigationState): InvestigationState => {
  if (state.decision !== 'approved') throw new Error('Remediation requires explicit approval before verification')
  const passed = state.incident.remediation.metrics.every(metricPasses)
  return {
    ...state,
    status: passed ? 'verified' : 'awaiting-approval',
    verificationPassed: passed,
    events: [...state.events, event(state.incident, state.events.length, 'verification-completed', 'verification-agent', passed ? '所有恢复阈值连续窗口通过' : '恢复阈值未通过，建议回滚')],
  }
}

export const agentLabel = (role: AgentRole) => ({
  commander: 'Incident Commander',
  'log-investigator': 'Log Investigator',
  'metrics-investigator': 'Metrics Investigator',
  'change-auditor': 'Change Auditor',
  'dependency-investigator': 'Dependency Investigator',
  skeptic: 'Skeptic',
  'verification-agent': 'Verification Agent',
}[role])

export const buildPostmortem = (state: InvestigationState): string => {
  if (!state.verificationPassed) throw new Error('Postmortem export requires successful verification')
  const incident = state.incident
  const root = incident.hypotheses.find((item) => item.status === 'confirmed')!
  const rejected = incident.hypotheses.filter((item) => item.status === 'rejected')
  return `# ${incident.id} · ${incident.title}\n\n## 摘要\n\n- 级别：${incident.severity}\n- 服务：${incident.service}\n- 影响：${incident.impact}\n- 状态：已验证恢复\n\n## 根因\n\n${root.title}（置信度 ${root.confidence}%）\n\n${root.explanation}\n\n## 证据\n\n${incident.evidence.map((item) => `- **${item.id} ${item.title}** — ${item.detail}（${item.source}，${item.location}）`).join('\n')}\n\n## 反证审查\n\n- 最强替代解释：${incident.skeptic.alternative}\n- 判别测试：${incident.skeptic.test}\n- 结果：${incident.skeptic.result}\n- 结论：${incident.skeptic.verdict}\n\n## 已排除假设\n\n${rejected.map((item) => `- ${item.title}：${item.explanation}`).join('\n')}\n\n## 处置与回滚\n\n- 动作：${incident.remediation.title}\n- 配置：${incident.remediation.command}\n- 影响范围：${incident.remediation.blastRadius}\n- 回滚：${incident.remediation.rollback}\n\n## 恢复验证\n\n${incident.remediation.metrics.map((item) => `- ${item.label}：${item.before}${item.unit} → ${item.after}${item.unit}（门槛 ${item.comparator} ${item.threshold}${item.unit}）`).join('\n')}\n\n## 后续行动\n\n${incident.followUps.map((item) => `- [ ] ${item.action} · ${item.owner} · ${item.due}`).join('\n')}\n`
}
