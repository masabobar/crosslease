---
name: execute-work
description: Execute a phase, epic, or story with automatic planning, implementation, testing, and progress tracking
---

# Execute Work Command

**📖 Quick Start:** See [how-to-use/execute-work.md](./how-to-use/execute-work.md) for quick guide (~150 lines)

Execute implementation of a phase, epic, or individual story with full automation.

---

## Usage

```bash
/execute-work phase N          # Execute entire Phase N
/execute-work epic EPIC-X      # Execute Epic X
/execute-work story US-XXX     # Execute single story US-XXX
/execute-work bug BUG-XXX      # Execute bug fix for BUG-XXX
```

**Optional:** pass mode preferences inline to skip the prompt (positional digits OR named flags; see STEP 0 for the full mapping):

```bash
/execute-work story US-MOB-023 1 2                              # Continuous + Complete
/execute-work phase 1 --mode=continuous --tracking=phase-only   # named flags
/execute-work epic EPIC-3 2                                     # Paused; will ask for tracking
```

---

## 📋 YOUR TASK — MANDATORY WORKFLOW

**🔧 CRITICAL RULES** — read before any implementation. Grouped by stage; conditional rules in italics:

**Always (every story / bug):**

- `.claude/rules/code-quality.md` — SOLID & DRY (mandatory)
- `.claude/rules/testing.md` — Testing requirements, API status matrix (200/400/401/403/404/500), coverage targets
- `.claude/rules/git.md` — Commit format (NO AI credits), conventional commits
- `.claude/rules/stack-specific.md` — Middleware, response envelope, Zod env schema, performance patterns
- `.claude/rules/documentation-templates.md` — Templates for user stories, tasks, bugs, endpoint docs
- `CLAUDE.md` — Core standards and workflow

**For any handler / service / API change** (HTTP endpoint touched):

- `.claude/rules/api-documentation.md` — Schema validation in code + matching docs (STRICT public, SOFT `@internal`)
- `.claude/rules/api-versioning.md` — `/api/v{N}/` versioning + mandatory change-propagation (docs, schemas, ALL related tests, consumer code in same PR)
- `.claude/rules/error-handling-and-logging.md` — Typed errors at single boundary, canonical envelope, `SCREAMING_SNAKE_CASE` codes, structured logging, NO PII / secrets in logs
- `.claude/rules/security-and-auth.md` — Default-deny middleware (requireAuth/requireRole), resource-level (IDOR), bcrypt, cookie session config, security headers, audit log

**For data model / DB change:**

- `.claude/rules/database.md` — Migration-based workflow (Prisma `migrate`, never `db push` in prod)
- `.claude/rules/enums-and-constants.md` — `SCREAMING_SNAKE_CASE` wire format across DB / backend / frontend / mobile; one source of truth per enum

**For frontend (web/mobile) stories:**

- `.claude/rules/api-first.md` — Phase A contract verification before any frontend code; gaps block & file backend work
- `.claude/rules/screen-driven-backlog.md` — One screen per story (wizard exception), `**Screen:**` + `**API Endpoints Used:**` table mandatory
- _`.claude/rules/screen-inventory.md`_ — If project is web CMS / mobile / web-with-admin: screen-map refreshed on story completion (per STEP 3-A.4 / 3-B.11 below)

**For any artifact that may carry input-document content** (PRD, scope, backlog, technical spec, status reports):

- `.claude/rules/anonymization.md` — Personal names from input docs → role labels (`the PM`, `the client`, `the stakeholder`); never leak names into committed artifacts

---

### STEP 0 — Parse arguments & mode selection

**Parse the scope argument:**

- `phase N` → all epics + stories in Phase N
- `epic EPIC-X` → all stories in Epic X
- `story US-XXX` → single story
- `bug BUG-XXX` → bug fix flow

**Parse optional inline mode arguments** — both formats are supported (and may be mixed):

**Positional digits** (after the scope): `<execMode> <trackingMode>` where each digit is `1` or `2`.

