# Execute Phase/Epic/Story - Quick Guide

**Use when:** Ready to implement planned work (phase, epic, or story)
**Command:** `/execute-work [scope]`
**Time:** Varies (minutes to hours depending on scope)
**Automation:** Full - planning → implementation → testing → commit → progress tracking

**All documentation is in English only.**

---

## 🎯 What It Does

Fully automated implementation workflow:

1. **Plan Mode** - Creates detailed plan, waits for approval
2. **Implementation** - Writes code following SOLID & DRY
3. **Testing** - Writes and runs tests (80%+ coverage required)
4. **Quality Gates** - Validates all requirements met
5. **Git Commit** - Auto-commits (NO AI credits)
6. **Progress Tracking** - Updates phase files and metrics

---

## 📋 Command Formats

```bash
# Execute entire phase (all epics and stories)
/execute-work phase 1

# Execute single epic (all stories in epic)
/execute-work epic EPIC-1

# Execute single story
/execute-work story US-005
```

### Skip the mode prompt

Pass mode preferences inline and Claude won't ask:

```bash
# Positional digits — first = Execution Mode, second = Tracking Mode
/execute-work story US-MOB-023 1 2     # Continuous + Complete
/execute-work phase 1 2 1              # Paused + Phase Only

# Named flags (any order)
/execute-work story US-005 --mode=continuous --tracking=phase-only
/execute-work phase 1 --mode=c --tracking=c            # short aliases (c/p)

# Partial — Claude asks only for what's missing
/execute-work phase 1 1                # Continuous; will ask for tracking
/execute-work epic EPIC-3 --tracking=complete   # asks for execution mode
```

**Aliases:** `--mode=` accepts `1|c|continuous|2|p|paused`. `--tracking=` accepts `1|p|phase|phase-only|2|c|complete`. Named flags override positional values when both are supplied.

---

## 🎮 Execution Modes

### Mode 1: Continuous vs Paused

Claude asks at start (unless `--mode=` or a positional digit was passed inline — see "Skip the mode prompt" above):

```
Execution Mode:
[1] Continuous - Fresh sub-agent per story (clean context, auto-reset between stories)
[2] Paused - In-line execution; waits for approval after each story
```

**Recommendation:** Use Continuous for any phase/epic with 3+ stories.

**Why Continuous now uses sub-agents:** Each story runs in a fresh sub-agent with a clean context. The orchestrator only keeps a structured summary per completed story — no context drift, no leftover state from US-001 contaminating US-002. The sub-agent must still pass every quality gate (tests, coverage ≥80%, API docs, i18n, git commit) before returning `completed`.

**When to prefer Paused:** Short runs (1–2 stories), exploratory bug fixes, or anything where you want to step in mid-work. Sub-agents cannot ask you questions — every decision is autonomous.

### Mode 2: Progress Tracking

Claude asks at start (unless `--tracking=` or a positional digit was passed inline):

```
Progress Tracking Mode:
[1] Phase Only (faster - updates only phase file)
[2] Complete (slower - updates all progress files)
```

**Recommendation:** Use "Phase Only" for faster execution. For complete tracking later, re-run in Complete mode or edit the progress files directly.

**Time difference:** Complete mode adds ~10-30 seconds per story.

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before execution**

1. Claude reads:
   - Technical specification
   - Backlog
   - Phase plan
   - Core coding standards

2. Analyzes scope:
   - Story breakdown
   - Dependencies
   - Risks
   - Success criteria

3. Creates detailed plan with:
   - Implementation steps
   - Testing strategy
   - Estimated story points
   - Quality gates

4. Presents plan for approval
5. Waits for [Yes/No/Revise]

**Only proceeds to implementation after you approve.**

### STEP 1: Choose Execution Modes

After plan approval, Claude resolves the two modes. **If you passed them inline (positional digits or `--mode=` / `--tracking=` flags), this step is silent — Claude just echoes the resolved choices and moves on.** Otherwise, it asks:

1. Select **Execution Mode** (Continuous / Paused)
2. Select **Progress Tracking** (Phase Only / Complete)

If you passed only one of the two, Claude asks only for the missing one.

### STEP 2: Implementation Loop

**For each story in scope** (work happens inside a fresh sub-agent in Continuous mode, or in-line in Paused mode — same gates either way):

1. **TodoWrite Breakdown** - Creates task list for story
2. **Read Story Context** - Gets details from technical spec
3. **Implement** - Writes code following SOLID & DRY principles
4. **Write Tests** - Unit, integration, E2E tests
5. **Run Tests** - Must pass, coverage ≥ 80%
6. **Verify i18n** - If I18N-RULES.md exists
7. **Git Commit** - Auto-commit (NO AI attribution)
8. **Update Progress** - Phase file or all progress files
9. **Return summary (Continuous) / Pause for approval (Paused)**

