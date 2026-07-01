---
name: migrate-to-modular
description: Migrate existing project from monolithic files to modular structure (split backlog + live dashboard)
---

# Migrate to Modular Structure

⚠️ **DEPRECATED for new projects.** `/process-client-docs` and `/init-project` already generate modular structure directly. Use this command **only** to migrate legacy projects with a monolithic `input/backlog.md`.

**What it does:**

- Splits a single `backlog.md` into per-phase files (`phase-1-foundation.md`, `phase-2-core.md`, ...)
- Creates a live `DASHBOARD.md` for progress
- Sets up auto-updating progress files
- Preserves backward compatibility with `/add-scope`, `/execute-work`, `/project-status`

**Reference material** (templates, rollback, before/after examples, real-project results, technical notes): `migrate-to-modular-reference.md`.

---

## Migration Workflow

### STEP 1 — Backup existing files

Claude will run this automatically before touching anything:

```bash
cp .project-management/input/backlog.md \
   .project-management/input/backlog.md.backup
cp .project-management/output/progress/current-status.md \
   .project-management/output/progress/current-status.md.backup
```

Backup naming: `backlog.md.backup-YYYY-MM-DD`. If anything fails downstream, see the rollback procedure in the reference file.

---

### STEP 2 — Analyze current backlog

Read `input/backlog.md` and extract:

- Total epics, total stories, total points
- Priority labels (P0/P1/P2)
- Phase mapping per story

Phase categorization keywords (full version in reference §Categorization Logic):

- **Phase 1 — Foundation:** P0 + Infrastructure / Auth / Setup / Database / API
- **Phase 2 — Core:** P0/P1 + Product / Cart / Checkout / Payment / Order
- **Phase 3 — Advanced:** P1/P2 + Profile / Inventory / Notification / Admin
- **Phase 4 — Polish:** P2 + Analytics / Report / Dashboard / bugs / polish
- **Future:** P3 or `v2` / `future` / `post-launch` / `enhancement`

---

### STEP 3 — Create the backlog directory structure

```bash
mkdir -p .project-management/input/backlog/
```

Generate, using the project's existing templates (`templates/phase-backlog-template.md`, `templates/backlog-readme-template.md`):

- `backlog/README.md` — master index, summary stats, links to phase files (target ≤ 150 lines)
- `backlog/phase-1-foundation.md` — Phase 1 epics + stories
- `backlog/phase-2-core.md` — Phase 2 epics + stories
- `backlog/phase-3-advanced.md` — Phase 3 epics + stories
- `backlog/phase-4-polish.md` — Phase 4 stories + testing/deployment
- `backlog/future.md` — post-launch features

Story ID pattern stays `US-\d{3}` (e.g., `US-001`); tasks `T-\d{3}`; bugs `BUG-\d{3}`. **Do not renumber** — existing references in commits, PRs, and progress files must keep working.

---

### STEP 4 — Verify migration

Required checks:

- [ ] All stories from old `backlog.md` present in new structure
- [ ] No duplicate stories
- [ ] Story IDs sequential and unchanged
- [ ] All epics categorized
- [ ] **Each phase file < 200 lines** (target 150–180); README < 200 lines
- [ ] DASHBOARD target < 250 lines

Output a concise summary block (line counts per file, total epics/stories/points). Full template: reference file §Migration Summary.

---

### STEP 5 — Create live dashboard

Generate, using `templates/dashboard-template.md`:

- `output/progress/DASHBOARD.md` — populated with current metrics (auto-updated by `/execute-work` from this point on)
- `output/progress/daily-summary.md` — empty state, populates during work
- `output/progress/weekly-report.md` — empty state, populates end-of-week

---

### STEP 6 — Update progress files

- `output/progress/current-status.md` — add auto-update footer, note migration date
- `output/progress/completed.md` — no changes (historical log)
- `output/progress/blockers.md` — no changes (active blockers)

---

### STEP 7 — Final summary

Show the user:

```
🎉 MIGRATION TO MODULAR STRUCTURE COMPLETE

Backlog split:  README + phase-1..4 + future ({{N}} stories total)
Dashboard:      DASHBOARD.md / daily-summary.md / weekly-report.md ready
Backup:         input/backlog.md.backup-{{DATE}}
Token savings:  ~{{X}}% reduction (typical: 70–80%)

Next steps:
  1. Open .project-management/output/progress/DASHBOARD.md
  2. Continue work with /execute-work (DASHBOARD auto-updates)
  3. Delete backlog.md.backup once you've verified the new structure
```

Full template + real-project numbers: reference file §Real Project Example.

---

## Quality Gate

Migration is **NOT complete** until:

- ✅ All stories present, IDs unchanged, no duplicates
- ✅ Phase file sizes within target (< 200 lines)
- ✅ DASHBOARD.md displays current metrics
- ✅ All internal links in `backlog/README.md` resolve
- ✅ Backup files created
- ✅ Old commands (`/add-scope`, `/execute-work`, `/project-status`) still work against the new structure

If any check fails: **rollback** per reference file §Rollback, and report the failure to the user before retrying.

---

## 📚 Module References

| Reference                         | Covers                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `migrate-to-modular-reference.md` | Before/after structure, backward compatibility, rollback, examples, technical implementation notes, real-project results |

---

**Version:** 3.3.0
**Last Updated:** 2026-04-27
**Status:** ✅ Active (deprecated for new projects)
