# Execute Work — Implementation Loop (Continuous Mode / Sub-Agent)

**Referenced by:** `execute-work.md` STEP 3-A (Continuous mode)
**Companion:** `execute-work-implementation-paused.md` (in-line Paused mode), `execute-work-progress-updates.md` (per-mode progress-file updates)
**Parent:** `execute-work-implementation.md` (overview of both modes)

The orchestrator dispatches each story by calling the `Agent` tool with `subagent_type="general-purpose"` and the prompt below. The sub-agent executes the entire per-story workflow in its own clean context, then returns a strict JSON summary. The orchestrator keeps only the summary — no per-story work bleeds into the next dispatch. **This is the auto-context-reset mechanism.**

The same quality gates apply as in Paused mode; only the dispatch wrapper differs.

---

## §1. Prompt Template

Substitute the `{{...}}` placeholders before dispatching:

```
You are dispatched as a sub-agent to execute exactly ONE unit of work: {{UNIT_ID}}.
You have NO context from previous units — this is intentional. Treat this as a fresh session.

Unit:        {{UNIT_ID}} — {{UNIT_TITLE}}                # US-XXX or BUG-XXX
Type:        {{story | bug}}
Phase:       {{N}}                                       # for stories; "n/a" for bugs
Epic:        {{EPIC_ID}}                                  # for stories; "n/a" for bugs
Unit file:   {{ABSOLUTE_PATH_TO_UNIT_FILE}}              # stories: .project-management/output/phases/phase-N.md
                                                         # bugs:    .project-management/output/bugs/bug-roadmap.md
Tracking:    {{Phase Only | Complete}}
Backlog:     {{modular | monolithic}}
Working dir: {{CWD}}

═══════════════════════════════════════════════════════════════
AUTONOMY BOUNDARY — you may NOT do any of the following:
═══════════════════════════════════════════════════════════════

- Do NOT call slash commands (/add-scope, /add-bug, /promote-requirement,
  /execute-work, etc.). Slash commands are orchestrator-level.
- Do NOT file new backend stories or bugs yourself. On any contract gap
  per .claude/rules/api-first.md, return status:"blocked" with a clear
  recommended_next describing the backend work needed; the orchestrator
  files it.
- Do NOT ask the user questions. You cannot receive answers. If you
  need a decision, return status:"blocked" with a question in blockers.
- Do NOT modify .project-management/output/bugs/bug-roadmap.md unless
  this unit IS a bug fix (Type == "bug").
- Do NOT modify .project-management/input/backlog/* (phase backlogs).
  Story content is read-only from your perspective; only the progress
  state in phase-N.md / bug-roadmap.md / completed.md / current-status.md
  / DASHBOARD.md is yours to update per execute-work-progress-updates.md.

═══════════════════════════════════════════════════════════════
MANDATORY WORKFLOW — every step must complete before you return.
═══════════════════════════════════════════════════════════════

STEP 1 — Read context (do not skip any applicable file):

  Always:
  - {{Unit file}} — only the section for {{UNIT_ID}}
  - .claude/rules/code-quality.md
  - .claude/rules/testing.md
  - .claude/rules/git.md
  - .claude/rules/stack-specific.md
  - .claude/rules/documentation-templates.md
  - CLAUDE.md

  If unit consumes a new/changed API contract (openapi.json refreshed, BE endpoint changed):
  - .claude/rules/api-versioning.md             (FE consequence: refresh openapi.json + update feature Zod schemas + their tests together)
  - .claude/rules/error-handling-and-logging.md (canonical envelope detail.code, ApiError.code handling, never-swallow)
  - .claude/rules/security-and-auth.md          (token handling via auth store + interceptor, RBAC wire values, VITE_ env safety)

  If unit touches an enum-like wire value:
  - .claude/rules/enums-and-constants.md        (one source of truth per enum; values change in ../refinext-api/)

  If frontend story (Type: Frontend per .claude/rules/screen-driven-backlog.md):
  - .claude/rules/api-first.md                  (Phase A contract verification before any frontend code)
  - .claude/rules/screen-driven-backlog.md      (one-screen-per-story + API endpoints table)
  - .claude/rules/screen-inventory.md           (if input/screens/screen-map.md exists — derives API cols from this story's table on completion)

  If unit generates any artifact that may carry input-document content
  (PRD, scope, backlog edits, status, technical spec, ADR):
  - .claude/rules/anonymization.md              (replace personal names with role labels: the PM, the client, the stakeholder)

  If i18n is in scope:
  - .project-management/rules/I18N-RULES.md     (only if file exists)

  Workflow / orchestration:
  - .claude/commands/modules/execute-work-implementation-paused.md (in-line workflow detail — same gates)
  - .claude/commands/modules/execute-work-quality-gates.md
  - .claude/commands/modules/execute-work-progress-updates.md
  - .claude/commands/modules/run-tests-framework-commands.md (for project test commands)

STEP 2 — Plan with TodoWrite (mirror the in-line §3.1 list — implement, test, i18n, run tests, commit, progress).

STEP 3 — Implement all tasks of {{UNIT_ID}} per .claude/rules/code-quality.md (SOLID & DRY).

STEP 4 — Write tests per .claude/rules/testing.md:
  - Unit tests for every new Zod schema (rejection cases), store action, and src/lib utility
  - No Playwright specs (E2E is QA-owned) and no component tests
  - For bugs: include a regression test that fails without the fix and passes with it.

STEP 5 — Verify i18n (only if I18N-RULES.md exists).

STEP 6 — If unit touched any HTTP endpoint: run api-documentation.md gate
  (schema validation in code, typed response, doc block, no drift between code/docs/tests).

STEP 7 — Run tests using project-detected commands per
  .claude/commands/modules/run-tests-framework-commands.md
  (auto-detect package manager from lockfile: pnpm-lock.yaml → pnpm,
  yarn.lock → yarn, bun.lockb → bun, otherwise npm).
  Required gates:
    - All unit tests pass (pnpm test:run) + type-check clean
    - New Zod schemas / store actions / utilities each have tests (behavior-based per .claude/rules/testing.md)
    - Linter clean (no errors)
  If anything fails: fix → re-run. Loop until all gates pass OR you hit a true blocker.

STEP 8 — Update progress files per execute-work-progress-updates.md and tracking mode "{{Tracking}}":
  - For STORIES (Type == "story"):
      Phase Only: phase-N.md only
      Complete:   phase-N.md + completed.md + current-status.md (+ velocity recalc)
      Modular backlog: also fire DASHBOARD EVENT 3 (story completed)
        per execute-work-dashboard-events.md
  - For BUGS (Type == "bug"):
      In bug-roadmap.md: update BUG-XXX status from "Open" / "In Progress"
      to "Fixed" with commit hash + ISO date.
      Modular backlog: fire DASHBOARD EVENT 5 (bug fixed) per
        execute-work-dashboard-events.md
      Do NOT touch phase-N.md or completed.md for bug fixes (bugs are
      tracked separately).

  Screen-map refresh signal (DO NOT run /screen-map yourself):
  - If unit_type == "story" AND the story is a frontend story
    (Type: Frontend per .claude/rules/screen-driven-backlog.md)
    AND .project-management/input/screens/screen-map.md exists,
    set "screen_map_refresh_needed": true in the JSON return.
    The orchestrator (running outside the sub-agent's clean context)
    will invoke /screen-map after dispatch returns. The sub-agent
    must NOT invoke /screen-map itself.

STEP 9 — Git commit per .claude/rules/git.md:
  - Conventional commit (feat: / fix: / refactor: / test: / docs:)
  - Bug commits use "fix:" and reference BUG-XXX in the body
  - NO AI credits, NO Co-Authored-By: Claude lines

═══════════════════════════════════════════════════════════════
RETURN VALUE — strict JSON only, no surrounding prose.
═══════════════════════════════════════════════════════════════

To return status:"completed", EVERY field below must be filled with
truthful evidence. Any gate that was not met → return "blocked" instead.

On success:
{
  "unit_id":             "{{UNIT_ID}}",
  "unit_type":           "story | bug",
  "status":              "completed",
  "title":               "{{UNIT_TITLE}}",
  "points":              N,                              # n/a for bugs
  "tests":               { "passed": N, "total": N, "suites": ["unit"] },
  "required_tests":      "complete | missing",           # new Zod schemas / store actions / utilities all have tests
  "error_codes_surfaced": true | false | "not_applicable",   # every BE error code handled per api-error-display.md
  "i18n":                "complete | not_required",
  "api_docs":            "clean | not_required",
  "frontend_contract":   "verified | not_applicable",    # api-first.md Phase A status
  "linter":              "clean | warnings | not_run",
  "quality_gates_passed": ["tests","required_tests","linter","error_codes","i18n","frontend_contract"],
                         # MUST list every gate that was actually checked.
                         # Missing any required gate → status MUST be "blocked".
  "commit_hash":         "abc1234",
  "files_touched":       ["path/to/file.ts", ...],
  "duration_estimate":   "Xm",
  "screen_map_refresh_needed": true | false,    # true if frontend story AND screen-map.md exists
  "blockers":            []
}

On blocker (cannot complete despite retries):
{
  "unit_id":           "{{UNIT_ID}}",
  "unit_type":         "story | bug",
  "status":            "blocked",
  "title":             "{{UNIT_TITLE}}",
  "blockers":          ["one-line reason", "another reason"],
  "partial_state":     "what was/wasn't done; whether anything was committed",
  "recommended_next":  "<one of: 'orchestrator should file backend story for: <gap>' | 'skip and continue' | 'abort run' | 'investigate <reason>'>"
}

ENFORCEMENT:
- status:"completed" REQUIRES every quality gate evidence field set with
  truthful values. If you didn't run the linter, set "linter":"not_run"
  AND return "blocked" — do NOT claim completed.
- For frontend stories per .claude/rules/api-first.md, "frontend_contract"
  MUST be "verified" before completing. If contract gaps exist, return
  blocked with recommended_next describing the backend gap.
- NEVER commit work that fails tests.
- NEVER add AI attribution to commits.
```

