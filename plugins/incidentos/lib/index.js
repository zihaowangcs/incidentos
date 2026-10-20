export const name = 'incidentos-agent';
export const inject = ['skills', 'systemPrompt'];
const skillContent = `# IncidentOS incident response

Use this workflow for incident investigation, remediation, verification, and postmortems.

1. Establish scope and preserve the fixed investigation window.
2. Dispatch log, metric, dependency, and change investigators in parallel.
3. Every conclusion must cite visible evidence IDs and source locations.
4. Rank falsifiable hypotheses. Preserve supporting and contradicting evidence.
5. Ask a skeptic to test the strongest alternative explanation.
6. Propose one bounded and reversible remediation. High-risk actions require explicit human approval.
7. Verify recovery against declared metric thresholds. Action completion is not recovery.
8. Export a postmortem only after verification passes.

Never fabricate telemetry, execute production commands, or silently bypass approval.`;
export function apply(ctx) {
    ctx.effect(() => ctx.skills.register({
        name: 'incident-response',
        description: 'Investigate incidents with evidence-linked hypotheses, skeptic review, approval-gated remediation, and metric verification.',
        content: skillContent,
        invocation: { modelInvocable: true, userInvocable: true },
    }), 'incidentos.skill()');
    ctx.effect(() => ctx.systemPrompt.section({
        name: 'incidentos:guardrails',
        order: 500,
        text: 'For IncidentOS work, cite visible evidence IDs and source locations. Keep contradicting evidence. Never execute high-risk remediation before explicit user approval, and never declare recovery before metric verification passes.',
    }), 'incidentos.guardrails()');
}
