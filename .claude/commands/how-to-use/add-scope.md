# Adding Requirements - Quick Guide

**Use when:** Need to add user story, epic, or phase to project
**Command:** `/add-scope add [type] [args]`
**Time:** 2-5 minutes
**Files affected:** `phase-N.md`, `backlog.md`, optionally docs

**All documentation is in English only.**

---

## 🎯 Most Common Use Cases

### 1. Add Single User Story (Requirement)

```bash
/add-scope add story 1 2
```

**What it does:** Adds new user story to Phase 1, Epic 2. Auto-assigns next US-XXX ID.
**Example:** `/add-scope add story 1 3` → Creates US-019 in Phase 1, Epic 3
**When:** Client requests new feature, you need to add it to scope

### 2. Add User Story from Client Document

```bash
/add-scope add story 1 2 --from requirements.md
```

**What it does:** Reads requirement from file, adds as story.
**Example:** Client sends "feature-request.txt" → `/add-scope add story 2 1 --from feature-request.txt`
**When:** Client provides written requirements you want to import directly

### 3. Add Group of Related Requirements (Epic)

```bash
/add-scope add epic 1
```

**What it does:** Creates new epic in Phase 1 with multiple stories.
**Example:** "User Authentication" epic with login, logout, password reset stories
**When:** Adding feature set that requires multiple related stories

### 4. Add Entire Phase

```bash
/add-scope add phase 2
```

**What it does:** Inserts new phase at position 2, renumbers existing phases.
**Example:** Add "API Integration" phase between Foundation and Core Features
**When:** Major scope expansion requiring new project phase

### 5. Edit Existing Story

```bash
/add-scope edit story US-005
```

**What it does:** Modifies existing story (title, description, points, etc.)
**Example:** Client changes requirement for US-005
**When:** Requirements change, need to update existing story

---

## 📝 Quick Steps

### STEP 0: ENTER PLAN MODE

**🎯 MANDATORY: Always enter plan mode before making scope changes**

1. Claude reads current project state
2. Analyzes where new requirement fits
3. Creates preview of changes
4. Shows you what will be modified
5. Waits for your approval [Yes/No/Revise]

**Only proceeds after you approve the plan.**

### STEP 1: Run Command

```bash
/add-scope add [type] [phase] [epic] [--from file.md]
```

**Arguments:**

- `type` - Required: `story`, `epic`, or `phase`
- `phase` - For epic/story: phase number (e.g., `1`, `2`)
- `epic` - For story: epic number within phase (e.g., `1`, `2`)
- `--from` - Optional: read content from file

### STEP 2: Describe Requirement

If not using `--from`, Claude will ask you to describe:

- **Story:** Title, description, acceptance criteria, story points
- **Epic:** Name, goal, list of stories
- **Phase:** Name, goal, epics and stories

### STEP 3: Review Preview

Claude shows:

- What will be added/changed
- Which files will be updated
- Any renumbering impact (for phases)
- New story IDs assigned

### STEP 4: Approve

Choose:

- **Yes** - Proceed with changes
- **No** - Cancel, no changes made
- **Revise** - Modify content, see preview again

### STEP 5: Done

Claude:

- Updates phase files
- Updates backlog
- Runs integrity checks
- Shows summary report

---

## 🔍 Examples

### Example 1: Add Story After Client Request

```
Client email: "We need password reset functionality"

You: /add-scope add story 1 2

Claude: [Plan mode] Analyzing project...
        Will add to Phase 1, Epic 2 (User Authentication)
        Will assign US-020
        [Shows preview]

You: Yes

Claude: ✅ Added US-020: Password Reset
        Updated: phase-1.md, backlog.md
        Integrity checks: PASSED
```

### Example 2: Import Requirements from File

```
Client sends: new-features.md

You: /add-scope add story 2 3 --from new-features.md

Claude: [Plan mode] Reading new-features.md...
        Parsed requirement: "Export user data to CSV"
        Will add to Phase 2, Epic 3
        Will assign US-021
        [Shows preview]

You: Yes

Claude: ✅ Added US-021: Export User Data
```

---

## ⚠️ Common Issues

| Issue                         | Solution                                     | Reference                                |
| ----------------------------- | -------------------------------------------- | ---------------------------------------- |
| "Project not initialized"     | Run `/init-project` first                    | [init-project.md](./init-project.md)     |
| "Phase number out of range"   | Check existing phases with `/project-status` | [project-status.md](./project-status.md) |
| Wrong story ID format (US-5)  | Use zero-padded format (US-005)              | Full docs section "Arguments"            |
| Duplicate story title warning | Review existing stories, proceed or cancel   | Full docs section "Error Handling"       |

---

## 📚 Full Documentation

**This is a quick guide (150 lines).**

For complete details, see: [`.claude/commands/add-scope.md`](../add-scope.md) (445 lines)

Includes:

- All argument formats and validation rules
- Renumbering algorithm details
- Integrity check procedures
- Recovery from errors
- Module references for advanced scenarios
