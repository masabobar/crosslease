# Add Scope — Reference

Companion to `add-scope.md`. Holds the worked example, the full modular-routing rules, and backward-compatibility notes.

---

## Example Walkthrough — Adding a Phase at Position 2

```
User: /add-scope add phase 2

STEP 0: Plan Mode
→ Action: Add phase at position 2
→ Current phases: 1, 2, 3
→ Impact: Existing Phase 2 becomes Phase 3, Phase 3 becomes Phase 4
→ Files affected: phase-2.md, phase-3.md, backlog.md, progress files

STEP 1-3: Parse & Generate
→ Prompt: Phase title?
User: "Advanced Analytics"
→ Prompt: Phase goal?
User: "Implement analytics dashboard and reporting"
→ Prompt: Duration estimate?
User: "2-3 months"

STEP 4: Preview
Phase 2: Advanced Analytics
Goal: Implement analytics dashboard and reporting
Duration: 2-3 months

Renumbering required:
- Current Phase 2 → Phase 3
- Current Phase 3 → Phase 4

Files to modify:
- Create phase-2.md
- Rename phase-2.md → phase-3.md
- Rename phase-3.md → phase-4.md
- Update backlog.md (phase references)
- Update progress files

Proceed? [Yes / No / Revise]

STEP 5: Execute (after Yes)
✅ Created phase-2.md
✅ Renumbered phase-2.md → phase-3.md
✅ Renumbered phase-3.md → phase-4.md
✅ Updated backlog.md
✅ Updated progress files

STEP 6: Integrity Checks
✅ Phase numbering: Sequential (1, 2, 3, 4)
✅ Epic numbering: Correct
✅ Story IDs: Unique
✅ Cross-references: Valid
✅ Progress metrics: Updated

STEP 7: Documentation
AskUserQuestion: "Update PRD, technical spec, and architecture docs now?"
  → Yes — update now (Recommended) / No — I'll cascade later / Skip — answer later

STEP 8: Summary
✅ Added Phase 2: Advanced Analytics
✅ Renumbered 2 existing phases
✅ Updated 5 files
✅ All integrity checks passed
```

---

## Modular Backlog Structure — Full Support

**Auto-detected** when `.project-management/input/backlog/README.md` exists.

### Phase Routing Rules

| Story characteristics     | Target file                           |
| ------------------------- | ------------------------------------- |
| P0 + foundation keywords  | `input/backlog/phase-1-foundation.md` |
| P0/P1 + core keywords     | `input/backlog/phase-2-core.md`       |
| P1/P2 + advanced keywords | `input/backlog/phase-3-advanced.md`   |
| P2 + polish/bugs          | `input/backlog/phase-4-polish.md`     |
| P3 or future keywords     | `input/backlog/future.md`             |

### Side-effects on Add/Edit

1. Write story to the correct phase file per the routing table.
2. Recalculate statistics in `input/backlog/README.md` (story counts, point totals per phase).
3. If `output/progress/DASHBOARD.md` exists — refresh its metrics.
4. Apply renumbering to **phase execution** files (`output/phases/phase-*.md`) — story IDs stay immutable.

### Routing Example

```
User: /add-scope add story 1 3
→ Detects modular structure exists
→ Determines story belongs to Phase 1
→ Writes to input/backlog/phase-1-foundation.md (not backlog.md)
→ Updates input/backlog/README.md statistics
→ Updates output/progress/DASHBOARD.md metrics
```

**Implementation details:** `modules/add-scope-input-parsing.md` (parse + route) and `modules/backlog-organization.md` (phase-file structure).

---

## Monolithic Backlog — Legacy Support

Triggered when `.project-management/input/backlog.md` exists and no modular `backlog/` directory is present.

- All stories written to the single `input/backlog.md`.
- Fully functional — no breakage for legacy projects.
- Recommend `/migrate-to-modular` at the user's next convenience.

---

## STEP 7 — Documentation Update

Uses AskUserQuestion with three outcomes:

- **Yes — update now (Recommended)** → invoke `/generate-docs` immediately.
- **No — I'll cascade later** → skip the docs update; user runs `/generate-docs` manually.
- **Skip — answer later** → log a `docs-cascade` P2 entry in `input/open-questions.md` (resume via `/resolve-questions`).

Full template definition lives in `add-scope.md` STEP 7. The skip entry follows the schema from `.project-management/templates/open-questions-template.md` (rendered by `modules/interactive-clarifications.md` STEP D).

---

## Related

- `add-scope.md` — orchestrator
- `modules/add-scope-input-parsing.md` — argument parsing
- `modules/add-scope-renumbering.md` — renumbering + integrity
- `modules/add-scope-edit-mode.md` — edit flows
- `modules/add-scope-readme-update.md` — keeps `backlog/README.md` totals in sync

---

**Version:** 3.3.0
**Created:** 2026-04-21 (extracted from `add-scope.md` to meet documentation.md §2.1 soft target)
**Parent:** `add-scope.md`
