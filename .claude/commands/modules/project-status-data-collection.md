# Project Status - Data Collection Module

**Purpose:** Methods for collecting project data for status reporting.

**Parent:** `.claude/commands/project-status.md`

---

## Data Sources

### DASHBOARD.md (Primary Source - NEW!)

- **Location:** `.project-management/output/progress/DASHBOARD.md`
- **Priority:** Read FIRST - contains pre-calculated metrics
- **Extract:**
  - Overall progress % (already calculated)
  - Current phase name and progress %
  - Stories completed count (total and by phase)
  - Story points completed (total and by phase)
  - Active blockers count
  - Today's progress (stories completed today)
  - Currently working on (active stories)
  - Velocity metrics (points per week)
  - Timeline projections
  - Quality metrics (passing tests, lint status)
  - Phase breakdown (all phases with progress %)

**Benefits:**

- ✅ Saves 60-70% token usage (metrics pre-calculated)
- ✅ Always up-to-date (auto-updated during /execute-work)
- ✅ Single source of truth for current status
- ✅ No need to recalculate metrics from scratch

**Fallback:** If DASHBOARD.md doesn't exist, calculate metrics from phase files (legacy method)

---

### Phase Files

- **Location:** `.project-management/output/phases/phase-*.md`
- **Read:** All phase files (1, 2, 3, 4)
- **Extract:**
  - Phase metadata (title, goal, duration)
  - Stories (US-XXX) with status (Todo/In Progress/Completed)
  - Story points
  - Dependencies
  - Epics

### Backlog (Modular Structure)

- **Primary Location:** `.project-management/input/backlog/README.md` (master index with statistics)
- **Phase Files:** `.project-management/input/backlog/phase-*.md` (detailed stories per phase)
- **Extract from README.md:**
  - Total story count
  - Total points
  - Phase breakdown (stories and points per phase)
  - Priority breakdown (P0/P1/P2/P3 counts)
- **Extract from phase files (if detailed breakdown needed):**
  - All user stories with IDs (US-XXX)
  - Story points per story
  - Priorities per story
  - Epic groupings
  - Acceptance criteria and dependencies

**Fallback:** If `backlog/README.md` doesn't exist, read `backlog.md` (legacy structure)

### Progress Files

- **Location:** `.project-management/output/progress/`
- **Files:**
  - `phase-1-progress.md` - Phase 1 tracking
  - `phase-2-progress.md` - Phase 2 tracking (etc.)
  - `completed.md` - Completed work log
  - `blockers.md` - Active blockers

- **Extract:**
  - Completion dates
  - Time spent per story
  - Blocker details (severity, status, resolution)

### Bug Files

- **Location:** `.project-management/output/bugs/`
- **Files:**
  - `bug-roadmap.md` - Active bugs
  - `bug-archive.md` - Fixed bugs

- **Extract:**
  - Bug IDs (BUG-XXX)
  - Severity (Critical/High/Medium/Low)
  - Status (New/In Progress/Fixed/Verified)
  - Created/Fixed dates

### Constraints

- **Location:** `.project-management/input/constraints.md`
- **Extract:**
  - Project start date
  - Target launch date
  - Team size
  - Budget

---

## Data Aggregation

### Story Statistics

```javascript
{
  total: count of all stories,
  completed: count where status="Completed",
  in_progress: count where status="In Progress",
  todo: count where status="Todo",
  blocked: count where blocked=true,
  by_priority: {
    P0: { total, completed },
    P1: { total, completed },
    P2: { total, completed }
  },
  by_phase: {
    1: { total, completed, in_progress },
    2: { total, completed, in_progress },
    ...
  }
}
```

### Story Points Summary

```javascript
{
  total: sum of all story points,
  completed: sum where status="Completed",
  remaining: total - completed,
  velocity: completed / days_elapsed
}
```

### Bug Statistics

```javascript
{
  active: {
    critical: count,
    high: count,
    medium: count,
    low: count
  },
  fixed: {
    total: count,
    by_week: array of weekly counts
  },
  avg_fix_time: average days to fix
}
```

### Timeline Data

```javascript
{
  start_date: from constraints.md,
  target_date: from constraints.md,
  days_elapsed: today - start_date,
  days_remaining: target_date - today,
  estimated_completion: calculated from velocity
}
```

---

## Parsing Methods

### Extract Story Status from Phase File

```
Pattern: ### US-XXX: [Title]
Next line: **Status:** Todo/In Progress/Completed
Extract: US-XXX, status
```

### Extract Bug Severity from Bug Roadmap

```
Sections: ## Critical, ## High, ## Medium, ## Low
For each section: extract BUG-XXX IDs
Map: BUG-XXX → severity
```

### Extract Completion Dates from Progress Files

```
Pattern: - [x] US-XXX completed (YYYY-MM-DD)
Extract: US-XXX → completion_date
```

### Extract Blockers

```
From blockers.md:
Pattern: ## [BLOCKER-XXX] Title
Extract: blocker_id, severity, status, affected_stories
```

---

## Validation

**Ensure data integrity:**

- All story IDs in phase files exist in backlog
- Story points are Fibonacci numbers
- Dates are valid (YYYY-MM-DD format)
- Statuses are valid (Todo/In Progress/Completed)
- Bug severities are valid (Critical/High/Medium/Low)

**If validation fails:** Report errors, skip invalid entries.

---

## Caching Strategy

**For performance:**

- Cache file reads (memoize within single /project-status run)
- Don't cache across runs (data changes frequently)
- Parse each file only once per run

---

## ✅ Modular Structure Integration

**Status:** Updated for modular backlog system (2026-04-20)

**Key Changes:**

1. **DASHBOARD.md as primary source** - Read first for pre-calculated metrics
2. **Backlog from README.md** - Use master index for statistics
3. **Phase files from backlog/** - Read detailed stories from phase-\*.md files
4. **Backward compatibility** - Falls back to legacy structure if modular doesn't exist

**Reading Strategy:**

```
Priority 1: Read DASHBOARD.md (if exists) → Use pre-calculated metrics
Priority 2: Read backlog/README.md (if exists) → Get summary statistics
Priority 3: Read backlog/phase-*.md (optional) → Get detailed story info
Fallback: Read backlog.md (legacy) → Calculate everything from scratch
```

**Token Savings:** 60-70% reduction by using DASHBOARD.md + README.md

---

[← Back to project-status.md](../project-status.md)
