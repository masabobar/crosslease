# Add Scope — README Patterns & Templates

**Purpose:** Concrete regex extraction patterns, section templates, status calculation, validation checks, and error handling for `add-scope-readme-update.md`.

**Parent module:** `add-scope-readme-update.md`

---

## Extraction Patterns

Use these regexes to read current state out of `input/backlog/phase-*.md` files.

### Count Epics

```
/^## Epic \d+:/gm
```

Matches: `## Epic 1: User Authentication`, `## Epic 2: Product Catalog`.

### Count Stories

```
/- \*\*US-\d{3}\*\*:/g
```

Matches: `- **US-001**: User registration`, `- **US-015**: Product listing`.

### Extract Story Points

```
/- \*\*Story Points:\*\* (\d+)/g
```

Capture group 1 = points. Sum across all matches.

### Extract Priority

```
/- \*\*Priority:\*\* (P[0-3])/g
```

Capture group 1 = `P0` / `P1` / `P2` / `P3`.

---

## Section Templates

All target `.project-management/input/backlog/README.md`.

### 1. Summary Statistics

**Placeholder (initial):**

```markdown
## 📊 Summary Statistics

**Total Epics:** {{EPIC_COUNT}}
**Total Stories:** {{STORY_COUNT}}
**Total Story Points:** {{TOTAL_POINTS}}
```

**Replace with computed values:**

```markdown
## 📊 Summary Statistics

**Total Epics:** 18
**Total Stories:** 45
**Total Story Points:** 279
```

### 2. By Phase

**Placeholder:**

```markdown
**By Phase:**

- Phase 1 (Foundation): {{P1_STORIES}} stories, {{P1_POINTS}} points
- Phase 2 (Core Features): {{P2_STORIES}} stories, {{P2_POINTS}} points
- Phase 3 (Advanced): {{P3_STORIES}} stories, {{P3_POINTS}} points
- Phase 4 (Polish): {{P4_STORIES}} stories, {{P4_POINTS}} points
- Future (Post-launch): {{FUTURE_STORIES}} stories
```

**Replace with computed:**

```markdown
**By Phase:**

- Phase 1 (Foundation): 8 stories, 34 points
- Phase 2 (Core Features): 15 stories, 97 points
- Phase 3 (Advanced): 10 stories, 68 points
- Phase 4 (Polish): 8 stories, 55 points
- Future (Post-launch): 4 stories, 25 points
```

### 3. By Priority (optional)

**Placeholder:**

```markdown
**By Priority:**

- P0 (Must Have): {{P0_COUNT}} stories, {{P0_POINTS}} points
- P1 (Should Have): {{P1_COUNT}} stories, {{P1_POINTS}} points
- P2 (Nice to Have): {{P2_COUNT}} stories, {{P2_POINTS}} points
```

**Replace with:**

```markdown
**By Priority:**

- P0 (Must Have): 12 stories, 89 points
- P1 (Should Have): 18 stories, 112 points
- P2 (Nice to Have): 15 stories, 78 points
```

### 4. Phase Backlogs (per phase)

**Placeholder:**

```markdown
### [Phase 1: Foundation & Setup](phase-1-foundation.md)

**Goal:** Project infrastructure, authentication, basic setup
**Stories:** {{P1_STORIES}} | **Points:** {{P1_POINTS}}
**Status:** {{P1_STATUS}} ({{P1_COMPLETE}}/{{P1_TOTAL}} completed)
```

**Replace with:**

```markdown
### [Phase 1: Foundation & Setup](phase-1-foundation.md)

**Goal:** Project infrastructure, authentication, basic setup
**Stories:** 8 | **Points:** 34
**Status:** In Progress (3/8 completed)
```

`Status` comes from `output/progress/DASHBOARD.md` (see next section).

---

## Status Calculation (from DASHBOARD.md)

```javascript
const phaseProgress = readDashboard()
const phase1 = phaseProgress.phases[1]
// { completed: 3, total: 8, percentage: 37.5 }

const statusText = `${phase1.status} (${phase1.completed}/${phase1.total} completed)`
// "In Progress (3/8 completed)"
```

**Status values:**

- ✅ **Complete** — 100%
- 🔄 **In Progress** — 1-99%
- ⏸️ **Not Started** — 0%
- ⚠️ **Blocked** — has active blockers (see `blockers.md`)

---

## Validation

After writing README.md, run these checks:

1. **Phase stories sum = total stories**
   ```
   Phase 1 (8) + Phase 2 (15) + Phase 3 (10) + Phase 4 (8) + Future (4) = 45 ✓
   ```
2. **Phase points sum = total points**
   ```
   34 + 97 + 68 + 55 + 25 = 279 ✓
   ```
3. **Priority sum = total stories**
   ```
   P0 (12) + P1 (18) + P2 (15) + P3 (0) = 45 ✓
   ```
4. **All referenced phase files exist**
   ```
   phase-1-foundation.md ✓  phase-2-core.md ✓  phase-3-advanced.md ✓
   phase-4-polish.md ✓       future.md ✓
   ```

**On failure:** log a warning, show the mismatch to the user, continue (don't block `/add-scope`). The next run can recalculate from scratch.

---

## Error Handling

| Error                                             | Action                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `backlog/README.md` not found                     | Project may be monolithic (`backlog.md` exists). Skip README update.           |
| `phase-N-*.md` not found but referenced in README | Suggest `/migrate-to-modular` or verify file name.                             |
| Invalid sum (phase ≠ total)                       | Warn user, recalculate from scratch against phase files.                       |
| Regex parse miss                                  | Log which pattern failed; skip that metric; ask for manual review if critical. |

The guiding principle: **never block `/add-scope` because the README fell out of sync**. Warn, continue, leave a clear fix path.

---

**Version:** 2.0.0 (split from the original combined module)
**Last Updated:** 2026-04-21
**Parent:** `add-scope-readme-update.md`
