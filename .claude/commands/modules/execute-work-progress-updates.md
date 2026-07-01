# Execute Work — Progress-File Updates

Companion to `execute-work-implementation.md`. Holds the concrete update steps + display blocks for STEP 3.8, split by Progress Tracking Mode.

Mode is chosen in STEP 0 and passed through to this step.

---

## Mode 1 — Phase Only (faster)

Updates **only** `.project-management/output/phases/phase-N.md`:

1. Find the story's section in the phase file.
2. Update status → `Completed`.
3. Add completion timestamp.
4. Add test metrics (count, coverage).
5. Add commit hash.
6. Update phase-level progress metrics (completed/total points, % done).

**Display:**

```
📊 Progress Updated (Phase Only)

- Phase N: {{completed_points}}/{{total_points}} points ({{percentage}}%)
- Tests:   {{total_tests}} passing
- Coverage: {{coverage}}%

ℹ️  For complete tracking later: re-run in Complete mode or edit progress files directly.
```

---

## Mode 2 — Complete (slower, full update)

Updates **all** progress files (except `blockers.md` — manual only).

### 2.1 Phase File

`.project-management/output/phases/phase-N.md` — same steps as Phase Only mode above.

### 2.2 Completed Work Log

`.project-management/output/progress/completed.md` — append to the current week section (create it if the first completion this week):

```markdown
## Week {{WEEK_NUMBER}} ({{DATE_RANGE}})

### Completed Stories

- ✅ US-XXX: {{story_title}} ({{points}} points)
  - Completed: {{DATE}}
  - Tests: {{test_count}} passing
  - Coverage: {{coverage}}%
  - Commit: {{commit_hash}}
```

### 2.3 Current Status

`.project-management/output/progress/current-status.md` — recalculate:

- Overall completion %: `(completed_points / total_points) * 100`
- Per-phase progress
- Velocity: `completed_points / weeks_elapsed`
- Test coverage metrics
- Timeline status (on-track / at-risk / delayed)

### 2.4 Blockers

**Do NOT update `blockers.md` automatically.** Blockers need human context — edit the file directly when a blocker appears or resolves.

### 2.5 Display

```
📊 Progress Updated (Complete)

✅ PHASE FILE
- Phase N: {{completed_points}}/{{total_points}} points ({{percentage}}%)

✅ COMPLETED WORK
- Added US-XXX to Week {{WEEK_NUMBER}}

✅ CURRENT STATUS
- Overall Completion: {{old}}% → {{new}}% (+{{delta}}%)
- Velocity:           {{velocity}} points/week
- Tests:              {{total_tests}} passing
- Coverage:           {{coverage}}%

ℹ️  Note: Blockers not updated (edit blockers.md directly when needed).
```

---

## Auto-Updates (modular structure only)

When `structure_type == "modular"` and `DASHBOARD.md` exists, both modes also trigger DASHBOARD.md updates — see `execute-work-dashboard-events.md` + `execute-work-dashboard-mechanics.md`:

- Story completed → DASHBOARD "Today's Progress", "Recently Completed", progress %.
- Phase completed → DASHBOARD "Phase Breakdown", advance to next phase.

These run **in addition** to the Mode 1 / Mode 2 updates above, not instead of them.

---

## When to pick which mode

| Situation                                        | Recommended mode                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Long phase, many stories                         | Phase Only — saves ~10-30s per story                             |
| Final phase or release-prep                      | Complete — everything in sync for project-status / stakeholders  |
| You plan to re-run `/project-status` right after | Either — `/project-status` recalculates from DASHBOARD.md anyway |
| Need velocity trend this run                     | Complete — velocity is in current-status.md                      |

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `execute-work-implementation.md`)
**Parent:** `execute-work-implementation.md`