```
/execute-work story US-MOB-023 1 2     # Continuous + Complete
/execute-work phase 1 1                # Continuous; tracking missing → ask
/execute-work epic EPIC-3 2 1          # Paused + Phase Only
```

**Named flags** (any position after the scope):

```
/execute-work story US-MOB-023 --mode=continuous --tracking=complete
/execute-work phase 1 --mode=c                          # alias: c|continuous, p|paused
/execute-work phase 1 --tracking=p                      # alias: p|phase-only, c|complete
/execute-work story US-XXX --mode=paused --tracking=p   # mixed forms allowed
```

**Mapping table** — values are organized by axis (the two axes are independent; the digit `1` means different things on each axis):

| Axis                                                        | Resolves to | Accepted values                 |
| ----------------------------------------------------------- | ----------- | ------------------------------- |
| Execution Mode (`--mode=` flag, or 1st positional digit)    | Continuous  | `1`, `c`, `continuous`          |
| Execution Mode                                              | Paused      | `2`, `p`, `paused`              |
| Tracking Mode (`--tracking=` flag, or 2nd positional digit) | Phase Only  | `1`, `p`, `phase`, `phase-only` |
| Tracking Mode                                               | Complete    | `2`, `c`, `complete`            |

> **Positional disambiguation:** if exactly two trailing digits are present, the first is Execution Mode and the second is Tracking Mode. If only one trailing digit is present, treat it as Execution Mode (the more user-facing choice). Named flags always take precedence over positional values when both are supplied.

> **Why `c` and `p` swap meaning per axis:** on Execution Mode, `c` = Continuous and `p` = Paused. On Tracking Mode, `c` = Complete and `p` = Phase Only. The aliases match the first letter of the resolved value on each axis. If you find this confusing, use the long form (`continuous`, `complete`) instead.

**Edge-case rules** — when input violates the format, reject and re-prompt the menu (do NOT silently guess):

| Input pattern                                         | Behavior                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| 3+ trailing digits (e.g. `1 2 1`)                     | Reject input, show usage, prompt the full menu.                                   |
| Digit not in `{1, 2}` (e.g. `0`, `3`, `9`)            | Reject input, show usage, prompt the full menu.                                   |
| `--mode=` (empty value)                               | Treat as not supplied; fall through to prompt for that mode only.                 |
| `--tracking=` (empty value)                           | Treat as not supplied; fall through to prompt for that mode only.                 |
| `--mode=foo` (unknown alias)                          | Reject input, list valid aliases for that flag, re-prompt the affected mode only. |
| `--mode=1 1` (named + positional, same axis)          | Named flag wins; positional digit ignored. Echo notes the conflict.               |
| `--mode=1 --mode=2` (duplicate named flag)            | Use the LAST occurrence; warn in echo.                                            |
| Non-digit, non-flag trailing token (e.g. `--verbose`) | Ignore unknown flags silently — they are not part of this command.                |

In all reject cases, the orchestrator surfaces the offending input verbatim so the user sees what was wrong:

```
⚠️  Invalid mode argument: "3"
    Valid: 1 (Continuous) | 2 (Paused). Falling back to interactive prompt.
```

**Prompt only for what is missing.** If both modes were supplied (positional or named), proceed silently — do **not** show the menu. If one was supplied, ask only for the other. If none were supplied, show the full menu below.

```
Execution Mode:
[1] Continuous (fresh sub-agent per story — clean context, auto-reset between stories)
[2] Paused (in-line execution — wait for approval after each story; user controls context manually)

Progress Tracking Mode:
[1] Phase Only (faster — updates only phase file)
[2] Complete (slower — updates all progress files)
```

After resolving both modes, **echo the resolved choices** so the user can spot a misparse:

```
Resolved modes:
  Execution:  Continuous (sub-agent dispatch)
  Tracking:   Complete
```

Store both choices. For trade-offs, see `execute-work-reference.md` → Execution Modes.

