# Add Bug - Quick Guide

**Use when:** Found a bug that needs to be tracked and fixed
**Command:** `/add-bug` or `/add-bug --from file.md`
**Time:** 2-3 minutes
**Files affected:** `bug-roadmap.md`, optionally `phase-N.md`

**All bug reports must be in English only.**

---

## 🎯 Most Common Use Cases

### 1. Add Bug Interactively

```bash
/add-bug
```

**What it does:** Claude asks questions and creates bug report.
**Example:** Found login error, want to track for fixing
**When:** Quick bug reporting during development or testing

### 2. Add Bug from File

```bash
/add-bug --from bug-report.md
```

**What it does:** Reads bug details from file, adds to roadmap.
**Example:** Client sends bug report via email, save as file, import
**When:** Importing bugs from external sources

### 3. Add Critical Bug with Immediate Assignment

```bash
/add-bug
```

Then choose:

- Severity: Critical
- Assign to phase: Yes → Current phase

**What it does:** Adds critical bug and assigns to phase for immediate fixing.
**When:** Production bug needs urgent fix

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Claude enters plan mode before adding bug**

1. Claude reads current bug roadmap
2. Determines next BUG-XXX ID
3. Shows plan for adding bug
4. Waits for your approval [Yes/No/Revise]

**Only proceeds after you approve.**

### STEP 1: Provide Bug Information

**Required information:**

- Bug title (short, descriptive)
- Severity (Critical/High/Medium/Low)
- Affected component/file
- Description
- Reproduction steps (numbered list)
- Expected behavior
- Actual behavior

**Optional:**

- Story points (1, 2, 3, 5, 8, 13)
- Additional notes (screenshots, logs)

### STEP 2: Bug Gets ID

Claude auto-assigns next BUG-XXX ID:

- BUG-001, BUG-002, BUG-003, ...
- Sequential, never reused

### STEP 3: Added to Roadmap

Bug added to correct severity section:

- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🟢 Low

### STEP 4: Phase Assignment (Optional)

Choose:

- **Yes** - Assign to phase (ready for fixing)
- **No** - Keep in backlog (triage later)

### STEP 5: Done

Bug tracked in roadmap, ready to fix with:

```bash
/execute-work bug BUG-XXX
```

---

## 🔍 Examples

### Example 1: Interactive Bug Report

```
You: /add-bug

Claude: [Plan Mode]
        Next bug ID: BUG-007
        Proceed? [Yes/No]

You: Yes

Claude: Bug title?

You: User profile image upload fails

Claude: Severity? [Critical/High/Medium/Low]

You: High

Claude: Affected component/file?

You: src/controllers/ProfileController.php

Claude: Description?

You: Users cannot upload profile images. Upload button does nothing.

Claude: Reproduction steps? (enter numbered list)

You:
1. Go to profile settings
2. Click "Upload Photo"
3. Select an image file
4. Click "Save"
5. Nothing happens, no error shown

Claude: Expected behavior?

You: Image should upload and display as profile photo

Claude: Actual behavior?

You: Button click has no effect, image doesn't upload

Claude: Additional notes? (or press Enter to skip)

You: Console shows error: "Failed to upload file"

Claude: Suggest story points: 5 (High severity, API issue)
        Accept? [Yes / Enter different number]

You: Yes

Claude: Assign to phase now?
        [1] Yes  [2] No

You: 2

Claude: ✅ BUG-007 ADDED
        - High Priority section
        - 5 story points
        - Status: New
        - Backlog (not assigned to phase)

        Fix later with: /execute-work bug BUG-007
```

### Example 2: Import from File

```
# bug-report.md content:
### BUG: Payment gateway timeout

**Severity:** Critical
**Affected Component:** src/payment/StripeGateway.php

**Description:**
Payment processing times out after 30 seconds

**Reproduction Steps:**
1. Add items to cart
2. Proceed to checkout
3. Enter payment details
4. Submit payment
5. Wait 30 seconds
6. See timeout error

**Expected Behavior:**
Payment processes successfully in under 10 seconds

**Actual Behavior:**
Payment times out, order not created

---

You: /add-bug --from bug-report.md

Claude: [Plan Mode]
        Parsed bug from file:
        - Title: Payment gateway timeout
        - Severity: Critical
        - Component: src/payment/StripeGateway.php

        Will assign: BUG-008
        Proceed? [Yes/No/Revise]

You: Yes

Claude: Suggest story points: 8 (Critical, payment system)
        Accept? [Yes / No]

You: Yes

Claude: Assign to current phase (Phase 2)?
        [1] Yes - Fix urgently  [2] No - Triage later

You: 1

Claude: ✅ BUG-008 ADDED
        - Critical section
        - Assigned to Phase 2
        - 8 story points

        Fix with: /execute-work bug BUG-008
```

---

## ⚠️ Common Issues

| Issue                   | Solution                                                                       | Reference                            |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| "Roadmap not found"     | Run `/init-project` first, or create roadmap manually                          | [init-project.md](./init-project.md) |
| File not found (--from) | Check file path, ensure file exists                                            | Full docs "Arguments"                |
| Unclear severity        | Critical=system down, High=major broken, Medium=minor issue, Low=cosmetic      | Full docs "STEP 1"                   |
| Missing required fields | Must provide: title, severity, component, description, steps, expected, actual | Full docs "STEP 1"                   |

---

## 🎯 Severity Guidelines

**Critical:**

- System unusable
- Data loss or corruption
- Security vulnerability
- Production down

**High:**

- Major functionality broken
- Workaround exists but difficult
- Affects many users

**Medium:**

- Minor functionality affected
- Easy workaround available
- Affects some users

**Low:**

- Cosmetic issues
- Nice-to-have fixes
- Minimal user impact

---

## 📚 Bug Lifecycle

```
New → Triaged → In Progress → Fixed → Verified → Closed
 ↑                                        ↓
 └────────────────────────────────────────┘
          (Reopened if fix doesn't work)
```

**Status when adding:** Always "New"
**Status when executing:** Changes to "In Progress"
**Status when fixed:** Changes to "Fixed"
**Moved to archive:** When "Closed"

---

## 📚 Full Documentation

**This is a quick guide (120 lines).**

For complete details, see: [`.claude/commands/add-bug.md`](../add-bug.md) (~200 lines)

Includes:

- Detailed field descriptions
- Plan mode workflow
- Phase assignment logic
- Bug template format
- Complete examples
