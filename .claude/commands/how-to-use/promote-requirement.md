# Promote Requirement - Quick Guide

**Use when:** A requirement in the future backlog is now ready for active development.
**Command:** `/promote-requirement US-XXX --to-phase N`
**Time:** < 1 minute
**Output:** Requirement moved into the target phase file + index updates.

**All documentation is in English only.**

---

## 🎯 What It Does

Moves a story from `input/backlog-future.md` (or `input/backlog/future.md`) into the active backlog for the specified phase. After promotion, the requirement appears in `input/backlog/phase-N-*.md` and is included in `/execute-work phase N` runs.

---

## 📋 Command Format

```bash
/promote-requirement US-045 --to-phase 2
```

**Arguments:**

- `US-XXX` — the story/epic ID to promote (must exist in the future backlog)
- `--to-phase N` — target phase (1-4). Must be an existing phase file.

---

## 🔄 What Happens

1. Locate the requirement in `input/backlog-future.md` / `input/backlog/future.md`.
2. Remove it from the future location.
3. Insert it into the right section of `input/backlog/phase-N-*.md` (by priority + epic).
4. Update `input/backlog/README.md` totals (count, points, priority breakdown).
5. Renumber dependent IDs if needed (calls `add-scope-renumbering` logic).
6. Log the move in `output/progress/DASHBOARD.md` activity section.

If the ID doesn't exist, or the phase file isn't found, the command refuses to run — no partial state.

---

## 🧭 When to Use

| Situation                                          | Use this command?              |
| -------------------------------------------------- | ------------------------------ |
| Client confirmed a "nice-to-have" becomes P0       | ✅ yes                         |
| Spike revealed a future story is a Phase 2 blocker | ✅ yes                         |
| Want to add a brand-new story                      | ❌ use `/add-scope add story`  |
| Want to move a story between active phases         | ❌ use `/add-scope edit story` |

---

## 🎓 Tips

- Review the requirement's acceptance criteria **before** promoting — future items are often lower-detail.
- Verify dependencies are also active (or promote them together).
- Promotion doesn't schedule the story; to work on it immediately run `/execute-work story US-XXX`.
- `/project-status` reflects the new totals on its next run; DASHBOARD.md auto-updates.

---

## 📚 Full Documentation

**This is the quick guide (~75 lines).**

Full command docs: [`.claude/commands/promote-requirement.md`](../promote-requirement.md)
Related: [`.claude/commands/add-backlog-requirement.md`](../add-backlog-requirement.md), [`.claude/commands/add-scope.md`](../add-scope.md)

---

**Part of:** Claude Project Management System v3.3
