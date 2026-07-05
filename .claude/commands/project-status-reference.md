# Project Status — Reference

Companion to `project-status.md`. Holds the full report template, status-indicator definitions, metric formulas, and example output.

---

## Status Indicators

**Overall status:**

- 🟢 **On Track** — meeting deadlines, good velocity, no major blockers.
- 🟡 **At Risk** — some delays, velocity decreasing, blockers present.
- 🔴 **Delayed** — behind schedule, multiple blockers, needs intervention.

**Timeline formula:**

```
If (Days Remaining > Estimated Days Needed) → On Track
Else If (Days Remaining > 80% of Estimated)  → At Risk
Else                                          → Delayed
```

---

## Full Report Template

Emitted by STEP 3 of `/project-status`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROJECT STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Generated:** {{DATE}}
**Project:** {{PROJECT_NAME}}
**Current Phase:** Phase {{N}} — {{PHASE_NAME}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 EXECUTIVE SUMMARY

**Overall Status:** {{🟢 On Track | 🟡 At Risk | 🔴 Delayed}}

**Key Metrics:**
- Overall Completion: {{XX}}%
- Phase {{N}} Progress: {{YY}}%
- Velocity: {{Z}} points/week
- Tests: {{passing}}/{{test_count}} passing
- Quality: {{🟢🟡🔴}} {{bug_count}} bugs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📅 CURRENT PHASE STATUS

**Phase {{N}}: {{PHASE_NAME}}**

Progress: [████████████░░░░░░░░] {{percentage}}%

- Started: {{START_DATE}}
- Expected End: {{END_DATE}}
- Status: {{🟢 / 🟡 / 🔴}}

**Completed:** {{completed_stories}} / {{total_stories}} stories
**Story Points:** {{completed_points}} / {{total_points}}

**Current Week:**
- Working on: {{CURRENT_STORIES}}
- Completed this week: {{WEEKLY_COMPLETED}}
- Blocked: {{BLOCKED_COUNT}} stories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📈 OVERALL PROJECT PROGRESS

**All phases:**
{{For each phase:}}
- Phase {{N}}: [███░░░░░] {{percentage}}% ({{status}})

**Timeline:**
- Project Start: {{START_DATE}}
- Target Launch: {{LAUNCH_DATE}}
- Days Elapsed: {{ELAPSED_DAYS}}
- Days Remaining: {{REMAINING_DAYS}}
- On Schedule: {{✅ / ⚠️ / ❌}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ COMPLETED WORK (recent)

**Last 7 days:**
- ✅ US-XXX: {{story_title}} ({{points}} pts)
- ✅ US-YYY: {{story_title}} ({{points}} pts)

**Key achievements:**
- {{achievement_1}}
- {{achievement_2}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔴 BLOCKERS & RISKS

**Active blockers:** {{blocker_count}}
- 🔴 {{blocker_1}} (Impact: High/Medium/Low)
- 🔴 {{blocker_2}} (Impact: High/Medium/Low)

**Risks:**
- ⚠️  {{risk_1}} (Probability: High/Medium/Low)
- ⚠️  {{risk_2}} (Probability: High/Medium/Low)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🧪 QUALITY METRICS

**Testing:**
- Total Tests: {{test_count}} ({{passing}} passing / {{failing}} failing)
- Required Tests: {{✅ new schemas/stores/utils covered / ⚠️ gaps}}
- Error-Code Keys: {{✅ complete / ⚠️ missing}}

**Code Quality:**
- SOLID & DRY: {{✅ compliant / ⚠️ issues}}
- Linting Errors: {{error_count}}
- Tech Debt: {{debt_count}} items

**Bugs:**
- Open: {{open_bugs}} (🔴 {{critical}} / 🟠 {{high}} / 🟡 {{medium}} / 🟢 {{low}})
- Fixed this week: {{fixed_week}}
- Fixed this month: {{fixed_month}}
- Bug rate: {{rate}} bugs/story
- Source: `output/bugs/bug-roadmap.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 VELOCITY & TRENDS

**Velocity (points/week):**
- Current: {{current_velocity}}
- Average: {{avg_velocity}}
- Trend: {{↑ increasing / → stable / ↓ decreasing}}

**Completion rate:**
- Stories/week: {{stories_per_week}}
- Estimated completion: {{estimated_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 NEXT STEPS

**Immediate (this week):**
1. {{next_task_1}}
2. {{next_task_2}}
3. {{next_task_3}}

**Upcoming (next week):**
1. {{upcoming_task_1}}
2. {{upcoming_task_2}}

**Phase {{N+1}} preview:**
- Start Date: {{next_phase_start}}
- Focus: {{next_phase_focus}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💡 RECOMMENDATIONS

- ✅ {{recommendation_1}}
- ⚠️  {{recommendation_2}}
- 🔴 {{critical_action_needed}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Metric Formulas

| Metric               | Formula                                      |
| -------------------- | -------------------------------------------- |
| Completion %         | `(completed_points / total_points) * 100`    |
| Phase %              | `(phase_completed / phase_total) * 100`      |
| Velocity             | `completed_points / weeks_elapsed`           |
| Estimated completion | `today + (remaining_points / velocity) days` |
| Bug rate             | `total_bugs_open / total_stories`            |
| Timeline status      | see formula at the top of this file          |

Round percentages to the nearest whole number. Clamp velocity to a minimum of 0.1 to avoid ∞ ETAs.

---

## Quality Checks (before emitting report)

- [ ] All phase files read (or DASHBOARD.md consulted)
- [ ] Progress files analyzed
- [ ] Metrics calculated correctly (sums match)
- [ ] Trends identified from velocity history
- [ ] Recommendations grounded in data (not generic advice)

---

## Example Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROJECT STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: 2026-03-27
Project:   E-Commerce Platform
Current:   Phase 2 — Core Features

## 🎯 EXECUTIVE SUMMARY
Overall Status: 🟢 On Track

- Overall Completion: 45%
- Phase 2 Progress:   60%
- Velocity:           25 pts/week
- Tests:              156/156 passing
- Quality:            🟢 3 bugs

[... detailed sections ...]

🎯 NEXT STEPS:
1. Complete US-045 (user profile)
2. Start US-046 (payment integration)
3. Review Phase 3 backlog
```

---

## Performance Notes

- **With DASHBOARD.md:** ~550 tokens (extract pre-calculated metrics).
- **Without DASHBOARD.md (legacy):** ~2,400 tokens (calculate from scratch).
- **Token savings:** 60-70% on modular projects.

See `modules/live-progress-dashboard.md` + `execute-work-dashboard-events.md` for how DASHBOARD.md stays current.

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `project-status.md`)
