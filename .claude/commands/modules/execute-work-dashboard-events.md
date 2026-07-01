# Execute Work — DASHBOARD.md Update Events

**Purpose:** Define the five update triggers and what each event changes in DASHBOARD.md.

**Referenced by:** `execute-work.md` STEP 3 (Implementation Loop)
**Companion module:** `execute-work-dashboard-mechanics.md` (extraction, write, error handling)

---

## When to Use This Module

**Only for modular backlog structure:**

- `structure_type = "modular"` (detected in execute-work.md STEP 1A)
- `output/progress/DASHBOARD.md` exists
- During `/execute-work` execution (phase/epic/story/bug)

**Skip for monolithic structure or if DASHBOARD.md doesn't exist:**

- Falls back to standard progress tracking (phase files only)
- User can run `/project-status` manually for reports

---

## Update Trigger Events

| #   | Event           | Section Updated                                                |
| --- | --------------- | -------------------------------------------------------------- |
| 1   | Story started   | Currently Working On                                           |
| 2   | Tests run       | Quality Metrics                                                |
| 3   | Story completed | Today's Progress, Recently Completed, progress % (MAIN UPDATE) |
| 4   | Phase completed | Phase Breakdown + advance to next phase                        |
| 5   | Bug fixed       | Active Blockers (if bug was a blocker)                         |

---

## EVENT 1: Story Started

**Trigger:** After TodoWrite creates story breakdown, before implementation starts.

**Section: "Currently Working On"**

Before:

```markdown
- 🔄 US-005: Product listing screen (8 pts) - 40% complete
```

After:

```markdown
- 🔄 US-006: Product detail screen (5 pts) - 0% complete (just started)
```

Timestamp footer: `_Auto-updated by /execute-work story US-006 at 2026-04-20 14:32:15_`

---

## EVENT 2: Tests Run

**Trigger:** After tests complete, before marking story complete.

**Section: "Quality Metrics"**

Before → After:

```markdown
| Test Coverage | 84% | 80% | 🟢 | → | Test Coverage | 87% | 80% | 🟢 |
| Passing Tests | 142/145 | 145 | 🟡 | → | Passing Tests | 151/151 | 151 | 🟢 |
```

Use the status icon logic from `execute-work-dashboard-mechanics.md`.

---

## EVENT 3: Story Completed (MAIN UPDATE)

**Trigger:** After git commit created, after progress tracking updated.

Updates **seven** DASHBOARD.md sections:

### 3.1 Today's Progress — append completed story

```markdown
**Stories Completed Today:** 2

- ✅ US-005: Product listing screen (5 pts) - Completed at 14:15
- ✅ US-006: Product detail screen (3 pts) - Completed at 16:42
```

### 3.2 Currently Working On — clear or advance

If more stories pending: insert next story, `0% complete`.
If none: `- None - All stories completed! 🎉`

### 3.3 Quick Status table — recalc overall/phase/stories/points

```markdown
| **Overall Progress** | 44% | 100% | 🟡 At Risk |
| **Current Phase** | 60% | 100% | 🟢 On Track |
| **Stories Completed** | 19/45 | 45 | 🟡 |
| **Story Points Done** | 100/279 | 279 | 🟡 |
```

### 3.4 Current Phase progress bar

`**Progress:** 60% (9/15 stories)`

### 3.5 Recently Completed table — prepend, keep last 5

```markdown
| Story               | Completed        | Points |
| ------------------- | ---------------- | ------ |
| US-006              | 2026-04-20 16:42 | 3      |
| US-005              | 2026-04-20 14:15 | 5      |
| ... (5 most recent) |
```

### 3.6 Velocity & Timeline — recalc

Velocity = completedPoints / daysElapsed.
Projection = today + (remainingPoints / velocity).

Example:

- completed 100 pts over 50 days → 2.0 pts/day
- remaining 179 pts → 90 days → 2026-07-19

### 3.7 Story Points Completed Today counter

`**Story Points Completed Today:** 8`

### 3.8 Screen-map refresh (frontend stories only)

**Trigger:** completed story is a frontend story (Type: Frontend per `.claude/rules/screen-driven-backlog.md`) AND `.project-management/input/screens/screen-map.md` exists.

**Action:**

1. The orchestrator invokes `/screen-map` (skill) AFTER §3.1–3.7 above, BEFORE dispatching the next unit. In sub-agent / Continuous mode the sub-agent does NOT invoke `/screen-map` itself — it sets `"screen_map_refresh_needed": true` in its JSON return and the orchestrator runs the refresh (full handoff documented in `execute-work-implementation-continuous.md` §2 step 3a).
2. `/screen-map` regenerates the API endpoint columns + Status fields in the screen map from the current story tables. Hand-curated content (navigation hierarchy, screen metadata, descriptions) is preserved.
3. If `/screen-map` reports drift (stories referencing screens not in the map, orphan screens, malformed stories, nav ↔ registry mismatches) the orchestrator surfaces a one-line note under the completed-story display: `⚠️ Screen-map drift: <N> items — see input/screens/screen-map.md §4`. Drift is informational, never blocks the run.

**Skip if:** story is backend-only / bug / no `**Screen:**` field; or the project has no screen-map (API-only / simple SPA per `.claude/rules/screen-inventory.md` §1).

---

## EVENT 4: Phase Completed

**Trigger:** When all stories in a phase are completed.

**Section: "Phase Breakdown"**

Before → After:

```markdown
| Phase 2: Core Features | 🔄 Active | 14/15 | 91/97 | 93% |
→
| Phase 2: Core Features | ✅ Complete | 15/15 | 97/97 | 100% |
```

**Advance to Next Phase:**

```markdown
## 🚀 Current Phase: Phase 3 - Advanced Features

**Goal:** Secondary features and optimization
**Duration:** 2026-05-01 to 2026-06-15
**Progress:** 0% (0/10 stories)
```

Also update: Overall Progress %, Quick Status table, "Current Phase" header.

---

## EVENT 5: Bug Fixed

**Trigger:** When `/execute-work bug BUG-XXX` completes.

**Section: "Active Blockers"**

If bug was linked to a blocker:

```markdown
| BLOCKER-001 | API rate limiting | High | US-010, US-011 | 🟢 Resolved (BUG-005 fixed) |
```

If blocker fully resolved → remove the row from Active Blockers.

---

## Complete Flow: Story US-006 Completes

1. Read `DASHBOARD.md`.
2. Extract current metrics (total stories 45, completed 18, total pts 279, completed pts 97, current phase 2, phase 8/15, phase pts 91/97).
3. Read completed story details (ID, title, points, completion time).
4. Recalculate:
   - Completed stories: 18 → 19
   - Completed points: 97 → 100
   - Overall: (100/279) \* 100 = 36%
   - Phase: (94/97) \* 100 = 97%
   - Velocity: 100/50 = 2.0 pts/day
5. Update sections 3.1 – 3.7 above.
6. Write `DASHBOARD.md`.
7. Append timestamp footer.

For regex extraction patterns, Edit calls, error handling, and status icon logic, see **`execute-work-dashboard-mechanics.md`**.

---

## Integration with daily-summary.md

When a story completes, also update `daily-summary.md` (see `live-progress-dashboard.md` for structure). Minimum fields: storyId, storyTitle, points, completedAt, timeSpent, filesChanged, testsAdded.

---

## Summary

**Covered here:** the five events and their section-level effects.
**Covered elsewhere** (`execute-work-dashboard-mechanics.md`): regex extraction, Edit-tool usage, validation, error handling, status icon functions.

**Version:** 2.0.0 (split from the original combined module)
**Last Updated:** 2026-04-21