---

## §2. Orchestrator Handling of the Response

After the sub-agent returns, the orchestrator MUST:

1. **Parse JSON.**
   - On parse failure → display raw output as fallback, treat as `blocked` with reason `"sub-agent returned malformed JSON"`, run reconciliation (step 5), then ask user how to proceed.
   - On Agent tool error (sub-agent crashed, dispatch refused, network failure, unknown subagent_type) → no JSON exists. Treat as `blocked` with reason `"sub-agent dispatch failed: <error>"`, run reconciliation (step 5). For repeated dispatch failures see §3.

2. **Validate gate evidence on `status: "completed"`.** Reject the success claim and re-classify as `blocked` if ANY of:
   - `quality_gates_passed` is missing or empty.
   - For frontend stories: `frontend_contract` ≠ `"verified"`.
   - For units that consumed a new/changed API contract: `error_codes_surfaced` == `false`.
   - `linter` == `"not_run"` (linter must be either `clean` or `warnings`; `not_run` is treated as gate failure).
   - `required_tests` ≠ `"complete"`.
   - `commit_hash` is missing or empty.

3. **`status: "completed"` (validated)** → display the standard unit-completion block (see `execute-work-implementation-paused.md` §3.9 template, adapted for stories vs bugs), log the summary, proceed to dispatch the next unit.

   3a. **Screen-map refresh (frontend stories).** If the sub-agent returned `"screen_map_refresh_needed": true`, the orchestrator invokes `/screen-map` (skill) BEFORE dispatching the next unit. This regenerates the API columns and Status in `input/screens/screen-map.md` from the latest stories — keeps the consolidated screen view in sync with the backlog. If `/screen-map` reports drift items in its summary, the orchestrator surfaces them in the unit-completion block but does NOT block the run.

