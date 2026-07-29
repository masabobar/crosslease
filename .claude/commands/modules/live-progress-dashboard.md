# Live Progress Dashboard Module

**Purpose:** Auto-update progress files during work execution for real-time visibility without running commands.

**Used by:** `/execute-work`

---

## Problem

Old approach:

- ❌ No single live view of progress
- ❌ Progress files not automatically updated
- ❌ No quick at-a-glance view

New approach:

- ✅ `DASHBOARD.md` — always current, read anytime
- ✅ Auto-updated during `/execute-work`
- ✅ Live progress files in `output/progress/`
- ✅ No command needed — just open the file

---

## Progress Directory Layout

```
.project-management/output/progress/
├── DASHBOARD.md         ← Main live dashboard (this module)
├── current-status.md    ← Detailed status (see sub-files module)
├── daily-summary.md     ← Today's work (see sub-files module)
├── weekly-report.md     ← This week's summary (see sub-files module)
├── completed.md         ← Append-only history (see sub-files module)
└── blockers.md          ← Active blockers (see sub-files module)
```

---

## DASHBOARD.md — Template

**Location:** `.project-management/output/progress/DASHBOARD.md`
**Target size:** < 200 lines

```markdown
# 📊 Project Dashboard

**Last Updated:** {{TIMESTAMP}} (auto-updated during work)
**Current Phase:** Phase {{PHASE_NUMBER}} - {{PHASE_NAME}}

---

## 🎯 Quick Status

| Metric                | Value                            | Target           | Status             |
| --------------------- | -------------------------------- | ---------------- | ------------------ |
| **Overall Progress**  | {{OVERALL_PCT}}%                 | 100%             | {{OVERALL_STATUS}} |
| **Current Phase**     | {{PHASE_PCT}}%                   | 100%             | {{PHASE_STATUS}}   |
| **Stories Completed** | {{COMPLETED}}/{{TOTAL}}          | {{TOTAL}}        | {{STORY_STATUS}}   |
| **Story Points Done** | {{POINTS_DONE}}/{{POINTS_TOTAL}} | {{POINTS_TOTAL}} | {{POINTS_STATUS}}  |
| **Passing Tests**     | {{PASSING}}/{{TOTAL_TESTS}}      | {{TOTAL_TESTS}}  | {{TEST_STATUS}}    |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress ({{TODAY_DATE}})

**Stories Completed Today:** {{TODAY_COUNT}}

- ✅ US-005: Product listing screen (5 pts) - 14:32
- ✅ US-006: Product detail screen (3 pts) - 16:15

**Currently Working On:**

- 🔄 US-007: Shopping cart UI (8 pts) - 60% complete

**Story Points Completed Today:** {{TODAY_POINTS}}

---

## 🚀 Current Phase: {{PHASE_NAME}}

**Goal:** {{PHASE_GOAL}}
**Duration:** {{START_DATE}} to {{END_DATE}}
**Progress:** {{PHASE_PCT}}% ({{PHASE_DONE}}/{{PHASE_TOTAL}} stories)

### Active Stories

| Story  | Status         | Progress | Assignee |
| ------ | -------------- | -------- | -------- |
| US-007 | 🔄 In Progress | 60%      | -        |
| US-008 | 📋 Todo        | 0%       | -        |

### Recently Completed

| Story  | Completed        | Points |
| ------ | ---------------- | ------ |
| US-006 | 2026-04-14 16:15 | 3      |
| US-005 | 2026-04-14 14:32 | 5      |
| US-004 | 2026-04-13 17:20 | 5      |

---

## ⚠️ Active Blockers

{{#if blockers}}
| ID | Title | Severity | Affected Stories | Status |
|----|-------|----------|------------------|--------|
| BLOCKER-001 | API rate limiting | High | US-010, US-011 | 🔴 Unresolved |
{{else}}
✅ No active blockers
{{/if}}

---

## 📈 Velocity & Timeline

**Current Velocity:** {{VELOCITY}} points/day
**Average Velocity:** {{AVG_VELOCITY}} points/day
**Velocity Trend:** {{TREND}} ({{TREND_PCT}}%)

**Projected Completion:** {{PROJECTED_DATE}}
**Target Completion:** {{TARGET_DATE}}
**Timeline Status:** {{TIMELINE_STATUS}}

---

## 🧪 Quality Metrics

| Metric         | Current                     | Target          | Status          |
| -------------- | --------------------------- | --------------- | --------------- |
| Passing Tests  | {{PASSING}}/{{TOTAL_TESTS}} | {{TOTAL_TESTS}} | {{TEST_STATUS}} |
| Linting Errors | {{LINT_ERRORS}}             | 0               | {{LINT_STATUS}} |
| Open Bugs      | {{BUGS_OPEN}}               | < 5             | {{BUG_STATUS}}  |

---

## 📊 Phase Breakdown

| Phase                  | Status      | Stories | Points | Progress |
| ---------------------- | ----------- | ------- | ------ | -------- |
| Phase 1: Foundation    | ✅ Complete | 12/12   | 47/47  | 100%     |
| Phase 2: Core Features | 🔄 Active   | 8/15    | 34/62  | 53%      |
| Phase 3: Advanced      | ⏸️ Pending  | 0/10    | 0/45   | 0%       |
| Phase 4: Polish        | ⏸️ Pending  | 0/8     | 0/31   | 0%       |

---

## 🔗 Quick Links

- **[Current Phase Plan](../phases/phase-2.md)**
- **[Detailed Status](current-status.md)**
- **[Completed Work](completed.md)**
- **[Blockers](blockers.md)**

---

**💡 Tip:** Auto-updated by `/execute-work` — refresh to see latest progress.
**Last Auto-Update:** {{LAST_UPDATE_COMMAND}} at {{LAST_UPDATE_TIME}}
```

