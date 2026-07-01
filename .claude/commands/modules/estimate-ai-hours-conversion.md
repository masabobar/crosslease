# Estimate AI Hours — Conversion Module

**Purpose:** The math behind `/estimate-ai-hours`. Story points → team-hours → AI-hours, plus the override knobs and calibration guidance.

**Parent:** `.claude/commands/estimate-ai-hours.md`

---

## Step A — Story points → human-team hours

**Source of truth:** `.project-management/input/backlog/README.md` §"Story Point Reference"

That section defines bands (e.g. `5 points: 1-2 days`). This module picks the **mid-band** of each, assuming an 8-hour working day.

| Points | Band (from backlog README) | Mid-band team-hours                     |
| ------ | -------------------------- | --------------------------------------- |
| 1      | < 2 hours                  | **1.5**                                 |
| 2      | 2–4 hours                  | **3**                                   |
| 3      | half day                   | **4**                                   |
| 5      | 1–2 days                   | **12**                                  |
| 8      | 2–4 days                   | **24**                                  |
| 13     | 1 week                     | **40**                                  |
| 21+    | break down further         | **64** (placeholder, flagged in report) |

**Stories of 21+ points are listed under `Stories flagged for breakdown` in the report.** The 64h figure is a deliberate over-estimate that signals "this is unmodeled" — not an honest number.

**Override:** Pass `--hours-per-point="1=2,2=4,3=6,5=14,8=30,13=50"` to substitute the entire mapping. Any point value not listed falls back to the default.

---

## Step B — Team-hours → AI rapid-development hours

```
ai_hours = team_hours × SPEED_FACTOR × OVERHEAD_FACTOR
```

### SPEED_FACTOR (default: 0.25)

How much faster Claude Code is than a human team **on focused implementation work against an existing spec**.

- `0.25` (default, conservative) — Claude is 4× faster. Plenty of margin for unexpected complexity.
- `0.20` — Claude is 5× faster. Use when the spec is unusually clean and the codebase is well-understood.
- `0.33` — Claude is 3× faster. Use when the domain is unfamiliar, or when a lot of design decisions still have to be made during implementation.
- `0.50` — Claude is 2× faster. Use when treating "AI assists a human" rather than "AI runs autonomously".

The 3–6× band is the realistic range for autonomous Claude. Picking the conservative end (4×) keeps the headline number defensible in a client conversation.

### OVERHEAD_FACTOR (default: 1.20)

What Step A doesn't capture: plan-mode rounds, verification per `superpowers:verification-before-completion`, test runs, code-review iterations per `.claude/rules/testing.md`, the occasional rework cycle.

- `1.20` (default) — adds 20%. Honest baseline for a project that follows the framework rules.
- `1.10` — short overhead. Use only when the work is mostly mechanical (renames, doc-only changes, typed config updates).
- `1.40` — heavy overhead. Use when you expect significant client clarification or a high test bar.

### Combined default: `× 0.30`

`0.25 × 1.20 = 0.30` — every team-hour is **0.30 AI-hours** by default. So a 100-team-hour phase ≈ 30 AI-hours of agent runtime.

### WALL_CLOCK_DIVISOR (default: 1.0)

24/7 wall-clock equals AI-hours by definition.

- `1.0` — agent runs continuously.
- `3.0` — agent runs ~8h/day supervised. Wall-clock days = `ai_hours / 8`.

Used only for the "if start now → finish ~YYYY-MM-DD" projection at the bottom of the report.

---

## CLI override flags

| Flag                                | Default  | Purpose                            |
| ----------------------------------- | -------- | ---------------------------------- |
| `--speed=<float>`                   | `0.25`   | Override SPEED_FACTOR              |
| `--overhead=<float>`                | `1.20`   | Override OVERHEAD_FACTOR           |
| `--wall-clock=<float>`              | `1.0`    | Override WALL_CLOCK_DIVISOR        |
| `--hours-per-point=<k=v,...>`       | mid-band | Custom SP→hours mapping            |
| `--phase=<N>`                       | all      | Restrict report to one phase       |
| `--breakdown=phase\|priority\|both` | `both`   | Which breakdown sections to render |

The actual factors used **must always be printed in the report header** (`Conversion: speed=… · overhead=… · hours/pt=…`). The user must always be able to see what assumptions produced the number.

---

## Calibration after Phase 1

The defaults are an opinion, not a measurement. Once Phase 1 is `Completed`:

1. Read `output/phases/phase-1.md` for the planned points.
2. Read git log / completion timestamps for actual elapsed AI-time (sum of session durations where Claude actively worked, **not** wall-clock including idle gaps).
3. Compute `actual_factor = actual_ai_hours / (planned_team_hours × 1.20)`.
4. If `actual_factor` is materially different from `0.25` (say, > ±0.05), adopt it as the new `SPEED_FACTOR` for subsequent phases. Document the change in `.project-management/output/progress/phase-1-progress.md` so future estimates stay honest.

**Example:** Phase 1 planned at 37 points → ~100 team-hours → expected ~30 AI-hours at default. Actual elapsed = 22 AI-hours. Implied speed = `22 / (100 × 1.20) = 0.183` → call it `0.20`. Re-run `/estimate-ai-hours --speed=0.20` for the rest of the project; numbers tighten.

The conversion module is intentionally a **single source for tuning**. If the formula needs to change project-wide, change it here, not in three places.

---

## Worked example (current repo, default factors)

Backlog totals from `input/backlog/README.md`: 134 points.

| Phase     | Points  | Team-hours (Step A) | AI-hours (× 0.30) |
| --------- | ------- | ------------------- | ----------------- |
| 1         | 37      | 100                 | 30                |
| 2         | 56      | 148                 | 44                |
| 3         | 21      | 60                  | 18                |
| 4         | 20      | 51                  | 15                |
| **Total** | **134** | **359**             | **~108**          |

Wall-clock at `--wall-clock=1.0`: ~108 hours = **~4.5 days continuous**.

If `Done = 0` (Mode A, post-`/process-client-docs`), this is the headline estimate.

---

[← Back to estimate-ai-hours.md](../estimate-ai-hours.md)
