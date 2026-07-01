---
name: command-name
description: Brief description of what this command does (max 100 chars)
---

# Command Name

**📖 Quick Start:** See [how-to-use/command-name.md](./how-to-use/command-name.md) for quick guide (<150 lines)

**Purpose:** Detailed explanation of command purpose and use cases.

**All documentation is in English only.**

---

## Usage

```bash
/command-name [required-arg] [optional-arg] [--flag]
```

**Arguments:**
| Argument | Required | Format | Description |
|----------|----------|--------|-------------|
| `required-arg` | Yes | type | What it does |
| `optional-arg` | No | type | What it does (default: value) |
| `--flag` | No | boolean | What it enables |

---

## Module References

**If this command has multiple workflows, reference modules:**

| Module                               | Covers                | Sections |
| ------------------------------------ | --------------------- | -------- |
| `modules/command-name-workflow.md`   | Main workflow details | 1.1-1.5  |
| `modules/command-name-validation.md` | Validation and checks | 2.1-2.3  |

---

## YOUR TASK — MANDATORY WORKFLOW

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before execution**

**Purpose:** Analyze task, create plan, get user approval before making changes.

**Claude must:**

1. **Read required context files:**
   - List specific files to read
   - Example: `.project-management/input/scope.md`
   - Example: `.project-management/output/phases/phase-1.md`

2. **Analyze the task:**
   - Parse command arguments
   - Validate prerequisites
   - Identify scope and impact

3. **Create detailed plan:**
   - Step-by-step actions
   - Files to be created/modified
   - Estimated time/effort
   - Success criteria
   - Risk assessment

4. **Present plan to user:**

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 PLAN MODE - [COMMAND NAME]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   SCOPE: [Brief description]

   CONTEXT READ:
   ✅ File 1
   ✅ File 2

   ANALYSIS:
   - [Key finding 1]
   - [Key finding 2]

   PLAN:
   1. [Action 1]
   2. [Action 2]
   ...

   FILES TO MODIFY:
   - file1.md - [what changes]
   - file2.md - [what changes]

   RISKS:
   - [Risk if any, or "None identified"]

   SUCCESS CRITERIA:
   - [Criteria 1]
   - [Criteria 2]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Proceed? [Yes / No / Revise]
   ```

5. **Wait for user approval:**
   - **Yes** → Continue to STEP 1
   - **No** → Abort, no changes made
   - **Revise** → Adjust plan based on user feedback, show again

**Only proceed to STEP 1 after user approves the plan.**

---

### STEP 1: [First Action Step]

**Description:** What this step does.

**Claude actions:**

1. Action item 1
2. Action item 2
3. Action item 3

**Example:**

```bash
# Command or code example
```

**Output:**

```
Expected output format
```

---

### STEP 2: [Second Action Step]

**Description:** What this step does.

**Claude actions:**

1. Action item 1
2. Action item 2

**Validation:**

- Check 1
- Check 2

---

### STEP N: COMPLETION REPORT

**Claude displays:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [COMMAND NAME] - COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
- [Metric 1]
- [Metric 2]

FILES UPDATED:
- file1.md - [what changed]
- file2.md - [what changed]

NEXT STEPS:
1. [Recommended action 1]
2. [Recommended action 2]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Success Criteria

Command is COMPLETE when:

1. [ ] Plan approved by user (STEP 0)
2. [ ] All actions executed successfully
3. [ ] All validations passed
4. [ ] Files updated correctly
5. [ ] Summary report displayed

---

## Error Handling

| Error   | Cause          | Recovery   | Reference      |
| ------- | -------------- | ---------- | -------------- |
| Error 1 | Why it happens | How to fix | Module/section |
| Error 2 | Why it happens | How to fix | Module/section |

---

## Example Walkthrough

```
User: /command-name arg1

Claude: [STEP 0: Plan Mode]
        Reading context...
        ✅ File 1
        ✅ File 2

        PLAN:
        1. Action 1
        2. Action 2

        Proceed? [Yes/No/Revise]

User: Yes

Claude: [STEP 1]
        Executing action 1...
        ✅ Done

        [STEP 2]
        Executing action 2...
        ✅ Done

        ✅ COMMAND COMPLETED
        [Shows summary]
```

---

## Key Rules

**Always:**

1. Enter plan mode before execution (STEP 0)
2. Read all required context files
3. Get user approval before making changes
4. Run validation checks
5. Display completion report

**Never:**

- Skip plan mode
- Make changes without approval
- Continue after validation fails
- Omit error handling

---

## Token Optimization

**For AI reading this command:**

**Quick guide available:** `how-to-use/command-name.md` (~100-150 lines)
**Read quick guide first** if you need basic usage information.
**Read this file** only if you need complete implementation details.

**This file should be < 200 lines** (excluding examples and modules).
**Reference modules** for detailed sub-workflows instead of including everything here.

---

**Version:** 3.0.0
**Created:** 2026-04-02
**Command Type:** [Type - e.g., Implementation, Documentation, Status]
**Last Updated:** 2026-04-02

---

## Template Usage Instructions

**When creating a new command:**

1. Copy this template
2. Replace `command-name` with actual command name
3. Fill in all sections (delete placeholder text)
4. Create corresponding quick guide in `how-to-use/`
5. Create modules if command is complex (> 200 lines)
6. Add to `.claude/commands/how-to-use/README.md` index
7. Reference in `.project-management/README.md` if user-facing
8. Keep < 200 lines (use modules for details)
9. Ensure all documentation is in English only
10. Always include STEP 0: ENTER PLAN MODE as mandatory first step

**AI Optimization Checklist:**

- [ ] Quick guide created (< 150 lines)
- [ ] Full command < 200 lines (or modularized)
- [ ] Clear "Use when" at top
- [ ] Tables for scanning
- [ ] Code blocks for examples
- [ ] References instead of duplication
- [ ] English only
- [ ] Plan mode mandatory