---

## Auto-Update Triggers

During `/execute-work`:

| Event           | Dashboard sections updated                                             |
| --------------- | ---------------------------------------------------------------------- |
| Story started   | Currently Working On                                                   |
| Story completed | Today's Progress, Recently Completed, Current Phase, Story Points Done |
| Tests run       | Quality Metrics                                                        |
| Phase completed | Phase Breakdown (advance to next phase)                                |
| Bug fixed       | Active Blockers                                                        |

Full event mapping + update logic: `execute-work-dashboard-events.md` + `execute-work-dashboard-mechanics.md`.

### Update Procedure (summary)

1. Calculate new metrics (overall %, phase %, today's points, velocity).
2. Read current DASHBOARD.md.
3. Replace only the sections affected by the triggering event.
4. Write DASHBOARD.md.
5. Append timestamp footer: `_Auto-updated by /execute-work story US-007 at 2026-04-14 16:45:32_`

---

## File Size Guidelines

| File              | Target      | Update Frequency          |
| ----------------- | ----------- | ------------------------- |
| DASHBOARD.md      | < 200 lines | Real-time (every event)   |
| daily-summary.md  | < 150 lines | Real-time, archived daily |
| weekly-report.md  | < 200 lines | Weekly                    |
| current-status.md | < 400 lines | Daily or on-demand        |
| completed.md      | Unlimited   | Append-only log           |
| blockers.md       | < 100 lines | When blockers change      |

---

## Integration with /execute-work

Sequence during a story run:

1. `TodoWrite` creates tasks.
2. Implementation starts → update `DASHBOARD.md` (Currently Working On) and `daily-summary.md` (In Progress).
3. Tests run → update `DASHBOARD.md` (Quality Metrics).
4. Story completes → update `DASHBOARD.md` (Today's Progress, Recently Completed, progress %), `daily-summary.md` (move to Completed), `completed.md` (append entry).
5. Phase completes → update `DASHBOARD.md` (Phase Breakdown), generate `weekly-report.md` if end of week.

---

## Benefits

**For users:** open DASHBOARD.md; no command needed.
**For AI:** small focused files (< 200 lines each), read only what's relevant.
**For stakeholders:** weekly reports ready, real-time visibility, no status meetings.

---

## Backward Compatibility

Projects without `DASHBOARD.md` still work — the older progress files keep being updated.

---

**Version:** 2.0.0 (split from original combined module)
**Last Updated:** 2026-04-21
**Related:** `execute-work-dashboard-events.md`, `execute-work-dashboard-mechanics.md`
