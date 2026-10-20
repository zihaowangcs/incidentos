# Postmortem schema v1.0

A generated postmortem contains:

- Incident identity, severity, start time, impact and status.
- Evidence-backed root cause with confidence.
- Supporting and contradicting evidence references.
- Rejected alternative hypotheses.
- Skeptic review.
- Approved remediation, risk, expected effect and rollback.
- Verification metrics before and after remediation.
- Timeline of domain events.
- Follow-up actions with owner roles.

Markdown is the portable export format. It must include evidence source locations so a reviewer can reproduce the conclusion.
