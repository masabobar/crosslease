# Execute Work — DASHBOARD.md Update Mechanics

**Purpose:** How to extract metrics, write updates, validate results, and handle errors when auto-updating DASHBOARD.md.

**Companion module:** `execute-work-dashboard-events.md` (what to update, when)

---

## Extraction Patterns

Use these regexes to pull current values out of `DASHBOARD.md`.

```
Stories Completed     /\*\*Stories Completed\*\* \| (\d+)\/(\d+)/
                      ex: "**Stories Completed** | 18/45"

Story Points Done     /\*\*Story Points Done\*\* \| (\d+)\/(\d+)/
                      ex: "**Story Points Done** | 97/279"

Phase Progress        /\*\*Progress:\*\* (\d+)% \((\d+)\/(\d+) stories\)/
                      ex: "**Progress:** 53% (8/15 stories)"

Today's Count         /\*\*Stories Completed Today:\*\* (\d+)/
                      ex: "**Stories Completed Today:** 2"

Overall Progress      /\| \*\*Overall Progress\*\* \| (\d+)% \|/
```

If a pattern doesn't match, log a warning and skip that metric — don't fail the execution.

---

## Calculation Rules

```
overallPct   = (completedPoints / totalPoints) * 100
phasePct     = (phaseCompleted / phaseTotal) * 100
velocity     = completedPoints / daysElapsed
projectedETA = today + (remainingPoints / velocity) days
```

Round percentages to the nearest whole number. Clamp velocity to a minimum of 0.1 to avoid infinite ETAs.

---

## File Write Strategy

Prefer **targeted `Edit` calls** over full-file rewrites — smaller diffs, less risk of reflow.

```javascript
Edit({
  file_path: "output/progress/DASHBOARD.md",
  old_string: "| **Overall Progress** | 42% | 100% | 🟡 At Risk |",
  new_string: "| **Overall Progress** | 44% | 100% | 🟡 At Risk |",
})

Edit({
  file_path: "output/progress/DASHBOARD.md",
  old_string: "**Stories Completed Today:** 1",
  new_string: "**Stories Completed Today:** 2",
})
```

Fallback: read the whole file, mutate in memory, write back. Only use when a targeted edit can't uniquely identify the old string.

---

## Performance: Cache Within One Run

Batch all mutations across a single `/execute-work` run. Keep metrics in memory and write DASHBOARD.md only when they change.

```javascript
const metricsCache = {
  totalStories: 45,
  totalPoints: 279,
  completedStories: 18,
  completedPoints: 97,
  // ... other derived metrics
}

function onStoryComplete(storyPoints) {
  metricsCache.completedStories += 1
  metricsCache.completedPoints += storyPoints
  // recalculate derived values
  updateDashboard(metricsCache)
}
```

Rules:

- Skip the write when a story _starts_ but no metric changes yet (EVENT 1 updates a non-metric section — still write, but cheap).
- Always write on story completion (EVENT 3).
- Always write on phase completion (EVENT 4).

---

## Validation After Each Write

Verify after every update:

1. **Metric consistency**
   - `Overall % == round((completedPoints / totalPoints) * 100)`
   - `Phase % == round((phaseCompleted / phaseTotal) * 100)`
2. **Sum checks**
   - `Σ phase points == totalPoints`
   - `Σ completed per phase == completedStories`
3. **Story counts**
   - `todaysCompletedCount ≤ totalCompletedCount`
4. **Timestamps**
   - Footer timestamp equals "now" (not future, not > 24h stale)

**On failure:** log a warning, do **not** block execution. Record discrepancies; the next run can recalculate from scratch against backlog + progress files.

---

## Error Handling

| Error                             | Action                                                             |
| --------------------------------- | ------------------------------------------------------------------ |
| `DASHBOARD.md` not found          | Skip auto-update; suggest `/migrate-to-modular` or `/init-project` |
| Regex parse miss                  | Warn, skip that metric, continue work (never block)                |
| Calculated ≠ stored metric        | Recalculate from backlog + progress; overwrite with correct value  |
| Write failure (permissions, lock) | Log error, continue; user can edit manually later                  |

The guiding principle: **never block a story's implementation on a dashboard write.** DASHBOARD.md is observability, not a gate.

---

## Status Icon Logic

```javascript
function getOverallStatus(progress, velocity, blockers) {
  if (blockers.critical > 0) return "🔴 Off Track"
  if (progress < 50 && velocity < averageVelocity * 0.8) return "🟡 At Risk"
  return "🟢 On Track"
}

function getPhaseStatus(phaseProgress, daysRemaining) {
  if (phaseProgress === 100) return "✅ Complete"
  if (phaseProgress === 0) return "⏸️ Not Started"
  if (phaseProgress > 0 && daysRemaining < 7) return "⚠️ Rushing"
  return "🔄 In Progress"
}

function getMetricStatus(value, target) {
  if (value >= target) return "🟢"
  if (value >= target * 0.8) return "🟡"
  return "🔴"
}
```

---

## Summary

**This module covers the machinery**: regex extraction, calculations, Edit-tool usage, caching, validation, error handling, and status-icon logic.

**See `execute-work-dashboard-events.md`** for the five update events and which DASHBOARD sections each touches.

**Version:** 2.0.0 (split from the original combined module)
**Last Updated:** 2026-04-21