**Why this matters:** Continuous mode dispatches each story into a fresh sub-agent so the orchestrator never accumulates story-by-story context. The orchestrator keeps only structured summaries. This is the recommended mode for any phase/epic with 3+ stories.

---

### STEP 1 — Detect structure & enter plan mode (MANDATORY)

**1A. Detect backlog structure:**

```
if exists(".project-management/input/backlog/README.md"):
    structure_type = "modular"      # input/backlog/phase-*.md
else if exists(".project-management/input/backlog.md"):
    structure_type = "monolithic"   # input/backlog.md
```

**1B. Read context files** — see `modules/execute-work-plan-mode.md` for the full read list per structure type.

**1C. Analyze & plan** — create a detailed plan with estimates, risks, success criteria. Wait for user approval (`Yes / No / Revise`).

**1D. API contract verification (frontend stories only)** — if the story is web or mobile per `.claude/rules/screen-driven-backlog.md`, run the Phase A checklist from `.claude/rules/api-first.md` §3 _before_ exiting plan mode:

- List every screen the story touches (wizard = enumerate steps)
- For each screen, list every API endpoint it calls (method + path)
- For each endpoint, confirm doc exists, request schema covers UI inputs, response shape covers UI outputs, error states are distinguishable, auth matches
- **Result:** ✅ contract complete (proceed to STEP 2) **OR** ⚠️ gaps documented → mark story `Blocked by: <backend story/bug>`, file the backend work via `/add-scope` or bug roadmap, and **do not exit plan mode for this story**. Move on to other stories or return to user.

**For bugs:** read `output/bugs/bug-roadmap.md`, analyze affected component, plan fix with root-cause analysis + regression-test requirements.

**Output:** approved plan + detected `structure_type`.

---

### STEP 2 — Exit plan mode → implementation

```
🚀 [EXITING PLAN MODE — ENTERING IMPLEMENTATION MODE]
Execution Mode: [Continuous / Paused]
```

---

### STEP 3 — Implementation loop

**Branch by execution mode** — the per-story workflow is the same; only the dispatch wrapper differs.

#### STEP 3-A — Continuous mode (sub-agent dispatch, RECOMMENDED)

For each unit (story or bug) in scope:

1. **Display:** `🚀 Dispatching {{UNIT_ID}} in fresh sub-agent (clean context)...`
2. **Auto-update `DASHBOARD.md`** → "Currently Working On" _(modular only — orchestrator does this BEFORE dispatch so DASHBOARD reflects current work even while sub-agent runs)_.
3. **Dispatch via Agent tool** with `subagent_type="general-purpose"` and the per-unit prompt from `modules/execute-work-implementation-continuous.md` §1 (Sub-agent Prompt Template). Pass:
   - Unit ID, title, type (story | bug), phase/epic (n/a for bugs)
   - Absolute path to unit file:
     - Stories → `.project-management/output/phases/phase-N.md`
     - Bugs → `.project-management/output/bugs/bug-roadmap.md`
   - Tracking mode (Phase Only / Complete)
   - Execution context (modular vs monolithic backlog)
4. **Sub-agent executes the full per-unit workflow in its own clean context** — reads rules, implements, writes tests, runs tests (≥80% coverage, all API codes), verifies i18n + API docs + frontend contract, updates progress files, creates git commit. Returns a structured JSON summary.
5. **Orchestrator processes the response** per `modules/execute-work-implementation-continuous.md` §2:
   - Validate gate-evidence fields (`quality_gates_passed`, `frontend_contract`, `linter`, `coverage`, `commit_hash`). Re-classify as `blocked` if validation fails.
   - On validated `status: "completed"` → display unit summary block, log, proceed to next unit.
   - On `status: "blocked"` (whether sub-agent returned it or orchestrator re-classified) → reconcile DASHBOARD per `execute-work-implementation-continuous.md` §2 step 5, display blocker reason and `recommended_next`, ask user `[Continue with next unit / Skip to next epic / Abort run]`. If `recommended_next` proposes filing backend work, the **orchestrator** does it via `/add-scope` or by appending to the bug roadmap, after user confirmation — the sub-agent never files anything itself.
