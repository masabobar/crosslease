---
name: add-bug
description: Add new bugs to the roadmap for tracking and execution
---

# Add Bug Command

**📖 Quick Start:** See [how-to-use/add-bug.md](./how-to-use/add-bug.md) for quick guide (~120 lines)

Add bugs to the bug roadmap with automatic ID assignment and severity-based organization.

**All bug reports must be in English only.**

---

## Usage

```bash
/add-bug                    # Interactive mode (Claude asks questions)
/add-bug --from file.md     # Read bug from file (use bug-template.md format)
```

---

## YOUR TASK — MANDATORY WORKFLOW

**🔧 CRITICAL RULES:**
When executing bug fixes via `/execute-work bug BUG-XXX`, follow:

- **`.claude/rules/code-quality.md`** - SOLID & DRY principles for bug fixes
- **`.claude/rules/testing.md`** - Regression tests, ALL API status codes
- **`.claude/rules/git.md`** - Commit messages (NO AI credits), reference BUG-XXX

---

### STEP 0: ENTER PLAN MODE (MANDATORY)

**🎯 MANDATORY: Always enter plan mode before adding bugs**

**Claude must:**

1. **Parse arguments:**
   - Check for `--from` flag
   - If `--from`: validate file exists and is readable

2. **Read current bug roadmap:**
   - `.project-management/output/bugs/bug-roadmap.md`
   - Find max BUG-XXX ID (e.g., if BUG-005 exists, next will be BUG-006)
   - Count bugs by severity

3. **Read bug information:**
   - If `--from file.md`: parse bug details from file
   - If interactive: prepare questions for user

4. **Create plan showing:**
   - Bug ID to assign (e.g., BUG-006)
   - Severity level
   - Where bug will be added in roadmap
   - Story points estimate (if provided or suggested)

5. **Present plan** using the Plan-Mode Template — see `add-bug-reference.md` → "Plan-Mode Template (STEP 0)". The plan summarizes the eight fields (BUG ID, TITLE, SEVERITY, STORY POINTS, AFFECTED, WILL ADD TO, ASSIGN TO PHASE, plus the `Proceed?` prompt).

6. **Wait for approval**, then proceed to STEP 1.

---

### STEP 1: GATHER BUG INFORMATION

**🔒 Anonymization note:** Bug reports go into the persistent roadmap and may be shared with clients. If the user or input file references a person by name as the reporter or affected user (e.g., "Marko reported this", "happens on Ana's account"), substitute role labels (`the QA lead reported …`, `a user account`) or source-context (`per support channel`). Full rule: `.claude/rules/anonymization.md`. Sample customer names in clearly-marked example data are fine.

**If `--from file.md` provided:**

- Read and parse file using bug-template.md format
- Extract: title, severity, component, description, reproduction steps, expected/actual behavior
- Validate all required fields present

**If interactive mode:**

Most fields are free-text intake (title, component, description, reproduction steps, expected/actual behavior, notes — AskUserQuestion is the wrong tool for prose). Two fields use AskUserQuestion: **Severity** (Q2) and **Story Points** (Q8).

1. **Bug Title** (required)
   - Short, descriptive title
   - Example: "User login fails with valid credentials"

2. **Severity** (required) — ask via AskUserQuestion (gating, no Skip):

   ```
   question: "Bug severity?"
   header: "severity"
   skippable: false
   options:
     - label: "Critical"
       description: "System unusable, data loss, or security vulnerability. Production-blocking."
     - label: "High"
       description: "Major functionality broken; workaround exists but degraded UX."
     - label: "Medium"
       description: "Minor functionality affected; easy workaround available."
     - label: "Low"
       description: "Cosmetic issue or nice-to-have fix; no functional impact."
   ```

   The chosen severity routes the bug to the matching section in `bug-roadmap.md` (Critical → 🔴, High → 🟠, Medium → 🟡, Low → 🟢) per STEP 3.

3. **Affected Component/File** (required)
   - Which file, module, or component is affected
   - Example: "src/auth/LoginController.php"

4. **Description** (required)
   - Brief description of what's broken
   - Example: "Users cannot log in even with correct credentials"

5. **Reproduction Steps** (required)
   - Numbered list of steps to reproduce
   - Example:
     1. Navigate to /login
     2. Enter valid credentials
     3. Click login button
     4. See error message

6. **Expected Behavior** (required)
   - What should happen
   - Example: "User should be logged in and redirected to dashboard"

7. **Actual Behavior** (required)
   - What actually happens
   - Example: "Login form shows 'Invalid credentials' error"

8. **Story Points** (optional) — ask via AskUserQuestion (`skippable: true` — Skip uses severity-based suggestion):

   ```
   question: "Story points estimate?"
   header: "points"
   skippable: true
   default: "{{severity_suggested_points}}"
   options:
     - label: "1 — Trivial (typical for Low severity)"
       description: "Tiny fix, < 30 min: typo, one-line config, obvious null check."
     - label: "3 — Small"
       description: "Few hours: localized fix, well-understood bug with clear repro."
     - label: "5 — Medium"
       description: "Half-day to full-day: needs investigation, touches multiple files."
   ```

   **Placeholder resolution.** `{{severity_suggested_points}}` is resolved at prompt-render time from the user's prior Severity answer (Q2):
   - Critical → `"8"` (matches `Other`; the YAML default is shown but no top-3 option is preselected — the user can accept the default or type a different value via `Other`).
   - High → `"5 — Medium"` (matches the third visible option, preselected).
   - Medium → `"3 — Small"` (matches the second visible option, preselected).
   - Low → `"1 — Trivial (typical for Low severity)"` (matches the first visible option, preselected).

   The default acts as a soft prefill: if it matches a visible option label, that option is preselected; if not (Critical case), the user sees the default value pre-populated in the native `Other` field.

   **On Skip:** use the severity-based suggestion above directly (no further prompt).

   **Free-text `Other` validation.** If the user types a value that isn't on the Fibonacci scale (`1, 2, 3, 5, 8, 13`), round up to the next valid value and emit a warning to the STEP 5 summary: `"Non-Fibonacci value '<x>' rounded up to next valid: <y>"`.

