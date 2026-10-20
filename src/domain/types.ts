export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3'
export type SourceKind = 'metric' | 'log' | 'trace' | 'deployment' | 'database'
export type AgentRole = 'commander' | 'log-investigator' | 'metrics-investigator' | 'change-auditor' | 'dependency-investigator' | 'skeptic' | 'verification-agent'
export type InvestigationStatus = 'ready' | 'investigating' | 'awaiting-approval' | 'remediating' | 'verified'

export interface Evidence {
  id: string
  kind: SourceKind
  source: string
  location: string
  observedAt: string
  title: string
  detail: string
  supports: string[]
  contradicts: string[]
  agent: AgentRole
}

export interface Hypothesis {
  id: string
  title: string
  explanation: string
  confidence: number
  status: 'confirmed' | 'rejected'
  evidenceIds: string[]
}

export interface SkepticFinding {
  alternative: string
  test: string
  result: string
  verdict: string
  evidenceIds: string[]
}

export interface MetricSnapshot {
  label: string
  unit: string
  before: number
  after: number
  threshold: number
  comparator: '<' | '<=' | '>' | '>=' | '=='
}

export interface Remediation {
  id: string
  title: string
  command: string
  expectedEffect: string
  risk: 'low' | 'medium' | 'high'
  blastRadius: string
  rollback: string
  metrics: MetricSnapshot[]
}

export interface TimelineItem {
  time: string
  label: string
  detail: string
  tone: 'neutral' | 'warning' | 'critical' | 'success'
}

export interface FollowUp {
  action: string
  owner: string
  due: string
}

export interface IncidentScenario {
  id: string
  title: string
  shortTitle: string
  severity: Severity
  service: string
  startedAt: string
  detectedAt: string
  statusText: string
  impact: string
  summary: string
  accent: 'red' | 'amber'
  evidence: Evidence[]
  hypotheses: Hypothesis[]
  skeptic: SkepticFinding
  remediation: Remediation
  timeline: TimelineItem[]
  followUps: FollowUp[]
}

export interface DomainEvent {
  id: string
  type: 'incident-created' | 'investigation-started' | 'evidence-found' | 'hypothesis-proposed' | 'hypothesis-challenged' | 'action-approval-requested' | 'action-approved' | 'action-rejected' | 'action-executed' | 'verification-completed' | 'postmortem-generated'
  at: string
  actor: AgentRole | 'human'
  summary: string
  references?: string[]
}

export interface InvestigationState {
  incident: IncidentScenario
  status: InvestigationStatus
  revealedEvidence: string[]
  events: DomainEvent[]
  decision?: 'approved' | 'rejected'
  verificationPassed: boolean
}
