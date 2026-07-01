---
name: migrate-to-modular-reference
description: Migrate to Modular — Reference (templates, rollback, before/after examples, technical notes)
---

# Migrate to Modular — Reference

Reference material for `/migrate-to-modular`. The slash-command file (`migrate-to-modular.md`) holds the step-by-step workflow; this file holds the supporting context, examples, and recovery procedures that don't need to load every time.

---

## Before / After Structure

### Before (legacy / monolithic)

```
.project-management/
├── input/
│   ├── backlog.md                  ← 800+ lines, all stories
│   ├── scope.md
│   └── ...
└── output/
    └── progress/
        ├── current-status.md       ← manual update only
        ├── completed.md
        └── blockers.md
```

Problems:

- `backlog.md` is huge — hard to read, expensive for AI to parse
- No live progress view (must run `/project-status`)
- Manual status updates required

---

### After (modular)

```
.project-management/
├── input/
│   └── backlog/
│       ├── README.md                ← master index (< 150 lines)
│       ├── phase-1-foundation.md    ← Phase 1 stories (< 200 lines)
│       ├── phase-2-core.md          ← Phase 2 stories (< 200 lines)
│       ├── phase-3-advanced.md      ← Phase 3 stories (< 200 lines)
│       ├── phase-4-polish.md        ← Phase 4 stories (< 200 lines)
│       └── future.md                ← post-launch features
│
└── output/
    └── progress/
        ├── DASHBOARD.md             ← live, auto-updating
        ├── daily-summary.md         ← today's work
        ├── weekly-report.md         ← weekly summary
        ├── current-status.md        ← detailed (auto-updates)
        ├── completed.md
        └── blockers.md
```

Benefits:

- Files stay small and focused (< 200 lines each)
- Live dashboard — no command needed to check status
- Auto-updates during `/execute-work`
- 70–80 % AI token savings (loads only the relevant phase)
- Easier to read, faster to process

---

## Backward Compatibility

Old commands continue to work after migration:

- `/add-scope` — now writes to the correct phase backlog file
- `/execute-work` — now auto-updates `DASHBOARD.md` as work happens
- `/project-status` — still produces detailed reports; also refreshes `current-status.md`

Old files:

- `backlog.md.backup-YYYY-MM-DD` — keep until the new structure is verified, then delete

There are no breaking changes. New projects automatically use modular; legacy projects can migrate at any time without disruption.

---

## Rollback Procedure

If migration fails verification (or the user explicitly aborts), restore the previous state:

```bash
# Restore old backlog.md
mv .project-management/input/backlog.md.backup-YYYY-MM-DD \
   .project-management/input/backlog.md

# Remove the new modular structure
rm -rf .project-management/input/backlog/

# Restore old progress
mv .project-management/output/progress/current-status.md.backup \
   .project-management/output/progress/current-status.md
```

Claude tracks migration progress automatically — if any STEP 4 verification check fails, auto-rollback runs before reporting the failure to the user.

---

## Migration Summary Template

Show after STEP 4 verification passes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BACKLOG MIGRATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Statistics
- Total Epics: {{N_EPICS}}
- Total Stories: {{N_STORIES}}
- Total Points: {{TOTAL_POINTS}}

📁 Created Files
✅ backlog/README.md ({{LINES}} lines)
✅ backlog/phase-1-foundation.md ({{LINES}} lines)
✅ backlog/phase-2-core.md ({{LINES}} lines)
✅ backlog/phase-3-advanced.md ({{LINES}} lines)
✅ backlog/phase-4-polish.md ({{LINES}} lines)
✅ backlog/future.md ({{LINES}} lines)

