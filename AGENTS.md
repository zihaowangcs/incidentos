# IncidentOS Repository Rules

## Product contract

IncidentOS is a deterministic incident-response workbench. A new user must be able to open the app, select an included incident, investigate it, review evidence, approve or reject remediation, verify recovery, and export a postmortem without reading documentation or configuring an API key.

## Directory ownership

- `src/domain/`: framework-independent incident types and investigation engine.
- `src/data/`: deterministic incident fixtures. No UI behavior belongs here.
- `src/`: React application and presentation components.
- `plugins/incidentos/`: installable DSH plugin package. It may reference repository knowledge but must not import the web app.
- `knowledge/`: authoritative operational rules and schemas used by the Skill and implementation.
- `.agents/skills/`: repeatable development workflows.
- `tests/`: engine and acceptance tests.
- `docs/harness/`: evidence explaining Harness usage and Goal execution.

## Required commands

- `npm run dev`: start the product locally.
- `npm run build`: type-check and create the production bundle.
- `npm test`: run deterministic unit tests.
- `npm run verify`: run all submission gates.

## Engineering rules

1. Incident conclusions must cite evidence IDs that resolve to visible source records.
2. Every included scenario must contain at least one rejected hypothesis and one skeptic finding.
3. High-risk remediation must remain blocked until explicit user approval.
4. Verification results must be computed from the selected remediation, not from a timer or random value.
5. The app must work without network access or API credentials.
6. Never place secrets, real customer data, or executable production commands in fixtures.
7. Do not add a chat-first landing page. The first screen must expose the actual incident workflow.
8. Keep event and domain identifiers in lower-kebab-case; keep TypeScript source in ASCII.
9. A new investigator or rule is incomplete without fixture coverage, an engine assertion, and a knowledge reference.
10. Do not claim a Harness capability unless its file exists and the evidence document points to it.

## Acceptance standard

A change is acceptable only when `npm run verify` passes and both bundled incidents can complete the path: select -> investigate -> inspect evidence -> review skeptic challenge -> approve/reject action -> verify -> export postmortem. The production build must not require environment variables.
