# Command Quick Guides - Index

**Purpose:** Fast reference for AI and developers - which command to use for what task.

**All documentation is in English only.**

---

## 💡 Current Structure: Jira for Scope, DASHBOARD for Decisions

Scope lives in **Jira (PRD1042)** — there is no local backlog and there are no phase files. Use
`/jira-sync` to pull a briefing for an epic or story.

`.project-management/output/progress/DASHBOARD.md` is the **decision journal** — what was done, why, and
what it revealed. It is not a metrics report: statuses live in Jira, test counts in `pnpm test:run`, gaps
in `input/open-questions.md`. `/execute-work` appends a prose entry to it, never a number.

---

## 🎯 Quick Decision Tree

```
START HERE
    │
    ├─ Need the scope of an epic / story?
    │   └─→ /jira-sync              (read-only briefing from Jira)
    │
    ├─ Ready to implement work (feature or bug fix)?
    │   └─→ /execute-work <JIRA-KEY>  (one unit: FE sub-task, story, or bug)
    │
    ├─ Working through open Jira bugs end-to-end?
    │   └─→ /bug-sweep              (find → reproduce → fix → hand off)
    │
    ├─ Have answers to previously skipped questions?
    │   └─→ /resolve-questions      [See: resolve-questions.md]
    │
    ├─ About to commit?
    │   └─→ /code-review            (diff-scoped — the per-commit gate)
    │
    ├─ Auditing beyond the diff?
    │   ├─→ /review-codebase        (rule compliance across src/)
    │   └─→ /pattern-audit          (DRY, extraction, structural health)
    │
    ├─ Work finished and verified?
    │   └─→ /jira-handoff           (transition ticket to "QA ready")
    │
    ├─ Not sure what commands exist?
    │   └─→ /list-skills            (full repo inventory, grouped)
    │
    └─ Need project status?
        └─→ Open .project-management/output/progress/DASHBOARD.md
```

---

## 📚 Quick Guides in This Folder

One command has a quick guide. `/execute-work`'s was retired on 2026-07-30 — the command itself is now
short enough to read directly, and its two stage modules hold the detail.

| Task                       | Command                                       | Guide                                          | Lines |
| -------------------------- | --------------------------------------------- | ---------------------------------------------- | ----- |
| Resolve deferred questions | `/resolve-questions [--priority Px \| Q-NNN]` | [resolve-questions.md](./resolve-questions.md) | 69    |

## 📗 Commands Without a Quick Guide

These are short enough to read directly. Full docs live in the parent folder (`.claude/commands/`).

| Command            | Purpose                                                | Doc                                            | Lines |
| ------------------ | ------------------------------------------------------ | ---------------------------------------------- | ----- |
| `/execute-work`    | Implement one Jira unit end to end                     | [../execute-work.md](../execute-work.md)       | 194   |
| `/jira-sync`       | Read-only briefing on a Jira epic / story              | [../jira-sync.md](../jira-sync.md)             | 193   |
| `/jira-handoff`    | Transition this branch's ticket(s) to "QA ready"       | [../jira-handoff.md](../jira-handoff.md)       | 179   |
| `/bug-sweep`       | Find, reproduce, fix, and hand off Jira bugs           | [../bug-sweep.md](../bug-sweep.md)             | 193   |
| `/code-review`     | Review the working diff before commit                  | [../code-review.md](../code-review.md)         | 259   |
| `/review-codebase` | Full-tree audit against the review checklist           | [../review-codebase.md](../review-codebase.md) | 232   |
| `/pattern-audit`   | DRY / extraction / composition / over-engineering scan | [../pattern-audit.md](../pattern-audit.md)     | 372   |
| `/list-skills`     | List every skill / command this repo defines           | [../list-skills.md](../list-skills.md)         | 61    |

`/resolve-questions` has a `resolve-questions-reference.md` companion in the parent folder, and
`/execute-work` loads two stage modules from `../modules/` (`-plan-mode`, `-quality-gates`).
`../modules/interactive-clarifications.md` is shared, loaded by `/resolve-questions`. None are invoked
directly.

---

## 🤖 For AI: Reading Strategy

**Token-efficient approach:**

1. **Start here** — read this index (~100 lines)
2. **If a quick guide exists** — read it (69 lines)
3. **Otherwise** — read the full command doc in `../` (61–372 lines)

**Coverage:** 1 of the 9 invocable commands has a quick guide. Run `/list-skills` for the authoritative
inventory — it enumerates the files rather than trusting this table.

---

## 📖 Full Documentation

- **Command docs:** `.claude/commands/` (parent folder)
- **Command inventory:** `/list-skills`
- **Coding / process rules:** `.claude/rules/` — see [`.claude/rules/project/README.md`](../../rules/README.md) for the index
- **Project rules:** `.project-management/rules/project-rules.md`
- **Live status:** `.project-management/output/progress/DASHBOARD.md`
- **Open questions:** `.project-management/input/open-questions.md`

---

**Created:** 2026-04-02
**Last Updated:** 2026-07-30
**Purpose:** AI-optimized command reference
