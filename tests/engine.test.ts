import { describe, expect, it } from 'vitest'
import { incidents } from '../src/data/incidents'
import { buildPostmortem, decideRemediation, metricPasses, startInvestigation, verifyRemediation } from '../src/domain/engine'

describe('IncidentOS investigation contract', () => {
  it('ships at least two complete incidents', () => {
    expect(incidents.length).toBeGreaterThanOrEqual(2)
    for (const incident of incidents) {
      expect(incident.evidence.length).toBeGreaterThanOrEqual(3)
      expect(incident.hypotheses.some((item) => item.status === 'confirmed')).toBe(true)
      expect(incident.hypotheses.some((item) => item.status === 'rejected')).toBe(true)
      expect(incident.skeptic.evidenceIds.length).toBeGreaterThan(0)
      expect(incident.remediation.risk).toBe('high')
    }
  })

  it('resolves all evidence links and requires multi-source root cause support', () => {
    for (const incident of incidents) {
      const evidenceIds = new Set(incident.evidence.map((item) => item.id))
      expect(evidenceIds.size).toBe(incident.evidence.length)
      for (const evidence of incident.evidence) {
        expect(evidence.location.length).toBeGreaterThan(4)
        expect(evidence.source.length).toBeGreaterThan(2)
        for (const hypothesisId of [...evidence.supports, ...evidence.contradicts]) {
          expect(incident.hypotheses.some((item) => item.id === hypothesisId)).toBe(true)
        }
      }
      const root = incident.hypotheses.find((item) => item.status === 'confirmed')!
      expect(root.evidenceIds.length).toBeGreaterThanOrEqual(3)
      expect(new Set(root.evidenceIds.map((id) => incident.evidence.find((item) => item.id === id)!.kind)).size).toBeGreaterThanOrEqual(2)
      for (const id of [...root.evidenceIds, ...incident.skeptic.evidenceIds]) expect(evidenceIds.has(id)).toBe(true)
    }
  })

  it('attributes change and metrics investigator evidence in both fixtures', () => {
    for (const incident of incidents) {
      expect(incident.evidence.some((item) => item.agent === 'change-auditor')).toBe(true)
      expect(incident.evidence.some((item) => item.agent === 'metrics-investigator')).toBe(true)
    }
  })

  it('blocks verification until a human explicitly approves remediation', () => {
    const state = startInvestigation(incidents[0])
    expect(() => verifyRemediation(state)).toThrow(/explicit approval/)
    const rejected = decideRemediation(state, 'rejected')
    expect(rejected.status).toBe('awaiting-approval')
    expect(rejected.events.some((item) => item.type === 'action-executed')).toBe(false)
    expect(() => verifyRemediation(rejected)).toThrow(/explicit approval/)
  })

  it('executes and verifies deterministic remediation metrics after approval', () => {
    for (const incident of incidents) {
      const approved = decideRemediation(startInvestigation(incident), 'approved')
      expect(approved.events.some((item) => item.type === 'action-executed')).toBe(true)
      expect(incident.remediation.metrics.every(metricPasses)).toBe(true)
      const verified = verifyRemediation(approved)
      expect(verified.status).toBe('verified')
      expect(verified.verificationPassed).toBe(true)
      expect(buildPostmortem(verified)).toContain(incident.id)
      expect(buildPostmortem(verified)).toContain('反证审查')
      for (const evidence of incident.evidence) expect(buildPostmortem(verified)).toContain(evidence.location)
    }
  })

  it('refuses premature postmortem export', () => {
    expect(() => buildPostmortem(startInvestigation(incidents[1]))).toThrow(/successful verification/)
  })
})