6. **Dispatch failure handling** — if the `Agent` tool itself errors (unknown subagent_type, tool refused, sub-agent crashed without producing JSON): fall back to STEP 3-B (in-line) for this unit, per `modules/execute-work-implementation-continuous.md` §3. After two consecutive dispatch failures, fall back for the remainder of the run.
7. **Orchestrator keeps ONLY the summary** (~1KB) — no unit-level work bleeds into the next dispatch. This is the auto-reset.

When all units in scope are dispatched and summaries collected → STEP 4.

**Event firing in Continuous mode** (clarifies who writes to DASHBOARD when):

| Event                                | Fired by                                                                 | When                                           |
| ------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------- |
| EVENT 1 — Currently Working On       | Orchestrator (step 2 above)                                              | Before each dispatch                           |
| EVENT 2 — Quality Metrics            | Sub-agent (continuous §1 STEP 7)                                         | After tests pass                               |
| EVENT 3 — Story Completed            | Sub-agent (continuous §1 STEP 8)                                         | Only on `status:"completed"`                   |
| EVENT 4 — Phase Completed            | Orchestrator                                                             | After last unit in scope, in STEP 4            |
| EVENT 5 — Bug Fixed                  | Sub-agent (continuous §1 STEP 8)                                         | Only on `status:"completed"` for bugs          |
| Reconciliation (revert "Working On") | Orchestrator (per `execute-work-implementation-continuous.md` §2 step 5) | On blocked / dispatch failure / malformed JSON |

#### STEP 3-B — Paused mode (in-line execution, manual control)

For each story/bug in scope, the orchestrator itself executes the per-story workflow (no sub-agent). This is the legacy behavior — the orchestrator's context accumulates, and the user can hit `/clear` manually between stories if needed.

Workflow per story (detailed in `modules/execute-work-implementation-paused.md`):

1. Break down with TodoWrite.
2. Auto-update `DASHBOARD.md` → "Currently Working On" _(modular only)_.
3. Read context (story from phase backlog / bug from bug-roadmap). Load all applicable rules per the CRITICAL RULES list above — `modules/execute-work-implementation-continuous.md` §1 STEP 1 enumerates the conditional reading list.
4. **For frontend (web/mobile) stories:** before implementation, re-confirm Phase A from `.claude/rules/api-first.md` is still ✅ — endpoints exist, docs match, schema covers UI inputs/outputs, error states distinguishable. If any contract gap is detected now (backend changed, doc drifted), STOP, file backend gap, mark story Blocked. Do not stub the frontend.
5. Implement following `.claude/rules/code-quality.md` (SOLID & DRY). For data-model / enum work also apply `.claude/rules/enums-and-constants.md` (SCREAMING_SNAKE_CASE wire format across DB / backend / frontend / mobile) and `.claude/rules/database.md` (migration-based workflow). For artifacts that may carry input-document content apply `.claude/rules/anonymization.md` (replace names with role labels).
6. Write tests following `.claude/rules/testing.md` (unit + integration + E2E + all API status codes 200/400/401/403/404/500).
7. Verify i18n (if `.project-management/rules/I18N-RULES.md` exists).
8. **If the story added/changed any HTTP endpoint:** run the complete API quality gate stack from `modules/execute-work-quality-gates.md`:
   - `.claude/rules/api-documentation.md` — schema validation in code, typed response, doc block per `documentation-templates.md` §2.1, drift check (STRICT for public endpoints, SOFT for `@internal`)
   - `.claude/rules/api-versioning.md` — `/api/v{N}/` path correct; if change is breaking, new major version + deprecation headers on old version; ALL tests touching this endpoint re-run and pass; Zod request + response schemas updated in same commit; consumer code (FE / mobile) updated
   - `.claude/rules/error-handling-and-logging.md` — typed errors only, canonical envelope, SCREAMING_SNAKE_CASE codes, structured logger used, redaction config covers any new sensitive keys, request_id propagated
   - `.claude/rules/security-and-auth.md` — default-deny middleware applied, resource-level/IDOR check present, no plaintext password/token in logs or fixtures, cookie config (httpOnly/secure/sameSite/secrets) correct, security headers (CSP/HSTS/…) set, audit events emitted, npm audit clean
