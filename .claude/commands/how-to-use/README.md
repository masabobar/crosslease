# Command Quick Guides - Index

**Purpose:** Fast reference for AI and developers - which command to use for what task.

**All documentation is in English only.**

---

## 💡 Current Structure (v3.1+): Modular Backlog + Live Dashboard

**For quick status checking:**

- ✅ Open `output/progress/DASHBOARD.md` (live view, no commands)
- ✅ ~70% token savings — AI reads only the relevant phase file
- ✅ Auto-updates during `/execute-work`

---

## 🎯 Quick Decision Tree

```
START HERE
    │
    ├─ Ready to implement work (feature or bug fix)?
    │   └─→ Use /execute-work
    │       └─→ [See: execute-work.md]
    │
    └─ Need to check project status?
        └─→ Open .project-management/output/progress/DASHBOARD.md
```

---

## 📚 Quick Guides by Task

| Task                     | Command                     | Guide                                | Lines | Time   |
| ------------------------ | --------------------------- | ------------------------------------ | ----- | ------ |
| Execute phase/epic/story | `/execute-work [scope]`     | [execute-work.md](./execute-work.md) | ~150  | varies |
| Execute bug fix          | `/execute-work bug BUG-XXX` | [execute-work.md](./execute-work.md) | ~150  | varies |

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