9. **Additional Notes** (optional)
   - Screenshots, error logs, environment details

---

### STEP 2: ASSIGN BUG ID

1. **Read bug-roadmap.md**
2. **Find all existing BUG-XXX IDs**
3. **Determine max ID** (e.g., BUG-005)
4. **Assign next sequential ID** (e.g., BUG-006)
5. **Use zero-padded 3-digit format** (BUG-001, BUG-002, ..., BUG-999)

---

### STEP 3: ADD TO ROADMAP

1. **Open `.project-management/output/bugs/bug-roadmap.md`**

2. **Insert bug under correct severity section:**
   - Critical → 🔴 Critical Bugs
   - High → 🟠 High Priority Bugs
   - Medium → 🟡 Medium Priority Bugs
   - Low → 🟢 Low Priority Bugs

3. **Bug format:** see the entry template in `add-bug-reference.md`.

4. **Update summary section** (bug counts)

---

### STEP 4: ASK ABOUT PHASE ASSIGNMENT

**Ask via AskUserQuestion** (`skippable: true` — Skip leaves the bug in Backlog):

```
question: "Assign this bug to a phase now?"
header: "phase"
skippable: true
default: "No — keep in Backlog"
options:
  - label: "Yes — assign to phase"
    description: "Prioritize for fixing in a specific phase. You'll pick which one next."
  - label: "No — keep in Backlog (Recommended)"
    description: "Triage later. The bug is reachable via /resolve-questions or manual review."
```

**Skip handling:** if the user picks `Skip — answer later`, persist the question per `modules/interactive-clarifications.md` STEP D (renders the canonical schema from `.project-management/templates/open-questions-template.md`). Pass these field values:

- `category`: `bug-triage`
- `priority`: `P2`
- `question`: `"Assign {{bug_id}} ({{bug_title}}, severity {{severity}}) to a phase?"`
- `default`: `"Backlog (no phase)"`
- `impact`: `"Bug remains in Backlog until triaged; not scheduled into any phase"`
- `applies_to`: `[]` _(the bug is already correctly placed in `bug-roadmap.md` Backlog section by STEP 3; no doc actively drifts on Skip — phase assignment is pending, not broken)_
- `notes`: `"Created on {{date}}; severity {{severity}}"`

(Placeholders: `{{bug_id}}` = BUG-XXX assigned in STEP 2; `{{bug_title}}` = from Q1; `{{severity}}` = from Q2; `{{date}}` = today.)

The user can resume via `/resolve-questions --priority P2` or `/resolve-questions Q-NNN`, or assign manually by editing `bug-roadmap.md`.

**If user picks "Yes — assign to phase":**

1. Discover available phases — list `phase-*.md` files in `.project-management/output/<active>/`. Count them.

2. **If 4 or fewer phases exist**, ask via a second AskUserQuestion (gating):

   ```
   question: "Which phase?"
   header: "phase-pick"
   skippable: false
   options:                              # one option per discovered phase, in order
     - label: "Phase 1 — Foundation"
       description: "{{phase_1_summary_first_line}}"
     - label: "Phase 2 — Core"
       description: "{{phase_2_summary_first_line}}"
     - ...                               # up to 4
   ```

3. **If more than 4 phases exist**, fall back to numeric input (AskUserQuestion supports up to 4 options):
   - Render the menu as a numbered list, one phase per line:
     ```
     [1] Phase 1 — {{phase_1_summary_first_line}}
     [2] Phase 2 — {{phase_2_summary_first_line}}
     ...
     [N] Phase N — {{phase_N_summary_first_line}}
     ```
   - Prompt: `"Pick a phase number [1-{{N}}]:"`
   - Accept an integer in `[1..N]`. Reprompt on non-integer / out-of-range / empty input with the same prompt + a short error message ("Invalid — enter a number between 1 and N.").

4. After phase selection:
   - Add bug to selected `phase-N.md` file under "Bugs" section
   - Update `bug-roadmap.md`: `Assigned to Phase: Phase N`
   - Update phase story points total

---

### STEP 5: COMPLETION REPORT

Print the completion-report template from `add-bug-reference.md` with the new bug's ID, title, severity, points, status, assigned-phase context, and updated counts.

---

## Success Criteria

Bug addition is COMPLETE when:

1. [ ] Plan approved by user (STEP 0)
2. [ ] All required information gathered (STEP 1)
3. [ ] Unique BUG-XXX ID assigned (STEP 2)
4. [ ] Bug added to bug-roadmap.md (STEP 3)
5. [ ] Bug counts updated in roadmap summary (STEP 3)
6. [ ] Phase assignment decided (STEP 4)
7. [ ] If assigned, bug added to phase file (STEP 4)
8. [ ] Completion report displayed (STEP 5)

---

## Example Walkthrough

See the interactive-intake worked example in `add-bug-reference.md`.

---

## Key Rules

1. **Always enter plan mode first** (STEP 0)
2. **Bug IDs are sequential** (BUG-001, BUG-002, ...)
3. **Bug IDs are immutable** (never renumber)
4. **All bug reports in English**
5. **Status starts as "New"**
6. **Severity determines roadmap section**
7. **Story points use Fibonacci scale**
8. **Phase assignment is optional at creation**

---

**Version:** 3.0.0
**Created:** 2026-04-02
**Command Type:** Bug Tracking
