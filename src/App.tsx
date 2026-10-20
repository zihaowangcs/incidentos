import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, CircleDot, Clock3, Database, Download, FileSearch, GitBranch, ListChecks, LockKeyhole, Play, RotateCcw, Search, Server, ShieldAlert, TerminalSquare, X } from 'lucide-react'
import { incidents } from './data/incidents'
import { agentLabel, buildPostmortem, decideRemediation, startInvestigation, verifyRemediation } from './domain/engine'
import type { Evidence, IncidentScenario, InvestigationState } from './domain/types'

type View = 'board' | 'workspace'
type WorkspaceTab = 'evidence' | 'hypotheses' | 'timeline'

const kindIcon = { metric: Activity, log: TerminalSquare, trace: GitBranch, deployment: Server, database: Database }
const eventLabels: Record<string, string> = {
  'incident-created': '事故创建', 'investigation-started': '调查启动', 'evidence-found': '证据发现',
  'hypothesis-proposed': '提出假设', 'hypothesis-challenged': '反证审查', 'action-approval-requested': '等待审批',
  'action-approved': '处置批准', 'action-rejected': '处置拒绝', 'action-executed': '处置执行',
  'verification-completed': '恢复验证', 'postmortem-generated': '复盘生成',
}

function Header({ activeCount }: { activeCount: number }) {
  return <header className="app-header">
    <div className="brand-mark"><span className="brand-grid"><i/><i/><i/><i/></span></div>
    <div><strong>IncidentOS</strong><span className="brand-sub">事故响应指挥台</span></div>
    <div className="header-spacer" />
    <div className="system-health"><span className="pulse" /> 调查引擎在线</div>
    <div className="header-stat"><b>{activeCount}</b><span>活跃事故</span></div>
    <button className="icon-button" title="系统状态" aria-label="系统状态"><Activity size={18}/></button>
  </header>
}

function IncidentBoard({ onOpen }: { onOpen: (incident: IncidentScenario) => void }) {
  return <main className="board-shell">
    <section className="board-heading">
      <div><p className="eyebrow">COMMAND CENTER / LIVE</p><h1>当前事故</h1><p>选择一场事故，启动多 Agent 证据调查与处置验证。</p></div>
      <div className="shift-block"><span>值班班次</span><strong>APAC · 14:00—22:00</strong><small>Incident Commander 已就绪</small></div>
    </section>
    <section className="overview-grid">
      <div className="overview-stat"><span>开放事故</span><strong>02</strong><small><AlertTriangle size={14}/> 2 个 SEV-1</small></div>
      <div className="overview-stat"><span>受影响服务</span><strong>02</strong><small><Server size={14}/> payment · report</small></div>
      <div className="overview-stat"><span>平均确认时间</span><strong>5m 48s</strong><small><Clock3 size={14}/> 演练目标 &lt; 10m</small></div>
      <div className="overview-stat"><span>调查 Agent</span><strong>07</strong><small><CircleDot size={14}/> 全部可用</small></div>
    </section>
    <section className="incident-list" aria-label="可调查事故">
      {incidents.map((incident, index) => <button key={incident.id} className={`incident-row accent-${incident.accent}`} onClick={() => onOpen(incident)}>
        <div className="severity-block"><span>{incident.severity}</span><small>{incident.detectedAt}</small></div>
        <div className="incident-main">
          <div className="incident-id">{incident.id.toUpperCase()} <span>正在影响</span></div>
          <h2>{incident.title}</h2>
          <p>{incident.statusText}</p>
        </div>
        <div className="incident-service"><span>受影响服务</span><strong><Server size={15}/>{incident.service}</strong></div>
        <div className="incident-action"><span>{index === 0 ? '建议优先处理' : '等待调查'}</span><b>开始调查 <ChevronRight size={18}/></b></div>
      </button>)}
    </section>
    <section className="flow-preview">
      <span><Search size={17}/>并行调查</span><ChevronRight/><span><FileSearch size={17}/>证据闭合</span><ChevronRight/><span><ShieldAlert size={17}/>反证审查</span><ChevronRight/><span><LockKeyhole size={17}/>人工审批</span><ChevronRight/><span><ListChecks size={17}/>恢复验证</span>
    </section>
  </main>
}

