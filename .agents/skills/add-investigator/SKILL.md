---
name: add-investigator
description: Add or materially extend an IncidentOS investigator, evidence source, or diagnosis rule. Use for every new investigator type or scenario rule so knowledge, fixture coverage, tests, and evidence stay synchronized.
---

# Add an IncidentOS investigator

## Required references

Read `AGENTS.md`, `knowledge/incident-policy.md`, and `knowledge/event-contract.md` before editing. These are authoritative.

## Workflow

1. State the investigator's single responsibility and the source kind it owns.
2. Add or update the `AgentRole` and evidence attribution in `src/domain/types.ts`.
3. Add at least one evidence record to each applicable fixture in `src/data/incidents.ts`. Every record needs a stable ID, source location, timestamp, supporting or contradicting hypothesis, and investigator attribution.
4. Ensure one scenario uses the investigator for support and, where meaningful, one uses it for contradiction or cohort comparison.
5. Add engine or acceptance assertions proving evidence IDs resolve and conclusions have multi-source support.
6. Run `npm test`, then `npm run build`.
7. Append a record to `docs/harness/skill-invocations.md` containing date, trigger, knowledge consulted, changed artifacts, and verification output.

## Stop conditions

Do not finish if evidence has no source location, a conclusion has fewer than three evidence items across two source kinds, a high-risk action bypasses human approval, tests fail, or the invocation record is absent.
