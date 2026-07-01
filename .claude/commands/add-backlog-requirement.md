---
name: add-backlog-requirement
description: Add requirements to future backlog (post-launch versions) without assigning to active phases
---

# Add Backlog Requirement Command

**📖 Quick Start:** See [how-to-use/add-backlog-requirement.md](./how-to-use/add-backlog-requirement.md) for quick guide (~120 lines)

Add stories and epics to future backlog for post-launch versions without assigning to current phases.

**All requirements must be in English only.**

---

## Usage

```bash
/add-backlog-requirement story          # Add story to future backlog
/add-backlog-requirement epic           # Add epic to future backlog
/add-backlog-requirement story --from file.md   # Read from file
```

---

## 🎯 Purpose

**Use this command when:**

- Planning features for Version 2.0, 3.0, or beyond
- Collecting ideas not ready for current phases (1-4)
- Client requests features for "later" or "next version"
- Backlog grooming for post-launch enhancements

**Do NOT use this command for:**

- Features needed in current phases → Use `/add-scope`
- Bugs → Use `/add-bug`
- Features ready for immediate development → Use `/add-scope`

---

## YOUR TASK — MANDATORY WORKFLOW

**🔧 DOCUMENTATION RULES:**
All requirements must follow:

- **`CLAUDE.md`** - All documentation in English only
- **`.claude/rules/git.md`** - If committing changes (NO AI credits, conventional commits)

---

### STEP 0: ENTER PLAN MODE (MANDATORY)

**🎯 MANDATORY: Always enter plan mode before adding future requirements**

**Claude must:**

1. **Parse arguments:**
   - Type: `story` or `epic`
   - Check for `--from` flag

2. **Read current state:**
   - `.project-management/input/backlog.md` (active backlog)
   - `.project-management/input/backlog-future.md` (future backlog)
   - Find max US-XXX ID across BOTH files

3. **Read requirement information:**
   - If `--from file.md`: parse requirement details
   - If interactive: prepare questions

4. **Create plan showing:**
   - US-XXX ID to assign (next sequential)
   - Target version (2.0, 3.0, Unversioned)
   - Which section in backlog-future.md
   - Story points estimate

5. **Present plan:**

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 ADD FUTURE REQUIREMENT - PLAN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   TYPE: {{Story / Epic}}
   ID: US-XXX
   TITLE: {{Requirement title}}
   TARGET VERSION: {{2.0 / 3.0 / Unversioned}}
   PRIORITY: {{High / Medium / Low}}
   STORY POINTS: {{1-13}} (estimated)

   WILL ADD TO:
   - backlog-future.md ({{Version X.0}} section)

   NOT ADDED TO:
   - Active backlog.md
   - Any phase file
   - Current development cycle

   PROMOTE LATER WITH:
   /promote-requirement US-XXX --to-phase N

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Proceed? [Yes / No / Revise]
   ```

6. **Wait for approval**
7. **Only proceed to STEP 1 after approval**

---

### STEP 1: GATHER REQUIREMENT INFORMATION

**If `--from file.md` provided:**

- Read and parse file using backlog-future-template.md format
- Extract: title, description, target version, priority, acceptance criteria
- Validate all required fields present

**If interactive mode:**

Ask user for:

1. **Requirement Title** (required)
   - Short, descriptive title
   - Example: "Advanced search with filters"

2. **Target Version** (required)
   - 2.0 - Post-launch enhancements
   - 3.0 - Major future features
   - Unversioned - Ideas not yet assigned

3. **Priority within version** (required)
   - High - Important for that version
   - Medium - Nice to have
   - Low - Optional enhancement

4. **Description** (required)
   - User story format: "As a [user], I want [goal] so that [benefit]"
   - Or epic goal description

5. **Acceptance Criteria** (required for stories)
   - Numbered or bulleted list
   - What defines "done" for this requirement

6. **Story Points** (optional)
   - Fibonacci scale: 1, 2, 3, 5, 8, 13
   - If not provided, Claude estimates based on description
   - For epics: sum of estimated story points

7. **Epic Association** (optional, for stories)
   - If this story belongs to an epic
   - Epic name or ID

8. **Definition of Done** (optional)
   - Implementation complete
   - Tests written
   - Documentation updated
   - Code reviewed

9. **Notes** (optional)
   - Technical considerations
   - Dependencies
   - Research needed

---

### STEP 2: ASSIGN US-XXX ID

1. **Read backlog.md** - find max US-XXX in active backlog
2. **Read backlog-future.md** - find max US-XXX in future backlog
3. **Take higher of the two** (e.g., if backlog has US-050 and backlog-future has US-030, use US-050)
4. **Assign next sequential ID** (e.g., US-051)
5. **Use zero-padded 3-digit format** (US-001, US-002, ..., US-999)

**IMPORTANT:** US-XXX IDs are sequential across BOTH backlog files to prevent collisions.

---

### STEP 3: ADD TO FUTURE BACKLOG

1. **Open `.project-management/input/backlog-future.md`**

2. **Insert under correct version section:**
   - 2.0 → ## 🎯 Version 2.0 (Post-Launch Enhancements)
   - 3.0 → ## 🚀 Version 3.0 (Future Enhancements)
   - Unversioned → ## 💡 Unversioned (Ideas & Research)

3. **Story / Epic format:** see templates in `add-backlog-requirement-reference.md`.

4. **Update summary section** (requirement counts by version)

5. **DO NOT add to:**
   - Active backlog.md
   - Any phase-N.md file
   - Progress tracking files

---

### STEP 4: COMPLETION REPORT

Print the completion-report template from `add-backlog-requirement-reference.md` with the new requirement's ID, title, type, target version, priority, story points, and updated per-version/ total counts.

---

## Success Criteria

Future requirement addition is COMPLETE when:

1. [ ] Plan approved by user (STEP 0)
2. [ ] All required information gathered (STEP 1)
3. [ ] Unique US-XXX ID assigned (sequential with active backlog) (STEP 2)
4. [ ] Requirement added to backlog-future.md (STEP 3)
5. [ ] Summary counts updated (STEP 3)
6. [ ] Status set to "Future" (STEP 3)
7. [ ] NOT added to active backlog or phases (STEP 3)
8. [ ] Completion report displayed (STEP 4)

---

## Key Differences from `/add-scope`

| Aspect       | `/add-scope`                           | `/add-backlog-requirement`    |
| ------------ | -------------------------------------- | ----------------------------- |
| **Purpose**  | Active development (Phases 1-4)        | Future versions (post-launch) |
| **Adds to**  | Phase files + active backlog           | Future backlog only           |
| **Status**   | Todo → In Progress → Done              | Future (not active)           |
| **When**     | Ready to develop now                   | Plan for later                |
| **Phase**    | Assigns to specific phase              | NO phase assignment           |
| **Timeline** | Current project (1-4 months per phase) | Version 2.0, 3.0, beyond      |

---

## Example Walkthrough

See the worked example in `add-backlog-requirement-reference.md`.

---

## Key Rules

1. **Always enter plan mode first** (STEP 0)
2. **US-XXX IDs sequential across BOTH backlog files**
3. **US-XXX IDs are immutable** (never renumber)
4. **All requirements in English**
5. **Status always starts as "Future"**
6. **Never add to phase files** (that's for active development)
7. **Target version required** (2.0, 3.0, or Unversioned)
8. **Use `/promote-requirement` to move to active**

---

**Version:** 3.0.0
**Created:** 2026-04-02
**Command Type:** Backlog Management
