# Command Quick Guides - Index

**Purpose:** Fast reference for AI and developers - which command to use for what task.

**All documentation is in English only.**

---

## 💡 Current Structure (v3.1+): Modular Backlog + Live Dashboard

**For quick status checking:**

- ✅ Open `output/progress/DASHBOARD.md` (live view, no commands)
- ✅ ~70% token savings — AI reads only the relevant phase file
- ✅ Auto-updates during `/execute-work`

**For legacy projects** (monolithic `backlog.md`):

- One-shot upgrade via `/migrate-to-modular` (legacy-only)

[📖 Learn more](../../../.project-management/guides/MODULAR-STRUCTURE-GUIDE.md)

---

## 🎯 Quick Decision Tree

```
START HERE
    │
    ├─ Have client documents (PDF, Word, etc.)?
    │   └─→ Use /process-client-docs
    │       └─→ [See: process-client-docs.md]
    │
    ├─ Project not initialized yet?
    │   └─→ Use /init-project
    │       └─→ [See: init-project.md]
    │
    ├─ Legacy project with monolithic backlog.md?
    │   └─→ Use /migrate-to-modular (legacy-only)
    │       └─→ [See: ../../../.project-management/guides/MODULAR-STRUCTURE-GUIDE.md]
    │
    ├─ Need to add/edit scope (story, epic, phase)?
    │   └─→ Use /add-scope
    │       └─→ [See: add-scope.md]
    │
    ├─ Planning features for future version (2.0, 3.0)?
    │   └─→ Use /add-backlog-requirement
    │       └─→ [See: add-backlog-requirement.md]
    │
    ├─ Future requirement ready for active development?
    │   └─→ Use /promote-requirement
    │       └─→ [See: promote-requirement.md]
    │
    ├─ Found a bug that needs fixing?
    │   └─→ Use /add-bug
    │       └─→ [See: add-bug.md]
    │
    ├─ Ready to implement work (feature or bug fix)?
    │   └─→ Use /execute-work
    │       └─→ [See: execute-work.md]
    │
    ├─ Need to run tests manually?
    │   └─→ Use /run-tests [scope]
    │       └─→ [See: run-tests.md]
    │
    ├─ Need to check project status?
    │   └─→ Open DASHBOARD.md (live) OR /project-status (report)
    │       └─→ [See: project-status.md]
    │
    ├─ Need to estimate total AI-agent hours for the backlog?
    │   └─→ Use /estimate-ai-hours
    │       └─→ [See: estimate-ai-hours.md]
    │
    ├─ Framework docs feel out of sync / stale?
    │   └─→ Use /audit-pm
    │       └─→ [See: audit-pm.md]
    │
    └─ Need to update documentation?
        └─→ Use /generate-docs
            └─→ [See: generate-docs.md]
```

---

## 📚 Quick Guides by Task

| Task                                | Command                                    | Guide                                                                                        | Lines | Time     |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- | ----- | -------- |
| Start new project                   | `/init-project`                            | [init-project.md](./init-project.md)                                                         | ~120  | 5-10 min |
| Migrate legacy project to modular   | `/migrate-to-modular` (legacy)             | [MODULAR-STRUCTURE-GUIDE.md](../../../.project-management/guides/MODULAR-STRUCTURE-GUIDE.md) | ~150  | 2-5 min  |
| Process client documents            | `/process-client-docs`                     | [process-client-docs.md](./process-client-docs.md)                                           | ~120  | 3-5 min  |
| Add requirement (story/epic/phase)  | `/add-scope add [type]`                    | [add-scope.md](./add-scope.md)                                                               | ~150  | 2-5 min  |
| Add future requirement (v2.0, v3.0) | `/add-backlog-requirement`                 | [add-backlog-requirement.md](./add-backlog-requirement.md)                                   | ~120  | 2-3 min  |
| Promote future requirement          | `/promote-requirement US-XXX --to-phase N` | [promote-requirement.md](./promote-requirement.md)                                           | ~75   | <1 min   |
| Add bug to roadmap                  | `/add-bug`                                 | [add-bug.md](./add-bug.md)                                                                   | ~120  | 2-3 min  |
| Execute phase/epic/story            | `/execute-work [scope]`                    | [execute-work.md](./execute-work.md)                                                         | ~150  | varies   |
| Execute bug fix                     | `/execute-work bug BUG-XXX`                | [execute-work.md](./execute-work.md)                                                         | ~150  | varies   |
| Run tests manually                  | `/run-tests [type]`                        | [run-tests.md](./run-tests.md)                                                               | ~80   | varies   |
| Check project status                | `/project-status`                          | [project-status.md](./project-status.md)                                                     | ~80   | 1 min    |
| Estimate total AI-agent hours       | `/estimate-ai-hours`                       | [estimate-ai-hours.md](./estimate-ai-hours.md)                                               | ~120  | <1 min   |
| Audit framework docs health         | `/audit-pm`                                | [audit-pm.md](./audit-pm.md)                                                                 | ~90   | 1-2 min  |
| Generate/update docs                | `/generate-docs`                           | [generate-docs.md](./generate-docs.md)                                                       | ~100  | 2-3 min  |

---

## 🤖 For AI: Reading Strategy

**Token-efficient approach:**

1. **Start here** - Read this index (~120 lines)
2. **For any command** - Read its quick guide (75-150 lines)
3. **If details needed** - Read full command docs (200-450 lines in `../`)

**Coverage:** All 12 slash commands have quick guides (v3.2+).

**Estimated token savings: 60-70% for common tasks**

---

## 📖 Full Documentation

**Quick guides** are in this folder (`how-to-use/`)
**Full command docs** are in parent folder (`.claude/commands/`)

For complete system documentation:

- Main guide: `../../.project-management/README.md`
- Integration: `../../.project-management/INTEGRATION-GUIDE.md`
- File map: `../../.project-management/SYSTEM-OVERVIEW.md`

---

**Created:** 2026-04-02
**Last Updated:** 2026-04-21
**Purpose:** AI-optimized command reference
