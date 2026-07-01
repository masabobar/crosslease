# Project Status - Calculation Module

**Purpose:** Formulas and methods for calculating project status metrics.

**Parent:** `.claude/commands/project-status.md`

---

## 🚀 Optimization: Use DASHBOARD.md First!

**IMPORTANT:** Before calculating metrics from scratch, check if `DASHBOARD.md` exists.

**Optimized Flow:**

```
1. Check if output/progress/DASHBOARD.md exists
2. If YES:
   - Read DASHBOARD.md
   - Extract pre-calculated metrics:
     * Overall progress %
     * Phase progress %
     * Stories completed / total
     * Points completed / total
     * Velocity (points per week)
     * Active blockers count
     * Test coverage %
   - Use these metrics directly
   - Only recalculate if data is stale (> 24 hours old)

3. If NO (legacy structure):
   - Calculate all metrics from scratch using formulas below
```

**Benefits:**

- ✅ 60-70% faster (no recalculation needed)
- ✅ Consistent with /execute-work updates
- ✅ Metrics always current (auto-updated during work)

---

## Completion Calculations

**Note:** These formulas are for reference or when DASHBOARD.md doesn't exist.

### Overall Project

```
Overall % = (Completed Stories / Total Stories) × 100
```

### Phase Completion

```
Phase % = (Completed Stories in Phase / Total Stories in Phase) × 100
```

### Story Completion Rate

```
Rate = Completed Stories / Total Working Days
```

---

## Velocity Calculations

### Current Velocity

```
Current Velocity = Sum of story points completed in current phase / Days in phase
```

### Average Velocity

```
Avg Velocity = Total completed points / Total days across all phases
```

### Velocity Trend

```
Trend = (Current Velocity - Previous Phase Velocity) / Previous Phase Velocity × 100
Status: "increasing" if > 10%, "stable" if -10% to 10%, "decreasing" if < -10%
```

### Stories Per Week

```
Stories/Week = (Completed Stories / Days Elapsed) × 7
```

---

## Timeline Calculations

### Days Elapsed

```
Days Elapsed = Today - Project Start Date
```

### Days Remaining

```
Days Remaining = Target Launch Date - Today
```

### Estimated Completion Date

```
Remaining Points = Total Points - Completed Points
Est. Days Needed = Remaining Points / Average Velocity
Est. Completion = Today + Est. Days Needed
```

### Timeline Status

```
if Est. Completion <= Target Launch: "on track"
if Est. Completion <= Target Launch + 7 days: "at risk"
if Est. Completion > Target Launch + 7 days: "delayed"
```

---

## Bug Metrics

### Bug Count by Severity

```
Critical Count = bugs with severity="Critical" and status!="Fixed"
High Count = bugs with severity="High" and status!="Fixed"
etc.
```

### Bug Rate

```
Bug Rate = Total Bugs / Completed Stories
```

### Bug Fixing Velocity

```
Bugs Fixed/Week = Fixed Bugs / Weeks Elapsed
```

### Average Time to Fix

```
Avg Fix Time = Sum(Fix Date - Created Date for all fixed bugs) / Total Fixed Bugs
```

---

## Quality Metrics

### Test Coverage

```
Coverage % = (Lines Covered / Total Lines) × 100
Target: ≥ 80%
```

### Test Pass Rate

```
Pass Rate = (Passing Tests / Total Tests) × 100
Target: 100%
```

### Code Quality Score

```
Score based on:
- Test coverage (40%)
- Code complexity (30%)
- Code duplication (20%)
- Documentation (10%)
```

---

## Risk Calculations

### Blocker Risk Level

```
Critical blockers: High risk
>2 High blockers: Medium risk
>3 Medium blockers: Low risk
Otherwise: No risk
```

### Velocity Risk

```
if Velocity Trend < -20%: High risk
if Velocity Trend < -10%: Medium risk
Otherwise: Low risk
```

### Timeline Risk

```
if Timeline Status = "delayed": High risk
if Timeline Status = "at risk": Medium risk
if Timeline Status = "on track": Low risk
```

---

## Recommendations Engine

**Based on metrics:**

- Coverage < 80% → "Increase test coverage"
- Velocity decreasing → "Review workload and blockers"
- Critical bugs > 0 → "Address critical bugs immediately"
- Timeline at risk → "Reduce scope or extend timeline"

---

[← Back to project-status.md](../project-status.md)
