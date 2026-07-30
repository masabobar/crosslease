---
name: execute-work
description: Implement one Jira unit (FE sub-task, story, or bug) end to end — plan mode, gated implementation, commit, journal entry
---

# Execute Work

Implement a single unit of work end to end: **resolve → plan → implement → gate → commit → journal.**

**Scope lives in Jira (PRD1042).** There is no local backlog and no phase files — `.project-management/`
holds only `input/open-questions.md`, `output/progress/DASHBOARD.md`, and `rules/`. Pull requirement text
with `/jira-sync`.

---

## Usage

```bash
/execute-work PRD1042-1556      # FE sub-task — the usual unit
/execute-work PRD1042-1158      # Story — resolves to its `FE ` sub-task
/execute-work PRD1042-1651      # Bug — takes the bug-fix branch at STEP 3
```

Runs **in-line** and pauses once, for plan approval. There are no mode flags: one execution path, one
progress artifact. To run several units, invoke once per unit and `/clear` between them — a fresh
invocation is the context reset.

---

## 🔧 CRITICAL RULES

Read before implementing. The canonical index with triggers is `.claude/rules/README.md`; this is the
per-stage subset.

**Always:**

- `CLAUDE.md` — core standards, code conventions, the MUST NOT DO list
- `.claude/rules/code-quality.md` — SOLID & DRY (mandatory)
- `.claude/rules/testing.md` — unit tests only; E2E is QA's; no coverage threshold
- `.claude/rules/stack-specific.md` — React 19 + Vite patterns (no loaders, no manual memoization)
- `.claude/rules/api-error-display.md` — every mutation has `onError`, every foreground query an `isError` branch (**fix-on-encounter**)
- `.claude/rules/error-handling-and-logging.md` — `ApiError.code`, never swallow, no `console.*` / PII
- `.claude/rules/code-review.md` — the gate STEP 4 runs
- `.claude/rules/browser-verification.md` — exercise the change in a real browser before handoff
- `.claude/rules/git.md` — conventional commits, Jira ticket, **NO AI credits**

**Frontend story (any new screen or component):**

- `.claude/rules/api-first.md` — Phase A contract verification before any code; gaps block
- `.claude/rules/design-first.md` — Figma URL required per screen (Phase A) and per new `.tsx` (Phase B)
- `.claude/rules/screen-driven-backlog.md` — one screen per unit; wizard is the one exception

**Conditional:**

- `.claude/rules/security-and-auth.md` — touching auth, roles, or user data
- `.claude/rules/enums-and-constants.md` — an enum-like value crosses the wire
- `.claude/rules/anonymization.md` — writing an artifact that may carry input-document content

---

## STEP 1 — Resolve the unit

Fetch the issue and branch on `issuetype.name`:

| Type            | Action                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| **Sub-task**    | The unit. Its parent holds the acceptance criteria — read both.         |
| **Story**       | Resolve its `FE ` sub-task and use that; say which key you resolved to. |
| **Bug**         | The unit. Take the bug-fix branch at STEP 3.                            |
| **Epic / Task** | Too coarse. Run `/jira-sync <KEY>` and pick a child unit.               |

**Check for a governing CR.** Standalone CR Tasks are not epic children and can silently supersede the
epic's scope. Search before planning — and try both spellings of the module name:

```
project = PRD1042 AND summary ~ "CR Part 2" AND summary ~ "<MODULE>"
```

Then sync per CLAUDE.md §WORKFLOW step -1: `git checkout develop && git pull origin develop`, create a
`feat/*` or `fix/*` branch, and `git pull origin develop` in `../refinext-api` so source-level BE reads
are current.

---

## STEP 2 — Plan mode (MANDATORY)

Full workflow: **`modules/execute-work-plan-mode.md`**. It covers the context read list, the two Phase A
gates (`api-first.md` contract + `design-first.md` design), the plan template, and approval.

No implementation before the plan is approved. If either Phase A gate fails, the unit is **Blocked** —
file the gap in `.project-management/input/open-questions.md`, open the backend or design work in Jira,
and do not exit plan mode for it. Never stub a screen against an imagined contract.

---

## STEP 3 — Implement

