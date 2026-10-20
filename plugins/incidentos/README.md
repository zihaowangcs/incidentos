# incidentos-dsh-plugin

Install this repository package into a DSH profile:

```bash
dsh plugin --profile web add ./plugins/incidentos
```

The bundle patch mounts one Cordis plugin. The plugin contributes:

- `incident-response`: a model- and user-invocable runtime Skill.
- `incidentos:guardrails`: a system-prompt section enforcing evidence citation, skeptic review, approval gating, and metric verification.

This package deliberately owns Agent capability, not the standalone demo UI. The UI in the repository consumes the same investigation rules in a deterministic simulation.