📦 Backup
✅ Old backlog.md → backlog.md.backup-{{DATE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Post-Migration Usage

### Reading the backlog

Before:

```
Open backlog.md → scroll through 800 lines → find story
```

After:

```
Open backlog/README.md → see summary
Click phase link → open phase file (150–250 lines)
Find story quickly
```

For Claude:

- Reads only the relevant phase file
- 70–80 % token savings
- Faster processing

### Checking progress

Before:

```
/project-status                 # run command, wait for report
```

After:

```
Open progress/DASHBOARD.md      # see current status instantly
```

`/project-status` still works for detailed reports.

---

## Testing the Migration

Run through this checklist after STEP 7:

- [ ] All stories from old backlog present in new structure
- [ ] Story IDs unchanged
- [ ] Epic organization makes sense
- [ ] Phase file sizes within target (< 200 lines, ideal 150–180)
- [ ] DASHBOARD.md displays correctly with current metrics
- [ ] Links in `backlog/README.md` all resolve
- [ ] Backup files created
- [ ] Old commands (`/add-scope`, `/execute-work`, `/project-status`) work against the new structure

Any failure → rollback (above), report to user, retry only after the cause is identified.

---

## Example: Before / After Snapshot

A typical 800-line monolithic `backlog.md` (5 epics, 45 stories) splits into:

| File                            | Lines | Contents                                       |
| ------------------------------- | ----- | ---------------------------------------------- |
| `backlog/README.md`             | ~120  | master index: total stats, links to each phase |
| `backlog/phase-1-foundation.md` | ~180  | Auth, Infrastructure (12 stories / 47 pts)     |
| `backlog/phase-2-core.md`       | ~220  | Products, Cart, Checkout (18 stories / 82 pts) |
| `backlog/phase-3-advanced.md`   | ~190  | Push, Analytics (10 stories / 56 pts)          |
| `backlog/future.md`             | ~80   | post-launch (5 stories)                        |

Each phase file lists its own epics and stories using the same `US-NNN` IDs as before — the IDs are stable, only the layout changes. Each file is now small enough to read top-to-bottom without scrolling fatigue and small enough for Claude to load just the relevant phase.

---

## Technical Implementation Notes

For Claude executing the migration:

1. **Working directory:** `.project-management/`
2. **Backup naming:** `backlog.md.backup-YYYY-MM-DD` (e.g., `backlog.md.backup-2026-04-20`)
3. **Templates to use:**
   - `templates/phase-backlog-template.md` — phase files
   - `templates/backlog-readme-template.md` — master README
   - `templates/dashboard-template.md` — `DASHBOARD.md`
4. **File-size limits (strict):**
   - Phase files: must be < 200 lines (target 150–180)
   - README.md: must be < 200 lines (target 150)
   - DASHBOARD.md: target < 250 lines
   - If a phase exceeds 200 lines after generation, split into sub-phases or push lower-priority stories to the next phase. Don't ship oversized files.
5. **Categorization logic:**
   ```
   Phase 1: P0 + (Infrastructure | Auth | Setup | Database | API)
   Phase 2: P0/P1 + (Product | Cart | Checkout | Payment | Order)
   Phase 3: P1/P2 + (Profile | Inventory | Review | Notification | Admin)
   Phase 4: P2 + (Analytics | Report | Dashboard) + bugs / polish
   Future:  P3 or (v2 | future | post-launch | enhancement)
   ```
6. **ID patterns:** stories `US-\d{3}`, technical tasks `T-\d{3}`, bugs `BUG-\d{3}`. Never renumber — existing references must keep resolving.

---

## Real Project Example

Tested on this framework's own repo during the v3.2 migration:

**Before:**

- `input/backlog.md` — 381 lines
- `input/backlog-future.md` — 112 lines

**After:**

- `input/backlog/README.md` — 214 lines ✅
- `input/backlog/phase-1-foundation.md` — 145 lines ✅
- `input/backlog/phase-2-core.md` — 159 lines ✅
- `input/backlog/phase-3-advanced.md` — 132 lines ✅
- `input/backlog/phase-4-polish.md` — 96 lines ✅
- `input/backlog/future.md` — 120 lines ✅
- `output/progress/DASHBOARD.md` — 218 lines ✅
- Plus 5 progress files

Migration date: 2026-04-20.

---

**Version:** 3.3.0
**Last Updated:** 2026-04-27
**Status:** ✅ Active reference for `/migrate-to-modular`
