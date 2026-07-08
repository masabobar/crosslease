# Execute Work — Implementation Loop Module

**Referenced by:** `execute-work.md` STEP 3
**Companions (load per mode):**

- `execute-work-implementation-continuous.md` — Sub-Agent Prompt Template + orchestrator handling + dispatch failure fallback (Continuous mode, STEP 3-A in `execute-work.md`)
- `execute-work-implementation-paused.md` — In-line workflow (Paused mode, STEP 3-B in `execute-work.md`)
- `execute-work-progress-updates.md` — per-mode progress-file update templates (shared)

---

## Two Modes, Same Gates

Execution proceeds in one of two modes, selected per run:

| Mode                                          | Dispatch                                                                                                           | Context behavior                                                           | Companion                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Continuous** _(recommended for 3+ stories)_ | Each story dispatched into a fresh sub-agent via `Agent` tool with the prompt template in the continuous companion | Auto-context-reset between stories; orchestrator keeps only JSON summaries | [`execute-work-implementation-continuous.md`](execute-work-implementation-continuous.md) |
| **Paused**                                    | Orchestrator executes the workflow in-line per story, asking `[Yes / No / Skip to Epic X]` between                 | Orchestrator's context accumulates within the run; no `/clear` mid-run     | [`execute-work-implementation-paused.md`](execute-work-implementation-paused.md)         |

**Both modes enforce the same quality gates** — only the dispatch wrapper differs. The Paused companion documents the canonical step-by-step workflow (§3.1–§3.10); the Continuous companion wraps the same steps in a sub-agent prompt template and adds orchestrator-side response handling.

---

## Where Each Section Lives

| Topic                                           | File                                        | Section |
| ----------------------------------------------- | ------------------------------------------- | ------- |
| Sub-agent prompt template (Continuous)          | `execute-work-implementation-continuous.md` | §1      |
| Orchestrator handling of sub-agent response     | `execute-work-implementation-continuous.md` | §2      |
| Dispatch failure fallback (Continuous → Paused) | `execute-work-implementation-continuous.md` | §3      |
| Story initialization + TodoWrite breakdown      | `execute-work-implementation-paused.md`     | §3.1    |
| Read context                                    | `execute-work-implementation-paused.md`     | §3.2    |
| Implement tasks                                 | `execute-work-implementation-paused.md`     | §3.3    |
| Write tests                                     | `execute-work-implementation-paused.md`     | §3.4    |
| Verify i18n (conditional)                       | `execute-work-implementation-paused.md`     | §3.5    |
| Run tests                                       | `execute-work-implementation-paused.md`     | §3.6    |
| Git commit                                      | `execute-work-implementation-paused.md`     | §3.7    |
| Update progress tracking + screen-map refresh   | `execute-work-implementation-paused.md`     | §3.8    |
| Story completion display                        | `execute-work-implementation-paused.md`     | §3.9    |
| Pause for user (Paused only)                    | `execute-work-implementation-paused.md`     | §3.10   |

---

## Quality Gate Snapshot

Every story (either mode) must pass these gates before completion:

- All unit tests pass (`pnpm test:run`); type-check clean
- New Zod schemas, store actions, and utilities have tests (per `.claude/rules/testing.md`)
- Linter clean
- All API status codes 200/400/401/403/404/500 tested (if endpoint touched)
- i18n complete (if `I18N-RULES.md` exists)
- API documentation gate clean (if endpoint touched) per `execute-work-quality-gates.md`
- Error handling & logging gate clean (if handler/service touched)
- Security & auth gate clean (if auth surface touched)
- Frontend contract verified (frontend stories) per `.claude/rules/api-first.md` Phase A

Failure of any gate → status `blocked`, never silently degraded.

Full checklist: [`execute-work-quality-gates.md`](execute-work-quality-gates.md).

---

**Version:** 3.3.0
**Last Updated:** 2026-05-11 (split into continuous + paused companions; this file is now the parent overview)
**Related:**

- [`execute-work-implementation-continuous.md`](execute-work-implementation-continuous.md) — Continuous mode workflow
- [`execute-work-implementation-paused.md`](execute-work-implementation-paused.md) — Paused mode workflow
- [`execute-work-quality-gates.md`](execute-work-quality-gates.md) — test/coverage validation + per-domain gates
- [`execute-work-progress-updates.md`](execute-work-progress-updates.md) — per-mode progress-file templates
- [`execute-work-dashboard-events.md`](execute-work-dashboard-events.md) + [`-mechanics.md`](execute-work-dashboard-mechanics.md) — DASHBOARD auto-update