### STEP 3: Quality Gates

**Story marked complete ONLY when:**

- ✅ All tasks implemented
- ✅ All tests written (unit, integration, E2E)
- ✅ All tests passing
- ✅ Coverage ≥ 80%
- ✅ All API status codes tested (200/400/401/403/404/500)
- ✅ i18n translations added (if required)
- ✅ SOLID & DRY principles followed
- ✅ Git commit created (no AI credits)

**If tests fail:** Claude fixes issues, re-runs tests, repeats until all pass.

### STEP 4: Completion Report

Shows:

- Stories completed
- Story points completed
- Tests written/passing
- Code coverage
- Git commits created
- Next steps

---

## 🔍 Example Walkthroughs

### Walkthrough A — inline modes (no prompts)

```
You: /execute-work story US-MOB-023 1 2

Claude: Resolved modes:
          Execution: Continuous (sub-agent dispatch)
          Tracking:  Complete

        [STEP 0: Plan Mode]
        [shows plan for US-MOB-023]
        Proceed? [Yes/No/Revise]

You: Yes

Claude: 🚀 Dispatching US-MOB-023 in fresh sub-agent (clean context)...
        [sub-agent runs full per-story workflow]
        ✅ US-MOB-023 COMPLETED — tests 14/14, coverage 86%, commit a1b2c3d
```

### Walkthrough B — full menu (no inline args)

```
You: /execute-work phase 1

Claude: [STEP 0: Plan Mode]
        Reading context...
        ✅ Technical spec
        ✅ Backlog
        ✅ Phase 1 plan (18 stories, 89 points)
        ✅ Core standards

        PLAN:
        Scope: Phase 1 - Foundation & Setup
        Stories: 18 (US-001 through US-018)
        Epics: 3 (Project Setup, Database, Authentication)

        Implementation Strategy:
        1. US-001: Project initialization
        2. US-002: Database migrations setup
        [... detailed plan for all 18 stories]

        Risks: None identified
        Success Criteria: All tests pass, 80%+ coverage

        Proceed? [Yes/No/Revise]

You: Yes

Claude: [Execution Mode?]
        [1] Continuous  [2] Paused

You: 1

Claude: [Progress Tracking?]
        [1] Phase Only  [2] Complete

You: 1

Claude: 🚀 Starting implementation...
        Execution Mode: Continuous (sub-agent dispatch)
        Progress Tracking: Phase Only

        Each story below is dispatched into a fresh sub-agent.
        The orchestrator keeps only the JSON summary per story —
        no story-level context bleeds between dispatches (auto-reset).

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🚀 US-001: Project Setup
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        [TodoWrite: 5 tasks created]
        [Implementing task 1/5...]
        [Writing tests...]
        [Running tests... ✅ All pass]
        [Git commit created]
        [Progress updated]

        ✅ US-001 COMPLETED (5 points)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ▶️ Continuing with US-002...

        [... repeats for all 18 stories]

        🎉 PHASE 1 - COMPLETED
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        Stories: 18/18 completed
        Points: 89/89 (100%)
        Tests: 156 written, 156 passing
        Coverage: 87%
        Commits: 18

        NEXT STEPS:
        Ready to start Phase 2!
        Run: /execute-work phase 2
```

---

## ⚠️ Common Issues

| Issue                       | Solution                                           | Reference                  |
| --------------------------- | -------------------------------------------------- | -------------------------- |
| Tests fail during execution | Claude auto-fixes and retries                      | Quality gates module       |
| Dependency missing          | Marked as "Blocked", continues with other stories  | Full docs "Error Handling" |
| Coverage below 80%          | Claude adds more tests until threshold met         | `.claude/rules/testing.md` |
| User cancels mid-execution  | Marks current story as "In Progress", resume later | Full docs "Error Handling" |

---

## 🎯 After Execution

**If you chose "Phase Only" tracking:**

Re-run `/execute-work` in Complete mode next time, or edit the progress files
(`completed.md`, `current-status.md`, `blockers.md`) directly. The `/update-progress`
command was removed in v3.2.0.

**Check overall status:**

```bash
/project-status
```

**Continue to next phase:**

```bash
/execute-work phase 2
```

---

## 📚 Full Documentation

**This is a quick guide.**

For complete details, see: [`.claude/commands/execute-work.md`](../execute-work.md) (orchestrator + STEP 0 inline-args parsing).

Related modules:

- `modules/execute-work-implementation.md` — parent overview + section index
- `modules/execute-work-implementation-continuous.md` — sub-agent prompt template (Continuous mode)
- `modules/execute-work-implementation-paused.md` — in-line workflow (Paused mode)
- `modules/execute-work-quality-gates.md` — quality gates (same for both modes)
- `execute-work-reference.md` — modes, trade-offs, error handling, full execution traces
