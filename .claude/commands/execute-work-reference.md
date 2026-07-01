# Execute Work — Reference

Companion to `execute-work.md`. Holds the long-tail material (modes, templates, error handling, examples) that doesn't need to be in the orchestrator.

---

## Execution Modes

### 1. Execution Mode (Continuous vs Paused)

| Mode                                        | Dispatch                                                                                                                                                                                                 | Context behavior                                                                                                                                                                                                                                                         | Use when                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Continuous** (recommended for 3+ stories) | Each story dispatched into a fresh sub-agent via the `Agent` tool with the prompt template in `modules/execute-work-implementation-continuous.md` §1. Orchestrator keeps only structured JSON summaries. | **Auto-context-reset between stories.** Sub-agents have clean contexts; orchestrator never accumulates story-by-story work.                                                                                                                                              | Well-understood phases/epics. Long runs. Anytime context drift between stories is a concern.                  |
| **Paused**                                  | Orchestrator executes the workflow in `modules/execute-work-implementation-paused.md` in-line. Asks `[Yes / No / Skip to Epic X]` after each story.                                                      | Orchestrator's context accumulates across stories within the run. To reset between stories, choose `[No]` at the pause and start a fresh `/execute-work` invocation — do **not** run `/clear` mid-run, as that wipes the approved plan and abandons the in-progress run. | Short runs (1–2 stories). Phases where the user wants checkpoints, may change direction, or needs to step in. |

**Sub-agent trade-offs (Continuous mode):**

- ✅ Clean context per story — agent never mixes patterns/state from US-001 into US-002
- ✅ Lower orchestrator token usage (only summaries retained)
- ✅ Same quality gates enforced — sub-agent must pass tests, coverage ≥80%, API docs, i18n before returning `completed`
- ❌ Sub-agent cannot ask the user mid-work — every decision is autonomous
- ❌ Small per-story overhead — each sub-agent re-reads rule files (acceptable cost for the reset)
- ⚠️ If a sub-agent returns `status: "blocked"`, orchestrator surfaces the blocker and asks user `[Continue / Skip / Abort]`

**When sub-agent autonomy is too risky** (very ambiguous story, exploratory bug fix, schema-altering migration): use Paused mode and walk the orchestrator through the work yourself.

### 2. Progress Tracking Mode

| Mode                         | Updates                                                                 | Use when                                                                        |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Phase Only (recommended)** | Only `phase-N.md`                                                       | Long phases, many stories. Saves ~10-30s per story.                             |
| **Complete**                 | `phase-N.md`, `completed.md`, `current-status.md`, full velocity recalc | Short phases, final phase, or when you need comprehensive tracking in one pass. |

**Neither mode updates `blockers.md`** — that file requires manual input (see `.claude/rules/…`).

For backfills later: re-run `/execute-work` in Complete mode, or edit the progress files directly. The `/update-progress` command was removed in v3.2.0.

---

## Completion Report Template

Emitted when all stories in scope are done.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 [Phase N / Epic X / Story US-XXX] — COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 STATISTICS

Stories Completed:     {{completed_stories}} / {{total_stories}}
Story Points:          {{completed_points}} / {{total_points}} ({{percentage}}%)
Tests Written:         {{tests_written}}
Tests Passing:         {{tests_passing}} / {{tests_total}}
Code Coverage:         {{coverage}}%
Git Commits:           {{commit_count}}
Duration:              {{duration}}
Average Velocity:      {{velocity}} points/day
Progress Tracking:     {{Phase Only / Complete}}

✅ QUALITY METRICS

- SOLID & DRY compliance  ✅
- Test coverage           ✅ {{coverage}}% (target 80%+)
- API status codes        ✅ all tested
{{- i18n translations     ✅ complete}}
- Linting                 ✅ no errors
- Git conventions         ✅ (NO AI credits)

🎯 NEXT STEPS

{{If Phase completed:}}  Phase {{N}} done — next: /execute-work phase {{N+1}}
{{If Epic completed:}}   Epic {{X}} done — continue with remaining epics in Phase {{N}}
{{If Story completed:}}  Story US-XXX done — continue with remaining stories

{{If Progress Tracking was "Phase Only":}}
ℹ️  Only phase file was updated. For complete tracking, re-run in
   Complete mode or edit completed.md / current-status.md directly.

📊 PHASE PROGRESS