4. **`status: "blocked"`** → display blocker reason(s) and `recommended_next`. Run reconciliation (step 5). Then ask user `[Continue with next unit / Skip to next epic / Abort run]`. If `recommended_next` proposes filing a backend story, the orchestrator (NOT the sub-agent) does so via `/add-scope` or by appending to the bug roadmap, after user confirmation.

5. **DASHBOARD reconciliation (modular backlog only).** When this story produced `blocked`, malformed JSON, or a dispatch failure:
   - Revert the "Currently Working On" entry that the orchestrator wrote in STEP 3-A.2 — either clear it or replace it with the next unit being dispatched.
   - Do NOT fire EVENT 3 / EVENT 5 (story / bug completed) — only the sub-agent fires those, and only on real success.
   - Append a one-line note to the dashboard's "Recently Completed" or "Blockers" surface so the user sees that something stopped (per execute-work-dashboard-events.md).

6. **Keep only the summary** in orchestrator memory. The sub-agent's full transcript is not retained — that IS the reset.

---

## §3. Dispatch Failure Fallback

If the `Agent` tool itself errors out (e.g., the configured `subagent_type` does not exist on this install, the tool is refused, or the sub-agent crashes immediately without producing JSON), the orchestrator should NOT abort the entire run.

Behavior:

1. On the **first** dispatch failure of a run, display once:

   ```
   ⚠️  Sub-agent dispatch failed for {{UNIT_ID}}: <error>.
   Falling back to in-line execution (Paused workflow) for this unit only.
   If failures continue, the orchestrator will fall back for the rest of the run.
   ```

   Then execute `execute-work-implementation-paused.md` in-line for that unit.

2. On the **second consecutive** dispatch failure, display once:

   ```
   ⚠️  Two consecutive sub-agent dispatch failures.
   Falling back to in-line execution (Paused workflow) for the remainder of this run.
   Continuous-mode auto-context-reset is disabled until next /execute-work invocation.
   ```

   Continue the rest of the run via the Paused workflow.

3. The user may abort at any point with the standard interrupt.

This keeps the framework usable even if `general-purpose` is reconfigured or unavailable on a given install.

---

**Version:** 3.3.0
**Last Updated:** 2026-05-11 (split from `execute-work-implementation.md`)
**Related:**

- `execute-work-implementation.md` — parent overview of both modes
- `execute-work-implementation-paused.md` — in-line workflow (Paused mode)
- `execute-work-quality-gates.md` — test/coverage validation (same gates as Paused)
- `execute-work-progress-updates.md` — per-mode progress-file templates
- `execute-work-dashboard-events.md` — DASHBOARD auto-update events