Break the work down with **TodoWrite**, then per task: mark `in_progress` → **Read the existing files**
(never skip) → implement → mark `completed`.

Non-negotiables: follow the surrounding patterns; no over-engineering; no unrequested features; no
speculative abstractions. Touch only what the unit requires — if you spot unrelated problems, **mention
them, don't fix them silently**.

Tests go in `src/__tests__/`, mirroring the source tree, using `@/` imports. New Zod schemas, store
actions, and `src/lib/` utilities each need tests. Do not write component tests or Playwright specs.

**i18n:** every user-visible string through `t()`, keys added to **both** `en/<feature>.json` and
`de/<feature>.json`. A new namespace also needs registering in `i18n/types.d.ts` and `i18n/config.ts`.

**Bug-fix branch:** reproduce first, find the root cause, then fix. Add a regression test that fails
without the fix. Fix the cause, not the symptom.

---

## STEP 4 — Quality gates

Full checklist and fix loop: **`modules/execute-work-quality-gates.md`**.

In short — the unit is not done until `pnpm test:run`, `pnpm type-check`, `pnpm lint` and
`node scripts/check-project-invariants.js` are clean, `/code-review` shows no outstanding Critical or
High findings, and the change has been **exercised in a real browser** per `browser-verification.md`.

---

## STEP 5 — Commit

**Ask for the Jira ticket number first — mandatory, every time:**

```
What is the Jira ticket number for this commit? (or reply #no-ticket)
```

Stage explicitly — `git add <files>`. **Never `git add .` or `git add -A`** (CLAUDE.md MUST NOT DO).

The header is a single line, max 150 chars, ending in the ticket or `#no-ticket`:

```
fix: stop the FA wizard orphaning drafts when a document fails to attach #PRD1042-1651
```

A body is optional and explains **why**, not what. Cite a `US-XX.XX` reference only if one actually came
up in this conversation — per `.claude/rules/git.md`, ask rather than guess, and omit rather than invent.
No test counts, no coverage, and **no AI attribution of any kind**.

Pre-commit runs lint-staged, the forbidden-code scan, and type-check; commit-msg runs commitlint;
pre-push runs the full suite. If a hook rejects the commit, fix the cause — never bypass it.

---

## STEP 6 — Journal entry

`DASHBOARD.md` is a **decision journal**, not a metrics report. Its own header is binding:

> Never hand-copy a number into this file.

So: append prose to today's `## 📅 Today's Progress (YYYY-MM-DD)` section — what was done, why, and what
it revealed. Update **Current focus** at the top, and **⚠️ Active Blockers** if this unit opened or closed
one. Leave counts where they are computed: statuses in Jira, tests in `pnpm test:run`, gaps in
`open-questions.md`, bugs in Jira.

A DASHBOARD write failure never blocks the unit — note it and move on.

---

## STEP 7 — Completion report

Report what actually happened, in plain prose:

- what shipped, and anything deliberately left out, with the reason
- gate results as observed — the real test output, the browser check, and **the role you signed in as**
- the commit hash and branch
- anything that turned up for `open-questions.md` or a new Jira ticket
- next action — usually `/jira-handoff` to move the ticket to `QA ready`

Never report a pass you did not observe. "Could not verify — no local data for a suspended agreement" is
a useful result; a fabricated ✅ is worse than no check at all.

---

## Related

- `modules/execute-work-plan-mode.md` — STEP 2 in full (context, Phase A gates, plan template)
- `modules/execute-work-quality-gates.md` — STEP 4 in full (checks, fix loop, review, browser)
- `.claude/rules/README.md` — the rule index with per-task triggers
- `/jira-sync` — read-only briefing on the unit · `/jira-handoff` — transition to `QA ready`
- `/bug-sweep` — find and fix actionable Jira bugs · `/code-review` — the per-commit diff gate

---

**Version:** 4.0.0
**Updated:** 2026-07-30 (4.0.0 — rewritten for the Jira-only, phase-file-free project: execution and
tracking modes removed, sub-agent dispatch dropped, DASHBOARD reframed as a journal, `design-first` and
invariants gates added, `git add .` and the un-ticketed commit template corrected)
