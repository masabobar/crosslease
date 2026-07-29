# Execute Work - Plan Mode Module

**Referenced by:** `execute-work.md` STEP 1

---

## STEP 1: ENTER PLAN MODE (MANDATORY)

**Display:**

```
📋 [PLAN MODE ACTIVATED]

Analyzing: [Phase N / Epic X / Story US-XXX]
```

---

### 1.1 Read ALL Required Context Files

**MANDATORY FILES - Read in this order:**

1. The Jira issue for the unit — epic/story/FE-subtask (`/jira-sync` mirror if present)
   - Architecture decisions
   - Design patterns
   - Tech stack details

   - All user stories in scope
   - Epic details
   - Dependencies

2. `CLAUDE.md`
   - Core development standards
   - Workflow requirements
   - Quality gates

3. `.claude/rules/code-quality.md`
   - SOLID & DRY principles (MANDATORY)
   - Code standards

4. `.claude/rules/testing.md`
   - Unit tests for Zod schemas / stores / utilities (behavior-based, no numeric coverage target)
   - What we deliberately skip (component tests, E2E — QA-owned)
   - Test organization

5. `.claude/rules/git.md`
   - Commit message format
   - **CRITICAL:** NO AI credits in commits

6. `.claude/rules/enums-and-constants.md`
   - Wire-format rules (if enum-like values in scope; values change in `../refinext-api/`)

7. `.claude/rules/stack-specific.md`
   - Framework-specific guidelines

8. `.project-management/rules/project-rules.md`
   - Project-specific conventions
   - Business logic rules

9. `.project-management/rules/I18N-RULES.md` **(CONDITIONAL)**
   - **IF this file exists:** i18n is MANDATORY for all user-facing text
   - **IF file missing:** Skip i18n requirements

   - **IF this file exists:** Apply project-specific testing rules
   - **IF file missing:** Use only general testing.md rules

**Display progress:**

```
Context Read:
✅ Technical spec
✅ Backlog
✅ Core standards
✅ Code quality rules
✅ Testing requirements
✅ Git workflow
✅ Project rules
{{✅ i18n rules (if exists)}}
{{✅ Project testing rules (if exists)}}
```

---

### 1.2 Analyze Scope

**For Phase execution:**

- List all epics in the phase
- List all stories in each epic
- Identify dependencies between stories
- Calculate total story points

**For Epic execution:**

- List all stories in the epic
- Identify story dependencies
- Calculate total story points

**For Story execution:**

- Read story details from backlog.md
- Identify dependencies
- Break down into tasks

---

### 1.3 Create Detailed Plan

**Plan must include:**

```markdown
🎯 SCOPE: [Phase N / Epic X / Story US-XXX]

📊 BREAKDOWN:

{{For Phase/Epic:}}
Epic 1: [Name] ([X] stories, [Y] points)
├─ US-001: [Title] (P0, 5 points)
│ ├─ Task: [Task description]
│ ├─ Task: [Task description]
│ └─ Tests: Unit (3), Integration (2), E2E (1)
├─ US-002: [Title] (P1, 3 points)
│ └─ ...
└─ Dependencies: US-001 → US-002

{{For Single Story:}}
US-XXX: [Title] (P0, 5 points)
├─ Task 1: [Description]
├─ Task 2: [Description]
├─ Task 3: [Description]
└─ Tests Required:
├─ Unit: [List]
├─ Integration: [List]
└─ E2E: [List]

📈 ESTIMATES:

- Total Stories: [N]
- Total Story Points: [X]
- Total Tasks: [Y]
- Estimated Duration: [Z] hours/days/weeks
- Tests to Write: ~[N] tests

⚠️ DEPENDENCIES:

- Internal: [List dependencies]
- External: [List external dependencies]

🔴 RISKS:

- [Risk 1]: [Description] (Impact: High/Medium/Low)
- [Risk 2]: [Description] (Impact: High/Medium/Low)

✅ SUCCESS CRITERIA:

- All unit tests passing (`pnpm test:run`), type-check + lint clean
- New Zod schemas / store logic / utilities tested (per `.claude/rules/testing.md`)
- Every BE error code surfaced with i18n keys (per `.claude/rules/api-error-display.md`)
  {{- i18n translations added (if I18N-RULES.md exists)}}
- SOLID & DRY principles followed
- Documentation updated
- Git commits follow conventions (NO AI credits)

🎯 IMPLEMENTATION STRATEGY:
[Explain approach, patterns to use, key decisions]
```

---

### 1.4 Wait for User Approval

**Display:**

```
📋 [END OF PLAN]

✅ Proceed with implementation of this plan?

[Yes] - Start implementation
[No] - Cancel execution
[Revise] - Modify plan
```

**Wait for user response.**

- If "Yes" → Continue to STEP 2 (exit plan mode)
- If "No" → Exit command
- If "Revise" → Ask what to change, regenerate plan, wait again

---

**Next Step:** Return to main `execute-work.md` STEP 2
