# Add Scope — README.md Update Module

**Purpose:** Recalculate statistics and update `input/backlog/README.md` after changes to the modular backlog.

**Referenced by:** `add-scope.md` STEP 5 (Execute Changes)
**Companion module:** `add-scope-readme-patterns.md` (extraction regex, section templates, validation, error handling)

---

## When to Use This Module

**Only for modular backlog structure** — when `structure_type = "modular"` (detected in `add-scope-input-parsing.md` §0.2) and after touching `input/backlog/phase-*.md` or `input/backlog/future.md`.

**Skip for monolithic structure** (`backlog.md`). No README.md to update in that layout.

---

## Update Trigger Events

Update README.md when:

1. ✅ Story added → recalc total stories, total points, phase breakdown
2. ✅ Story edited (points changed) → recalc total points, phase breakdown
3. ✅ Story moved (to a different phase) → recalc phase breakdown
4. ✅ Story deleted → recalc everything
5. ✅ Epic added → recalc epic count
6. ✅ Epic deleted → recalc epic count + story counts

**Skip update when:**

- ❌ Only editing description/title (no numeric change)
- ❌ Only editing acceptance criteria
- ❌ Phase added/edited (README.md tracks backlog, not execution phases)

---

## STEP 1: Recalculate Statistics

### Globals

```javascript
const phaseFiles = [
  "input/backlog/phase-1-foundation.md",
  "input/backlog/phase-2-core.md",
  "input/backlog/phase-3-advanced.md",
  "input/backlog/phase-4-polish.md",
  "input/backlog/future.md",
]

let totalStories = 0,
  totalPoints = 0,
  totalEpics = 0
const phaseStats = {}

for (const f of phaseFiles) {
  const content = readFile(f)
  const epics = countMatches(content, /^## Epic \d+:/gm)
  const stories = countMatches(content, /- \*\*US-\d{3}\*\*:/g)
  const points = sumMatches(content, /- \*\*Story Points:\*\* (\d+)/g)

  phaseStats[f] = { epics, stories, points }
  totalEpics += epics
  totalStories += stories
  totalPoints += points
}
```

### Priority Breakdown (optional)

```javascript
const priorityStats = {
  P0: { count: 0, points: 0 },
  P1: { count: 0, points: 0 },
  P2: { count: 0, points: 0 },
  P3: { count: 0, points: 0 },
}

for (const f of phaseFiles) {
  for (const s of extractStories(readFile(f))) {
    if (priorityStats[s.priority]) {
      priorityStats[s.priority].count += 1
      priorityStats[s.priority].points += s.points
    }
  }
}
```

For the exact regexes behind `countMatches` / `sumMatches` / `extractStories`, see **`add-scope-readme-patterns.md` §Extraction Patterns**.

---

## STEP 2: Update README.md Sections

**File:** `.project-management/input/backlog/README.md`

Three sections need updating on any relevant change:

1. **Summary Statistics** — Total Epics, Stories, Points
2. **By Phase** — per-phase counts (stories + points)
3. **Phase Backlogs** — per-phase `Stories: N | Points: N` header, plus status

An optional fourth section, **By Priority**, updates when priority distribution changes.

All concrete section templates + find/replace examples are in **`add-scope-readme-patterns.md` §Section Templates**.

---

## STEP 3: Update Last Modified Timestamp

At the top of README.md:

```markdown
**Last Updated:** {{DATE}}
```

Replace with today's date (ISO format `YYYY-MM-DD`).

---

## STEP 4: Write the Changes

Prefer targeted `Edit` calls over full rewrites — only touch lines that actually moved:

```javascript
Edit({
  file_path: "input/backlog/README.md",
  old_string: "**Total Stories:** 44",
  new_string: "**Total Stories:** 45",
})

Edit({
  file_path: "input/backlog/README.md",
  old_string: "**Total Story Points:** 274",
  new_string: "**Total Story Points:** 279",
})
```

Fallback: read the full README, swap all `{{placeholders}}`, write back.

---

## Validation Before Completing

Every update must pass these checks (details in `add-scope-readme-patterns.md` §Validation):

- Phase stories sum = total stories
- Phase points sum = total points
- Priority sum = total stories
- All referenced phase files exist

If any fails, log a warning and let the user decide whether to proceed. Don't silently block `/add-scope`.

---

## Worked Example

**Action:** `/add-scope add story 2 3`

Before: Phase 2 has 15 stories (97 pts); project total 45 stories (279 pts).
After: Phase 2 has 16 stories (105 pts); project total 46 stories (287 pts).

**README diff:**

```diff
 ## 📊 Summary Statistics
 **Total Epics:** 18
-**Total Stories:** 45
-**Total Story Points:** 279
+**Total Stories:** 46
+**Total Story Points:** 287

 **By Phase:**
 - Phase 1 (Foundation): 8 stories, 34 points
-- Phase 2 (Core Features): 15 stories, 97 points
+- Phase 2 (Core Features): 16 stories, 105 points
 - Phase 3 (Advanced): 10 stories, 68 points
```

Last Updated also changes:

```diff
-**Last Updated:** 2026-04-19
+**Last Updated:** 2026-04-20
```

---

## Integration with DASHBOARD.md

After README.md updates, also refresh `output/progress/DASHBOARD.md`:

```javascript
updateDashboard({
  totalStories: 46,
  totalPoints: 287,
  completedStories: extractFromProgress("completed_count"),
  completedPoints: extractFromProgress("completed_points"),
})
```

See `live-progress-dashboard.md` + `execute-work-dashboard-events.md` for the dashboard side.

---

## Performance

Cache file reads within a single `/add-scope` run:

```javascript
const fileCache = {}
function readPhaseBacklog(f) {
  if (!(f in fileCache)) fileCache[f] = readFile(f)
  return fileCache[f]
}
```

**Only read files that changed:** if only Phase 2 changed, skip Phase 1/3/4/future.

---

**Version:** 2.0.0 (split from the original combined module)
**Last Updated:** 2026-04-21
**Used by:** `/add-scope` (STEP 5)
**Related:** `add-scope-readme-patterns.md`, `add-scope-input-parsing.md`, `live-progress-dashboard.md`
