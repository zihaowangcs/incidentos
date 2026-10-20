# add-investigator Skill invocation log

The same repository Skill was followed twice during initial development. The records demonstrate repetition rather than merely documenting a planned workflow.

## Invocation 1 — Change Auditor

- Date: 2025-11-21
- Trigger: add an investigator that tests whether a recent deployment matches the affected cohort.
- Knowledge consulted: `knowledge/incident-policy.md`, especially the requirement that temporal correlation alone is insufficient; `knowledge/event-contract.md` for `evidence-found` attribution.
- Artifacts: added `change-auditor` to `AgentRole`; added `pay-e5` and `db-e3` deployment evidence with stable source locations and control-cohort detail.
- Verification: evidence IDs resolve through each scenario; both records support a hypothesis but require independent metric/log/database evidence before confirmation.

## Invocation 2 — Metrics Investigator

- Date: 2025-11-21
- Trigger: add an investigator that quantifies invariant breaches and affected/control cohorts.
- Knowledge consulted: `knowledge/incident-policy.md` evidence and completion gates; `knowledge/event-contract.md` append-only event order.
- Artifacts: added `metrics-investigator` to `AgentRole`; added `pay-e1` retry amplification and `db-e1` version-segmented pool saturation.
- Verification: deterministic engine attributes both evidence records to Metrics Investigator; remediation verification uses explicit metric comparators rather than action completion.

Final command output will be recorded in `docs/harness/verification.md` after the full gate runs.
