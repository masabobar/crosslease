---
name: promote-requirement
description: Promote a future requirement from backlog-future.md to active development in a specific phase
---

# Promote Requirement Command

Moves a requirement from future backlog to active development.

**All requirements must be in English only.**

---

## Usage

```bash
/promote-requirement US-XXX --to-phase N
```

**Example:**

```bash
/promote-requirement US-051 --to-phase 2
```

---

## YOUR TASK — MANDATORY WORKFLOW

**🔧 DOCUMENTATION RULES:**
When promoting requirements:

- **`CLAUDE.md`** - All documentation in English only
- **`.claude/rules/git.md`** - If committing changes (NO AI credits, conventional commits)

---

### STEP 0: ENTER PLAN MODE (MANDATORY)

**🎯 MANDATORY: Always enter plan mode before promoting**

**Claude must:**

1. **Parse arguments:**
   - US-XXX ID to promote
   - Target phase number

2. **Read and validate:**
   - Find US-XXX in `backlog-future.md`
   - Verify phase-N.md exists
   - Read requirement details

3. **Create plan:**

   ```
   PROMOTE REQUIREMENT

   FROM: backlog-future.md (Version X.0)
   TO: Phase N + active backlog.md

   US-XXX: [Title]
   Story Points: X

   CHANGES:
   - Remove from backlog-future.md
   - Add to backlog.md
   - Add to phase-N.md
   - Update status: Future → Todo

   Proceed? [Yes/No/Revise]
   ```

4. **Wait for approval**

---

### STEP 1: REMOVE FROM FUTURE BACKLOG

1. Open `backlog-future.md`
2. Find and extract US-XXX content
3. Remove from future backlog
4. Update future backlog summary counts

---

### STEP 2: ADD TO ACTIVE BACKLOG

1. Open `backlog.md`
2. Add requirement to appropriate epic section
3. Update status: "Future" → "Todo"
4. Keep same US-XXX ID (no renumbering)

---

### STEP 3: ADD TO PHASE

1. Open `phase-N.md`
2. Add requirement under correct epic
3. Update phase story points total
4. Set status: "Todo"

---

### STEP 4: COMPLETION REPORT

```
✅ REQUIREMENT PROMOTED

US-XXX: [Title]

FROM: backlog-future.md (Version X.0)
TO: Phase N - [Phase Name]

STATUS: Future → Todo
NOW READY FOR: /execute-work story US-XXX

PHASE PROGRESS:
Phase N: XX/YY points
```

---

## Success Criteria

1. [ ] Plan approved
2. [ ] Removed from backlog-future.md
3. [ ] Added to backlog.md
4. [ ] Added to phase-N.md
5. [ ] Status updated to "Todo"
6. [ ] US-XXX ID unchanged
7. [ ] Summary counts updated

---

## Key Rules

1. **Plan mode mandatory**
2. **US-XXX ID never changes** (same ID in future and active)
3. **Complete move** (remove from future, add to active)
4. **Update all 3 files** (backlog-future, backlog, phase)
5. **Status change** (Future → Todo)

---

**Version:** 3.0.0
**Created:** 2026-04-02
**Command Type:** Backlog Management
