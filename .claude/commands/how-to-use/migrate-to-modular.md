# Migrate to Modular - Quick Guide

**Legacy-only command.** New projects don't need this — `/init-project` and `/process-client-docs` generate the modular structure directly.

**Use when:** Your project has an old monolithic `input/backlog.md` and you want to split it into the phase-based modular layout.
**Command:** `/migrate-to-modular`
**Time:** 2-5 minutes
**Output:** Phase backlog files + live DASHBOARD.md + progress tracking files.

**All documentation is in English only.**

---

## 🎯 What It Does

Takes a single `input/backlog.md` and splits it into:

```
input/backlog/
├── README.md                      # Master index + totals
├── phase-1-foundation.md
├── phase-2-core.md
├── phase-3-advanced.md
├── phase-4-polish.md
└── future.md                      # post-launch / v2.0+
```

Also creates the `output/progress/` live tracking files (DASHBOARD.md, daily-summary.md, weekly-report.md, current-status.md, completed.md, blockers.md) if they don't exist.

Backs up the original `backlog.md` (to `backlog.md.backup-YYYY-MM-DD`) before any destructive step.

---

## 📋 Command Format

```bash
/migrate-to-modular
```

No arguments.

---

## 🧭 When to Use

| Situation                               | Use this?                                         |
| --------------------------------------- | ------------------------------------------------- |
| Brand-new project                       | ❌ `/init-project` already generates modular      |
| Have `input/backlog.md` from v3.0       | ✅ yes                                            |
| Already have `input/backlog/` directory | ❌ migration is done; maybe you want `/add-scope` |
| Pre-v3.0 sprint-based project           | ❌ read `docs/MIGRATION-GUIDE.md` first           |

---

## 🎓 Tips

- Review the generated phase files — the categorization heuristic (P0 + foundation keywords → Phase 1, etc.) is good but not perfect. Move items between phases with `/add-scope edit story`.
- `/project-status` and `/execute-work` auto-detect modular vs monolithic — both layouts continue to work even during a partial migration.
- The `backlog.md.backup-*` can be deleted once you're happy with the split.

---

## 📚 Full Documentation

**This is the quick guide (~60 lines).**

Full command docs: [`.claude/commands/migrate-to-modular.md`](../migrate-to-modular.md)
Deeper guide: [`.project-management/guides/MODULAR-STRUCTURE-GUIDE.md`](../../../.project-management/guides/MODULAR-STRUCTURE-GUIDE.md)

---

**Part of:** Claude Project Management System v3.3 (legacy command)
