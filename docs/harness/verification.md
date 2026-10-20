# Verification record

## Full gate

Command:

```bash
npm run verify
```

Latest result: PASS.

- Vitest: 1 test file, 6 tests passed.
- Web: TypeScript project build passed; Vite transformed 1,581 modules and emitted production assets.
- DSH plugin: TypeScript compilation passed.
- Package dry run: `incidentos-dsh-plugin@0.1.0`, four files, 1.6 kB tarball / 3.2 kB unpacked.

## Covered invariants

- At least two complete incident fixtures.
- Confirmed and rejected hypotheses in every fixture.
- Evidence IDs and source locations resolve.
- Root cause support spans at least three items and two source kinds.
- Change Auditor and Metrics Investigator additions exist in both fixtures.
- Rejection produces no action execution event.
- Verification cannot run before explicit approval.
- Recovery metrics are evaluated by comparator.
- Postmortem cannot export before verification.

## Product service

Development server command: `npm run dev`

Verified local URL: `http://127.0.0.1:4173/`

The managed development-server job remained running after the full gate. The app does not require environment variables, API keys, or external network calls.
