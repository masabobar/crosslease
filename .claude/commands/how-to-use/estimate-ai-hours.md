# Estimate AI Hours - Quick Guide

**Use when:** Need a single number for "how many AI-agent hours to finish the backlog?"
**Command:** `/estimate-ai-hours`
**Time:** ~30 seconds
**Output:** Effort summary in story points · team-hours · AI-hours, with wall-clock projection

**All documentation is in English only.**

---

## 🎯 What It Shows

- ✅ Total scope, Done, Remaining — in **story points**
- ✅ Same totals converted to **team-hours** (mid-band of the standard story-point scale)
- ✅ Same totals converted to **AI rapid-development hours** (24/7 Claude agent)
- ✅ Per-phase and per-priority breakdown
- ✅ Wall-clock projection: "If start now → finish ~YYYY-MM-DD"
- ✅ Stories of 21+ points flagged for breakdown
- ✅ Stories missing `**Estimate:**` listed (no silent drops)

---

## 📋 Command Format

```bash
/estimate-ai-hours
/estimate-ai-hours --phase=2
/estimate-ai-hours --breakdown=priority
/estimate-ai-hours --speed=0.30 --overhead=1.15
/estimate-ai-hours --hours-per-point="1=2,5=14,8=30"
```

**Defaults:** `speed=0.25` · `overhead=1.20` · `wall-clock=1.0` · mid-band SP→hours table.
**Combined effect:** every team-hour ≈ 0.30 AI-hours.

---

## 🕐 When to Run It

**Run #1 — right after `/process-client-docs` (primary use case):**
Backlog has just been generated. `DASHBOARD.md` is still the placeholder, `output/phases/` is empty. Mode A — "Done = 0, Remaining = full backlog". Use the headline number for client / pricing / kick-off conversations.

**Run #2+ — during development:**
DASHBOARD.md is populated (auto-updated by `/execute-work`). Mode B — Done points subtracted from total. Use to project a finish date based on what's actually left.

**Optional fallback — Mode C:**
If `output/phases/phase-N.md` has per-story `**Status:** Completed` lines but DASHBOARD.md has not been initialized yet, the command aggregates from there.

The mode is always shown in the report header — no surprises.

---

## 📊 Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI RAPID-DEVELOPMENT ESTIMATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: 2026-05-06
Mode: A — Initial estimate (no execution data yet)
Source: input/backlog/ only
Conversion: speed=0.25 · overhead=1.20 · hours/pt=mid-band · wall-clock=1.0

OVERALL
  Total scope:     134 points  (~359 team-hours, ~108 AI-hours)
  Done:              0 points  (~  0 team-hours, ~  0 AI-hours)
  Remaining:       134 points  (~359 team-hours, ~108 AI-hours)
  Progress:          0%

PER PHASE
  Phase 1 — Foundation     ⏳  0/37 pts  (0%)   — ~30 AI-hours left
  Phase 2 — Core           ⏳  0/56 pts  (0%)   — ~44 AI-hours left
  Phase 3 — Advanced       ⏳  0/21 pts  (0%)   — ~18 AI-hours left
  Phase 4 — Polish         ⏳  0/20 pts  (0%)   — ~15 AI-hours left

PER PRIORITY (remaining only)
  P0   87 pts → ~72 AI-hours
  P1   29 pts → ~21 AI-hours
  P2   18 pts → ~14 AI-hours

WALL-CLOCK PROJECTION
  Remaining: 108 AI-hours = ~4.5 days continuous (wall-clock=1.0)
  If start now (2026-05-06): finish ~2026-05-10

NOTES
  · Stories flagged for breakdown (≥21 pts): none
  · Stories without estimate: none
  · Override defaults: /estimate-ai-hours --speed=0.30 --overhead=1.15
  · Tune SPEED_FACTOR after Phase 1 completes — see modules/estimate-ai-hours-conversion.md §Calibration.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Common Issues

| Issue                          | Solution                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `input/backlog/` not found     | Run `/process-client-docs` first                                                              |
| Number feels too low           | Bump `--speed=0.33` (3× faster instead of 4×) and `--overhead=1.30`                           |
| Number feels too high          | After Phase 1 completes, calibrate per `modules/estimate-ai-hours-conversion.md` §Calibration |
| Some stories missing estimates | They show up under `Stories without estimate` in NOTES — fix in `input/backlog/phase-*.md`    |
| Stories ≥21 pts                | Listed under `Stories flagged for breakdown` — split via `/add-scope`                         |

---

## 📚 Full Documentation

This is a quick guide.

- Full command: `.claude/commands/estimate-ai-hours.md`
- Conversion math: `.claude/commands/modules/estimate-ai-hours-conversion.md`

Includes:

- Detection logic for Mode A / B / C
- Story-parsing regex patterns
- Calibration procedure for SPEED_FACTOR after Phase 1