9. **Second-to-last step:** run tests (see `modules/execute-work-quality-gates.md`); auto-update DASHBOARD "Quality Metrics".
10. **Final step:** git commit per `.claude/rules/git.md` (NO AI credits). Bug commits reference `BUG-XXX`.
11. Update progress tracking (phase file + DASHBOARD auto-update + completed.md / daily-summary.md per Complete mode). **For frontend stories (Type: Frontend) with an existing `input/screens/screen-map.md`:** invoke `/screen-map` to refresh the derived API columns + Status; drift items surface in the completion summary but do not block (per `modules/execute-work-implementation-paused.md` §3.8 and `modules/execute-work-dashboard-events.md` §3.8).
12. Pause and ask user `[Yes / No / Skip to Epic X]`.

#### Common quality gate (both modes)

Tests pass, coverage ≥ 80%, all API codes tested, i18n complete, API docs match implementation (when endpoints touched). The same gate applies whether the work is done by orchestrator (Paused) or sub-agent (Continuous).

**Auto-update triggers (modular only):** story started → Currently Working On; tests run → Quality Metrics; story completed → Today's Progress + Recently Completed + progress %; phase completed → Phase Breakdown.

Full event mapping: `modules/execute-work-dashboard-events.md` + `modules/execute-work-dashboard-mechanics.md`.

---

### STEP 4 — Completion report

When all stories in scope are done, emit the standard completion block with:

- stories completed / total, points done / total, velocity
- tests written / passing, coverage %
- SOLID & DRY compliance, lint, git conventions (all ✅)
- next steps (advance phase / continue epic / next story)

Template and full field list: `execute-work-reference.md` → Completion Report Template.

---

## 📚 Module References

| Module                                              | Covers                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `modules/execute-work-plan-mode.md`                 | STEP 1 plan mode workflow                                           |
| `modules/execute-work-implementation.md`            | Parent overview of both modes + section index                       |
| `modules/execute-work-implementation-continuous.md` | Sub-agent prompt template + orchestrator handling (Continuous mode) |
| `modules/execute-work-implementation-paused.md`     | In-line workflow §3.1–§3.10 (Paused mode)                           |
| `modules/execute-work-quality-gates.md`             | Test + coverage validation (same gates for both modes)              |
| `modules/execute-work-dashboard-events.md`          | DASHBOARD auto-update triggers                                      |
| `modules/execute-work-dashboard-mechanics.md`       | DASHBOARD update internals                                          |
| `execute-work-reference.md`                         | Modes, quality gates, error handling, examples                      |

---

## Mandatory Requirements (summary)

1. Plan mode mandatory — no implementation without approval. 2. Tests mandatory — story is not done until tests pass. 3. Coverage ≥ 80%. 4. All API status codes tested (200/400/401/403/404/500). 5. i18n if `I18N-RULES.md` exists. 6. Git conventions — NO AI credits, conventional commits. 7. SOLID & DRY per `.claude/rules/code-quality.md`. 8. TodoWrite for task breakdown.

Full quality-gate checklist + error handling: `execute-work-reference.md`. Auto-detects modular vs monolithic backlog (no user action) — see `execute-work-reference.md` → Backward Compatibility for trade-offs.

---

**Version:** 3.3.3
**Created:** 2026-03-27
**Updated:** 2026-05-11 (3.3.3 split implementation module into continuous + paused companions; CRITICAL RULES list expanded to cover v3.3 additions; screen-map refresh wired into post-completion)
**Command Type:** Implementation Automation
