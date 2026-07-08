# Project Status - Quick Guide

**Use when:** Need quick overview of project health and progress
**Command:** `/project-status`
**Time:** ~1 minute
**Output:** Comprehensive status report with metrics and recommendations

**All documentation is in English only.**

---

## 🎯 What It Shows

Comprehensive project overview:

- ✅ Phase progress (current, completed, remaining)
- ✅ Story points (completed vs total, velocity)
- ✅ Active blockers and issues
- ✅ Recent completed work
- ✅ Quality metrics (test coverage, code health)
- ✅ Next recommended actions

---

## 📋 Command Format

```bash
/project-status
```

**No arguments needed** - always shows complete status.

---

## 📊 What You Get

### 1. Current Phase Status

```
Current Phase: Phase 2 - Core Features
Progress: 28/42 story points (67%)
Status: In Progress
Started: 2026-03-15
```

### 2. Overall Project Progress

```
Total Story Points: 103/245 (42%)
Phases Completed: 1/4 (Phase 1: Foundation)
Velocity: 12 points/week (last 2 weeks)
Estimated Completion: 2026-06-20 (based on current velocity)
```

### 3. Active Blockers

```
🚫 BLOCKERS (2):
- US-015: Waiting for API credentials from client
- US-023: Database migration blocked by server access
```

### 4. Recent Completed Work

```
✅ RECENTLY COMPLETED (last 7 days):
- US-012: User profile page (5 points)
- US-013: Avatar upload (3 points)
- US-014: Email notifications (8 points)
```

### 5. Quality Metrics

```
📈 QUALITY:
- Tests Passing: 156/156
- Linting Errors: 0
- SOLID & DRY: Compliant
```

### 6. Next Steps

```
🎯 RECOMMENDED NEXT STEPS:
1. Resolve blocker: Contact client for API credentials
2. Continue Phase 2: 14 story points remaining
3. Next up: US-016 - Payment integration (8 points)
```

---

## 🔍 Example Output

```
You: /project-status

Claude: Reading project data...
        ✅ Phase files
        ✅ Progress tracking
        ✅ Backlog
        ✅ Git history

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📊 PROJECT STATUS REPORT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Generated: 2026-04-02 14:30

        PROJECT: E-commerce Platform

        📍 CURRENT PHASE:
        Phase 2: Core Features
        Progress: 28/42 points (67%)
        Status: In Progress
        Started: 2026-03-15
        Stories: 8/12 completed

        📊 OVERALL PROGRESS:
        Total: 103/245 points (42%)
        Phases Completed: 1/4
        - ✅ Phase 1: Foundation (89 points)
        - 🔄 Phase 2: Core Features (28/42 points)
        - ⏳ Phase 3: Advanced Features (0/58 points)
        - ⏳ Phase 4: Polish & Launch (0/56 points)

        ⚡ VELOCITY:
        Last 2 weeks: 12 points/week
        Last 4 weeks: 10 points/week
        Estimated completion: 2026-06-20

        🚫 BLOCKERS (2):
        - US-015: API credentials needed
        - US-023: Server access required

        ✅ RECENT WORK (last 7 days):
        - US-012: User profile (5 pts) ✅
        - US-013: Avatar upload (3 pts) ✅
        - US-014: Notifications (8 pts) ✅

        📈 QUALITY METRICS:
        - Tests: 156/156 passing ✅
        - Linting: No errors ✅
        - Standards: SOLID & DRY ✅

        🎯 NEXT STEPS:
        1. Resolve blockers (contact client)
        2. Complete Phase 2 (14 pts remaining)
        3. Next story: US-016 (8 points)
        4. Prepare Phase 3 backlog review

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Common Issues

| Issue                        | Solution                          | Reference                                         |
| ---------------------------- | --------------------------------- | ------------------------------------------------- |
| "No progress data"           | Run `/init-project` first         | [init-project.md](./init-project.md)              |
| Velocity calculation missing | Need at least 2 completed stories | Full docs "Calculation"                           |
| Blockers not showing         | Update blockers.md manually       | `.project-management/output/progress/blockers.md` |

---

## 🎯 When to Check Status

**Check regularly:**

- Before starting new work
- After completing stories
- During stand-ups or check-ins
- When planning the next phase

**Automatic updates:**

- `/execute-work` updates progress automatically (DASHBOARD.md, daily-summary.md, etc.)
- Manual edits: open the progress file directly

---

## 📚 Full Documentation

**This is a quick guide (80 lines).**

For complete details, see: [`.claude/commands/project-status.md`](../project-status.md) (290 lines)

Includes:

- Data collection procedures
- Calculation formulas
- Velocity tracking details
- Module references for data collection and calculations
