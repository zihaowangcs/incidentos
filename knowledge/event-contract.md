# IncidentOS event contract v1.0

Domain event names use lower-kebab-case and are append-only for a single investigation run:

1. `incident-created`
2. `investigation-started`
3. `evidence-found`
4. `hypothesis-proposed`
5. `hypothesis-challenged`
6. `action-approval-requested`
7. `action-approved` or `action-rejected`
8. `action-executed`
9. `verification-completed`
10. `postmortem-generated`

Each event contains an ISO timestamp, actor ID, summary, and optional references. UI progress must be derived from these events rather than fake timers.