function EvidenceCard({ evidence, selected, onSelect }: { evidence: Evidence; selected: boolean; onSelect: () => void }) {
  const Icon = kindIcon[evidence.kind]
  return <button className={`evidence-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
    <span className={`evidence-icon kind-${evidence.kind}`}><Icon size={17}/></span>
    <span className="evidence-copy"><span className="evidence-meta">{evidence.id.toUpperCase()} · {evidence.observedAt}</span><strong>{evidence.title}</strong><small>{evidence.source} · {evidence.location}</small></span>
    <ChevronRight size={16}/>
  </button>
}

function ApprovalPanel({ state, setState }: { state: InvestigationState; setState: (state: InvestigationState) => void }) {
  const action = state.incident.remediation
  if (state.verificationPassed) return <section className="action-panel verified-panel">
    <div className="panel-heading"><span className="success-icon"><CheckCircle2 size={20}/></span><div><small>VERIFICATION COMPLETE</small><h3>服务已恢复</h3></div></div>
    <div className="metric-list">{action.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.after}{metric.unit}</strong><small>{metric.comparator} {metric.threshold}{metric.unit}</small></div>)}</div>
    <button className="primary-action" onClick={() => downloadPostmortem(state)}><Download size={17}/> 导出复盘报告</button>
  </section>

  if (state.decision === 'approved') return <section className="action-panel execution-panel">
    <div className="panel-heading"><span className="run-icon"><Activity size={20}/></span><div><small>ACTION EXECUTED</small><h3>等待恢复验证</h3></div></div>
    <p className="execution-command">{action.command}</p>
    <div className="metric-list before-after">{action.metrics.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{metric.before}{metric.unit} <i>→</i> {metric.after}{metric.unit}</strong><small>目标 {metric.comparator} {metric.threshold}{metric.unit}</small></div>)}</div>
    <button className="primary-action" onClick={() => setState(verifyRemediation(state))}><ListChecks size={17}/> 运行恢复验证</button>
  </section>

  return <section className="action-panel approval-panel">
    <div className="panel-heading"><span className="lock-icon"><LockKeyhole size={19}/></span><div><small>HUMAN APPROVAL REQUIRED</small><h3>{action.title}</h3></div></div>
    <p>{action.expectedEffect}</p>
    <dl><div><dt>风险级别</dt><dd className="risk-high">{action.risk.toUpperCase()}</dd></div><div><dt>影响范围</dt><dd>{action.blastRadius}</dd></div><div><dt>回滚方案</dt><dd>{action.rollback}</dd></div></dl>
    {state.decision === 'rejected' && <div className="rejection-note"><X size={15}/>上次操作已拒绝，没有执行任何变更。可重新审批。</div>}
    <div className="action-buttons"><button className="reject-button" onClick={() => setState(decideRemediation(state, 'rejected'))}><X size={16}/>拒绝</button><button className="approve-button" onClick={() => setState(decideRemediation(state, 'approved'))}><Check size={16}/>批准并执行</button></div>
  </section>
}

function downloadPostmortem(state: InvestigationState) {
  const blob = new Blob([buildPostmortem(state)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${state.incident.id}-postmortem.md`
  anchor.click()
  URL.revokeObjectURL(url)
}

function Workspace({ initialIncident, onBack }: { initialIncident: IncidentScenario; onBack: () => void }) {
  const [state, setState] = useState(() => startInvestigation(initialIncident))
  const [tab, setTab] = useState<WorkspaceTab>('evidence')
  const [selectedEvidence, setSelectedEvidence] = useState(initialIncident.evidence[0].id)
  const incident = state.incident
  const activeEvidence = incident.evidence.find(item => item.id === selectedEvidence) ?? incident.evidence[0]
  const root = incident.hypotheses.find(item => item.status === 'confirmed')!
  const progress = state.verificationPassed ? 100 : state.decision === 'approved' ? 84 : 68
  const switchIncident = (item: IncidentScenario) => { setState(startInvestigation(item)); setSelectedEvidence(item.evidence[0].id); setTab('evidence') }

  return <main className="workspace-shell">
    <div className="incident-strip">
      <button className="back-button" onClick={onBack}><ArrowLeft size={18}/>事故列表</button>
      <div className="strip-severity">{incident.severity}</div><div><small>{incident.id.toUpperCase()}</small><strong>{incident.title}</strong></div>
      <div className="strip-impact">{incident.statusText}</div>
      <select aria-label="切换事故" value={incident.id} onChange={e => switchIncident(incidents.find(i => i.id === e.target.value)!)}>{incidents.map(i => <option key={i.id} value={i.id}>{i.shortTitle}</option>)}</select>
    </div>
    <div className="workspace-grid">
      <aside className="agent-rail">
        <div className="rail-title"><span>调查编队</span><b>7 AGENTS</b></div>
        {(['commander','log-investigator','metrics-investigator','change-auditor','dependency-investigator','skeptic','verification-agent'] as const).map((role, index) => {
          const active = role !== 'verification-agent' || state.decision === 'approved'
          return <div key={role} className={`agent-row ${active ? 'active' : ''}`}><span className="agent-avatar">{index === 0 ? 'IC' : `A${index}`}</span><div><strong>{agentLabel(role)}</strong><small>{role === 'commander' ? '协调与决策' : role === 'skeptic' ? '反证审查完成' : role === 'verification-agent' ? (active ? '验证恢复指标' : '等待处置') : '证据已提交'}</small></div><i/></div>
        })}
        <div className="progress-block"><div><span>调查完成度</span><b>{progress}%</b></div><progress value={progress} max="100"/><small>{state.events.length} 个领域事件 · 可审计</small></div>
      </aside>

      <section className="investigation-main">
        <div className="summary-band"><div><p className="eyebrow">PRIMARY HYPOTHESIS</p><h2>{root.title}</h2><p>{root.explanation}</p></div><div className="confidence"><strong>{root.confidence}%</strong><span>综合置信度</span></div></div>
        <nav className="workspace-tabs">
          <button className={tab === 'evidence' ? 'active' : ''} onClick={() => setTab('evidence')}>证据 <b>{incident.evidence.length}</b></button>
          <button className={tab === 'hypotheses' ? 'active' : ''} onClick={() => setTab('hypotheses')}>假设与反证 <b>{incident.hypotheses.length}</b></button>
          <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>事件流 <b>{state.events.length}</b></button>
        </nav>
        {tab === 'evidence' && <div className="evidence-layout"><div className="evidence-list">{incident.evidence.map(item => <EvidenceCard key={item.id} evidence={item} selected={item.id === activeEvidence.id} onSelect={() => setSelectedEvidence(item.id)}/>)}</div><article className="evidence-detail"><div className="detail-head"><span className={`evidence-icon kind-${activeEvidence.kind}`}>{(() => { const Icon = kindIcon[activeEvidence.kind]; return <Icon size={20}/> })()}</span><div><small>{activeEvidence.id.toUpperCase()} · {activeEvidence.kind.toUpperCase()}</small><h3>{activeEvidence.title}</h3></div></div><p>{activeEvidence.detail}</p><div className="source-box"><span>证据来源</span><strong>{activeEvidence.source}</strong><code>{activeEvidence.location}</code></div><div className="agent-attribution"><CircleDot size={15}/>{agentLabel(activeEvidence.agent)} · {activeEvidence.observedAt}</div><div className="evidence-link"><CheckCircle2 size={16}/>支持主假设：{root.title}</div></article></div>}
        {tab === 'hypotheses' && <div className="hypothesis-stack">{incident.hypotheses.map(item => <article key={item.id} className={`hypothesis ${item.status}`}><div><span>{item.status === 'confirmed' ? <CheckCircle2/> : <X/>}</span><div><small>{item.id.toUpperCase()} · {item.status === 'confirmed' ? 'CONFIRMED' : 'REJECTED'}</small><h3>{item.title}</h3><p>{item.explanation}</p></div></div><strong>{item.confidence}%</strong></article>)}<article className="skeptic-card"><ShieldAlert size={22}/><div><small>SKEPTIC REVIEW</small><h3>最强替代解释已被判别测试排除</h3><p><b>替代解释：</b>{incident.skeptic.alternative}</p><p><b>测试：</b>{incident.skeptic.test}</p><p><b>结果：</b>{incident.skeptic.result}</p></div></article></div>}
        {tab === 'timeline' && <div className="event-stream">{state.events.map((item, index) => <div key={item.id} className="event-item"><span className="event-index">{String(index + 1).padStart(2,'0')}</span><span className="event-line"/><div><small>{new Date(item.at).toLocaleTimeString('zh-CN',{hour12:false})} · {eventLabels[item.type]}</small><strong>{item.summary}</strong><p>{item.actor === 'human' ? 'Incident Commander' : agentLabel(item.actor)}</p></div></div>)}</div>}
      </section>

      <aside className="decision-rail">
        <section className="impact-panel"><p className="eyebrow">INCIDENT IMPACT</p><h3>{incident.service}</h3><p>{incident.impact}</p></section>
        <section className="mini-timeline"><div className="panel-title"><GitBranch size={17}/>故障时间线</div>{incident.timeline.map(item => <div key={item.time}><time>{item.time}</time><i className={item.tone}/><span><strong>{item.label}</strong><small>{item.detail}</small></span></div>)}</section>
        <ApprovalPanel state={state} setState={setState}/>
      </aside>
    </div>
  </main>
}

export default function App() {
  const [view, setView] = useState<View>('board')
  const [selected, setSelected] = useState(incidents[0])
  const activeCount = useMemo(() => incidents.length, [])
  return <><Header activeCount={activeCount}/>{view === 'board' ? <IncidentBoard onOpen={incident => { setSelected(incident); setView('workspace') }}/> : <Workspace initialIncident={selected} onBack={() => setView('board')}/>}</>
}