Phase {{N}}: {{completed_points}}/{{total_points}} points ({{percentage}}%)
[████████████░░░░░░░░] {{percentage}}%
```

---

## Quality Gates (story completion checklist)

A story moves to Completed only when:

- [ ] All tasks implemented
- [ ] All tests written (unit + integration + E2E)
- [ ] All tests passing
- [ ] Coverage ≥ 80%
- [ ] All API status codes covered: 200/400/401/403/404/500
- [ ] i18n translations added (if required)
- [ ] API documentation gate clean if endpoints touched (`.claude/rules/api-documentation.md`): schema validation, typed response, doc block per `documentation-templates.md` §2.1, no drift between code/docs/tests
- [ ] **Frontend stories only:** API contract verified per `.claude/rules/api-first.md` Phase A (or story was Blocked and resumed only after backend gap closed)
- [ ] **Frontend stories only:** story scoped to one screen (or wizard with steps enumerated) per `.claude/rules/screen-driven-backlog.md`; API endpoints table present
- [ ] SOLID & DRY principles followed
- [ ] Git commit created (no AI credits)
- [ ] Progress tracking updated (at least phase file)

Implementation detail: `modules/execute-work-quality-gates.md`.

---

## Error Handling

| Situation                                                                         | Action                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests fail                                                                        | Do **not** mark story complete. Fix per quality-gates module, re-run, repeat.                                                                                                                                                                                                                                                                                                                                       |
| User cancels mid-execution                                                        | Mark current story as "In Progress" in phase file + update progress with partial state. User resumes with same command.                                                                                                                                                                                                                                                                                             |
| Dependency missing                                                                | Mark story as "Blocked" + log in `blockers.md`. Continue with non-dependent stories if any.                                                                                                                                                                                                                                                                                                                         |
| DASHBOARD.md write failure                                                        | Log error, continue implementation — user can edit DASHBOARD manually later. Never block the story over an observability write.                                                                                                                                                                                                                                                                                     |
| **Sub-agent returns malformed JSON** _(Continuous mode)_                          | Treat as `blocked` with reason `"sub-agent returned malformed JSON"`. Display the raw output as fallback, run DASHBOARD reconciliation per `execute-work-implementation-continuous.md` §2 step 5, ask user how to proceed.                                                                                                                                                                                          |
| **Sub-agent crashed mid-execution / Agent tool error** _(Continuous mode)_        | No JSON exists. Treat as `blocked` with reason `"sub-agent dispatch failed: <error>"`. Roll back DASHBOARD "Currently Working On". On the **first** failure of a run, fall back to in-line execution (`execute-work-implementation-paused.md`) for that unit only. On the **second consecutive** failure, fall back to in-line for the rest of the run. See `modules/execute-work-implementation-continuous.md` §3. |
| **Sub-agent claims `completed` but gate evidence is missing** _(Continuous mode)_ | Orchestrator re-classifies as `blocked` per `execute-work-implementation-continuous.md` §2 step 2. Reasons: `quality_gates_passed` empty/missing, `frontend_contract` ≠ `verified` for frontend stories, `linter` == `not_run`, `coverage` < 80%, `commit_hash` missing. The sub-agent's claimed "success" is not trusted without evidence.                                                                         |

---

## Backward Compatibility

### Modular backlog structure (default in v3.1+)

- Reads only the relevant `input/backlog/phase-*.md` file (not entire backlog).
- Auto-updates `output/progress/DASHBOARD.md` during work (real-time visibility).
- Auto-updates `daily-summary.md` as stories progress.
- Auto-updates `input/backlog/README.md` master-index statistics.
- ~60-70% token savings vs monolithic per run.

### Monolithic backlog structure (legacy)

- Reads the single `input/backlog.md`.
- Updates phase file + progress files based on chosen tracking mode.
- Fully supported, no deprecation.
- Consider `/migrate-to-modular` to upgrade (one-shot).

Detection is automatic; no user action.

---

## Example Execution Trace

### Continuous mode (sub-agent dispatch)

```
user: /execute-work phase 1

Claude: Execution Mode?
        [1] Continuous (fresh sub-agent per story — clean context, auto-reset)
        [2] Paused (in-line execution — manual checkpoints)
user:   1

Claude: Progress Tracking Mode?
        [1] Phase Only  [2] Complete
user:   1

Claude: 📋 [PLAN MODE ACTIVATED]
        Context read: technical spec ✅, backlog ✅, rules ✅
        [shows detailed plan]
        Proceed? [Yes/No/Revise]
user:   Yes

Claude: 🚀 [EXITING PLAN MODE — ENTERING IMPLEMENTATION MODE]

        🚀 Dispatching US-001 in fresh sub-agent (clean context)...
        [orchestrator delegates via Agent tool; sub-agent reads rules,
         implements, tests, commits — all in its own context]
        [sub-agent returns JSON summary]
        ✅ US-001 COMPLETED — tests 24/24, coverage 87%, commit abc1234

        🚀 Dispatching US-002 in fresh sub-agent (clean context)...
        [no leftover context from US-001 — that's the auto-reset]
        ✅ US-002 COMPLETED — tests 18/18, coverage 84%, commit def5678

        🎉 Phase 1 — COMPLETED
        [completion report based on collected JSON summaries]
```

### Paused mode (in-line, manual control)

```
user: /execute-work phase 1
…
Claude: Execution Mode?
user:   2

…[plan mode, approval, etc. — same as above]…

Claude: 🚀 Starting US-001: Project Setup
        [orchestrator implements → writes tests → runs tests ✅ → commits]
        ✅ US-001 COMPLETED

        ⏸️  Pause before next story
        Continue? [Yes/No/Skip to Epic X]
user:   Yes

Claude: 🚀 Starting US-002…
        [repeat]
```

---

## Related Modules

- `modules/execute-work-plan-mode.md` — plan mode workflow
- `modules/execute-work-implementation.md` — per-story implementation loop
- `modules/execute-work-quality-gates.md` — validation
- `modules/execute-work-dashboard-events.md` — DASHBOARD update triggers
- `modules/execute-work-dashboard-mechanics.md` — DASHBOARD update internals
- `modules/backlog-organization.md` — modular vs monolithic backlog rules

---

**Version:** 3.3.2
**Created:** 2026-04-21 (split from `execute-work.md`)
**Updated:** 2026-04-29 (3.3.0 sub-agent dispatch; 3.3.2 expanded Error Handling table — sub-agent crash, malformed JSON, gate-evidence rejection; corrected /clear guidance for Paused mode)
