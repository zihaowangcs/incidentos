# Incident response policy v1.0

This document is the operational source of truth referenced by `AGENTS.md` and the `add-investigator` Skill.

## Severity

- SEV-1: customer-critical flow unavailable or corrupting data.
- SEV-2: material degradation with a workaround.
- SEV-3: limited degradation without immediate customer loss.

## Evidence rules

A confirmed root cause requires at least three evidence items across at least two source kinds. Temporal correlation alone is insufficient. Every hypothesis records supporting and contradicting evidence. An investigator must preserve original timestamps and source locations.

## Remediation policy

Actions have `low`, `medium`, or `high` risk. High-risk actions require explicit human approval and a rollback description. A rejected action must not be executed implicitly. Recovery is verified against scenario-specific thresholds and cannot be inferred from action completion.

## Completion gates

An incident is resolved only when a root cause is evidence-backed, a skeptic has challenged it, one alternative is explicitly rejected, an approved action has been simulated, recovery thresholds pass, and a postmortem is generated.
