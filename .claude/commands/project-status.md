---
name: project-status
description: Generate comprehensive project status report showing progress, completed work, blockers, and next steps
---

# Project Status

**📖 Quick Start:** See [how-to-use/project-status.md](./how-to-use/project-status.md) for quick guide (~80 lines)

Generate a comprehensive overview of the current project status — metrics, progress, blockers, recommendations.

---

## Usage

```bash
/project-status
```

No arguments. Detects project structure automatically and reads only what it needs.

---

## 📋 YOUR TASK

**🔧 REFERENCE** — quality metrics calculated per:

- `.claude/rules/testing.md` — coverage targets, API status-code requirements
- `.claude/rules/code-quality.md` — SOLID & DRY compliance

---

### STEP 1 — Detect structure & read files

**📖 See:** `modules/project-status-data-collection.md` for the full read list.

**1A. Detect structure:**

```
if exists(".project-management/input/backlog/README.md"):
    structure_type = "modular"
else if exists(".project-management/input/backlog.md"):
    structure_type = "monolithic"
```

**1B. Prefer DASHBOARD.md when available (fast path):**
If `output/progress/DASHBOARD.md` exists, it has pre-calculated metrics (overall %, phase %, velocity, blockers, coverage, timeline). Read it first and only fall through to raw files for details it doesn't cover (e.g. recent commit hashes, detailed bug breakdown). ~60-70% token savings.

**1C. Additional reads (as needed):**

- `input/scope.md` — for project name/vision
- `input/backlog/README.md` (modular) or `input/backlog.md` (legacy) — summary stats
- `output/phases/phase-*.md` — phase details
- `output/progress/current-status.md`, `completed.md`, `blockers.md`
- `output/bugs/bug-roadmap.md`, `bug-archive.md`

---

### STEP 2 — Calculate or extract metrics

**📖 See:** `modules/project-status-calculation.md` for full formulas.

If DASHBOARD.md exists, extract; otherwise compute:

- **Overall completion %** = `(completed_points / total_points) * 100`
- **Phase progress %** = `(phase_completed / phase_total) * 100`
- **Velocity** = `completed_points / weeks_elapsed`
- **Timeline status** — on track / at risk / delayed (see formula in `project-status-reference.md`)
- **Bug counts** by severity (from `bug-roadmap.md`)
- **Fixed bugs** last 7 / 30 days (from `bug-archive.md`)
- **Bug rate** = `bugs / total_stories`
- **Coverage**, **lint**, **tech debt** — from quality sources

---

### STEP 3 — Generate the report

Emit the standard report template (full block in `project-status-reference.md`):

1. **Executive Summary** — overall status + 5 key metrics.
2. **Current Phase Status** — phase progress bar, dates, currently-working-on, blockers.
3. **Overall Project Progress** — all phases + timeline.
4. **Completed Work (last 7 days)** + key achievements.
5. **Blockers & Risks** — active blockers with impact, risks with probability.
6. **Quality Metrics** — testing, code quality, bugs by severity.
7. **Velocity & Trends** — current / average / direction + estimated completion.
8. **Next Steps** — immediate, upcoming, next-phase preview.
9. **Recommendations** — data-driven actions.

Use status indicators: 🟢 On Track / 🟡 At Risk / 🔴 Delayed (definitions in `project-status-reference.md`).

---

## 📚 Module References

| Module                                      | Covers                                        |
| ------------------------------------------- | --------------------------------------------- |
| `modules/project-status-data-collection.md` | STEP 1 file reads + DASHBOARD.md optimization |
| `modules/project-status-calculation.md`     | STEP 2 metric formulas                        |
| `project-status-reference.md`               | Report template, status definitions, examples |

---

## Backward Compatibility

Auto-detects modular vs monolithic backlog and DASHBOARD.md presence. No user action.

- **Modular + DASHBOARD.md** — fast path, ~550 tokens
- **Modular, no DASHBOARD.md** — calculates from phase + README
- **Monolithic (legacy)** — calculates from `backlog.md`, still fully functional; consider `/migrate-to-modular`

---

**Version:** 3.3.0
**Created:** 2026-03-27
**Updated:** 2026-04-21 (split: template + details moved to project-status-reference.md)
**Command Type:** Reporting & Analytics
