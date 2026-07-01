# Audit PM — `--fix` Mode

Companion to `audit-pm.md`. Holds the full STEP 6 workflow that runs only when the user invokes `/audit-pm --fix`.

Never silent — every fix category is confirmed before applying.

---

## 6.1 Classify findings

Walk the consolidated report from STEP 4 (in `audit-pm.md`) and tag each finding as **auto-fixable** or **manual**:

| Category                                                       | Auto-fix?                | How                                                             |
| -------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| Version drift (docs claim older version than README)           | ✅ yes                   | Bulk `Edit` replace_all of `**Version:** X.Y.Z` → current       |
| CHANGELOG missing entry for current version                    | ✅ yes (skeleton)        | Prepend a `## [X.Y.Z] - YYYY-MM-DD` stub; flag for user to fill |
| Broken markdown link where target clearly renamed              | ✅ yes                   | If rename is 1:1 and unambiguous, `Edit` the link               |
| Broken link requiring path disambiguation                      | ❌ no                    | Flag for manual decision                                        |
| Stale references to removed commands in non-historical context | ✅ yes (prompt per file) | Show context, ask per-occurrence                                |
| Legacy directory (e.g. `output/sprints/`) empty                | ✅ yes                   | `rm -rf` after explicit confirmation                            |
| Missing how-to-use guide                                       | ❌ no                    | Needs writing; not mechanical                                   |
| Monolithic backlog in modular project (structural mismatch)    | ❌ no                    | Point user at `/migrate-to-modular`                             |
| File-size soft-target overrun                                  | ❌ no                    | Requires split decisions; delegate to humans                    |
| Duplicate docs (judgement call)                                | ❌ no                    | Requires merge/deletion judgement                               |
| Phantom file references (file never existed)                   | ✅ yes (prompt)          | Show each mention, ask: delete or keep as historical?           |

---

## 6.2 Group fixes for batch confirmation

Group auto-fixable findings by category. Present each group with a summary + list of target files, then one confirmation per group:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 AUTO-FIX PROPOSAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Group 1 — Version drift (5 files)
  Current version: 3.2.0
  Files claiming older versions:
    - .project-management/guides/FAQ.md           → 3.1.0
    - .project-management/docs/ARCHITECTURE.md    → 3.0.0
    - ...
  Action: replace_all "**Version:** X.Y.Z" → "**Version:** 3.3.0"

Group 2 — Legacy directory removal
  - .project-management/output/sprints/ (empty, v2.0 artifact)
  Action: rm -rf .project-management/output/sprints/

Group 3 — Broken-link renames (3 findings)
  - how-to-use/README.md → ./start-project.md (renamed to init-project.md)
  - ...
  Action: Edit link text per finding

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply?
  [1] All groups   [2] Only Group N   [3] Per-finding prompt   [N] Cancel
```

---

## 6.3 Apply + verify

For each approved group:

1. Apply the fix (`Edit` with `replace_all: true` when appropriate, `Bash rm` only for confirmed empty dirs).
2. After the group completes, re-run `.claude/hooks/audit-pm.sh` to confirm the finding class is cleared.
3. Report:
   ```
   ✅ Group 1 — Version drift — 5 files updated. Re-audit: section C clean.
   ✅ Group 2 — Legacy dir — removed. Re-audit: section F clean.
   ```

If a re-audit still shows the finding → surface the mismatch and stop applying further fixes in that group.

---

## 6.4 Manual findings summary

After auto-fixes, emit a summary of **manual** findings that `--fix` cannot handle, with suggested next steps per category:

```
🟡 MANUAL FOLLOW-UP (not auto-fixed):

- File-size overruns (3): execute-work.md 444L, add-scope.md 366L, init-project.md 323L
  → Split into orchestrator + reference pair (see process used in v3.2 splits)

- Duplicate docs (1): docs/WORKFLOWS.md vs guides/WORKFLOWS-BEST-PRACTICES.md
  → Judgement call — keep the shorter as pointer file, or merge

- Missing how-to-use guide: /promote-requirement
  → Write quick guide (~75 lines) following the existing how-to-use/ template
```

---

## 6.5 Commit offer

If any fixes were applied, ask before committing:

```
Commit the auto-fixes now?
  [1] Yes — one commit per group (cleaner history)
  [2] Yes — single commit (less noise)
  [3] No — leave staged for review
```

Commit messages follow `.claude/rules/git.md` (conventional, no AI credits, HEREDOC multi-line).

---

## Mode summary

| Mode              | STEP 1-4 | STEP 5                       | STEP 6                                                  |
| ----------------- | -------- | ---------------------------- | ------------------------------------------------------- |
| `/audit-pm`       | ✅ run   | ✅ offer next steps; discuss | ⏭ skip                                                 |
| `/audit-pm --fix` | ✅ run   | ⏭ skip                      | ✅ classify + group + confirm + apply + verify + commit |

---

**Version:** 1.0.0
**Created:** 2026-04-21 (extracted from `audit-pm.md` to meet documentation.md §2.1 soft target)
**Parent:** `audit-pm.md`
