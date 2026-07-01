---
name: add-scope
description: Add or edit a phase, epic, or story with automatic renumbering and cross-reference updates
---

# Add/Edit Scope Command

**📖 Quick Start:** See [how-to-use/add-scope.md](./how-to-use/add-scope.md) for quick guide (~150 lines)

Add or edit phases, epics, or stories with automatic renumbering and cross-reference updates across all project files.

**NOTE:** All documentation content must be in English per `.project-management/README.md` language policy.

**Context:** For how this command fits with others, see `.project-management/INTEGRATION-GUIDE.md`.

---

## Module References

| Module                                                           | Purpose                                                      | Lines |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | ----- |
| [add-scope-input-parsing.md](modules/add-scope-input-parsing.md) | Argument parsing, validation, placement logic                | 293   |
| [add-scope-renumbering.md](modules/add-scope-renumbering.md)     | Renumbering phases/epics, cross-references, integrity checks | 323   |
| [add-scope-edit-mode.md](modules/add-scope-edit-mode.md)         | Editing existing items, cascade updates                      | 283   |

**For AI:** Read modules as needed based on operation (add vs edit, renumbering required, etc.).

---

## Usage

```bash
# ADD new items
/add-scope add phase [position] [--from path/to/file.md]
/add-scope add epic [phase-number] [position] [--from path/to/file.md]
/add-scope add story [phase-number] [epic-number] [--from path/to/file.md]

# EDIT existing items
/add-scope edit phase [phase-number] [--from path/to/file.md]
/add-scope edit epic [phase-number] [epic-number] [--from path/to/file.md]
/add-scope edit story [US-XXX] [--from path/to/file.md]
```

**Examples:**

```bash
/add-scope add epic 2 1              # Add epic to Phase 2 at position 1
/add-scope add story 1 3             # Add story to Phase 1, Epic 3
/add-scope edit story US-005         # Edit story US-005
/add-scope add phase 2 --from x.md  # Add phase at position 2 from file
```

---

## Workflow Overview

### STEP 0: ENTER PLAN MODE (MANDATORY)

**Always enter plan mode before making scope changes.**

1. Parse command arguments
2. Read required context (phase files, backlog, progress)
3. Analyze scope change impact
4. Create detailed plan
5. Present plan and wait for approval
6. Only proceed after user approves

**If no phase files exist:** Abort and suggest `/init-project`.

### STEP 1: Parse & Validate

**[Details in add-scope-input-parsing.md](modules/add-scope-input-parsing.md)**

- Parse arguments (action, type, position)
- Validate command syntax
- Determine placement logic

### STEP 2: Detect Structure & Read Project State

**Structure Detection (Automatic):**

```
if exists(".project-management/input/backlog/README.md"):
    → MODULAR structure (new)
    → Backlog files: input/backlog/phase-*.md
    → Master index: input/backlog/README.md
else if exists(".project-management/input/backlog.md"):
    → MONOLITHIC structure (legacy)
    → Backlog file: input/backlog.md
```

**Read Project State:**

- Read all phase files (`.project-management/output/phases/phase-*.md`)
- **Modular:** Read backlog/README.md + relevant phase file (e.g., backlog/phase-1-foundation.md)
- **Legacy:** Read backlog.md
- Read progress files
- Read DASHBOARD.md (if exists)
- Analyze current structure

### STEP 3: Generate Content

**Interactive:**

- Prompt user for content (title, description, criteria, etc.)
- Validate input
- Apply English-only policy

**From file (--from flag):**

- Read content from file
- Validate format
- Extract required fields

### STEP 4: Preview & Confirmation

**Show preview:**

- Content to be added/edited
- Files to be modified
- Renumbering impact (if applicable)
- New IDs assigned

**Ask:** Proceed? [Yes / No / Revise]

### STEP 5: Execute Changes

**[Renumbering details in add-scope-renumbering.md](modules/add-scope-renumbering.md)**
**[Edit mode details in add-scope-edit-mode.md](modules/add-scope-edit-mode.md)**

**Update files based on detected structure:**

**Modular Structure:**

1. Update phase execution files (`output/phases/phase-*.md`)
2. **Route story to correct backlog file:**
   - Phase 1 stories → `input/backlog/phase-1-foundation.md`
   - Phase 2 stories → `input/backlog/phase-2-core.md`
   - Phase 3 stories → `input/backlog/phase-3-advanced.md`
   - Phase 4 stories → `input/backlog/phase-4-polish.md`
   - Future stories → `input/backlog/future.md`
3. **Update master index:** `input/backlog/README.md` (recalculate statistics)
4. Update progress files
5. **Update DASHBOARD.md** (if exists) - recalculate metrics
6. Apply renumbering if needed

**Legacy Structure:**

1. Update phase execution files (`output/phases/phase-*.md`)
2. Update `input/backlog.md`
3. Update progress files
4. Apply renumbering if needed

### STEP 6: Integrity Check

**Run 5 checks:**

- Phase numbering sequential
- Epic numbering correct (local in phases, global in backlog)
- Story IDs unique (US-XXX)
- Cross-references valid
- Progress metrics updated

**If checks fail:** Roll back changes, report errors.

### STEP 7: Documentation Update

**Ask via AskUserQuestion** (`skippable: true` — Skip logs as deferred decision):

```
question: "Update PRD, technical spec, and architecture docs now?"
header: "docs"
skippable: true
default: "Yes — update now"
options:
  - label: "Yes — update now (Recommended)"
    description: "Invoke /generate-docs immediately to keep docs in sync with the scope change."
  - label: "No — I'll cascade later"
    description: "Skip the docs update for now. Run /generate-docs manually before the next sprint review."
```

**Skip handling:** if the user picks `Skip — answer later`, persist the question per `modules/interactive-clarifications.md` STEP D (which renders the canonical schema from `.project-management/templates/open-questions-template.md`). Pass these field values to the persistence step:

- `category`: `docs-cascade`
- `priority`: `P2`
- `question`: `"Update PRD, technical spec, and architecture docs for {{scope_change_summary}}?"`
- `default`: `"Yes (auto-cascade)"`
- `impact`: `"Documentation drift — docs reference older scope until /generate-docs runs"`
- `applies_to`: `[output/docs/prd.md, output/docs/technical-spec.md, output/docs/architecture.md]`
- `notes`: `"{{action}} {{scope_type}} {{identifier}} on {{date}}; documentation not yet updated"`

(Placeholders: `{{action}}` = "add"/"edit" from §0.1 step 1; `{{scope_type}}` = phase/epic/story from §0.1 step 2; `{{identifier}}` = US-XXX or epic/phase name; `{{date}}` = today.)

The user can resume via `/resolve-questions --priority P2` or `/resolve-questions Q-NNN`, or run `/generate-docs` directly when ready.

### STEP 8: Summary Report

**Show:**

- Action performed
- Items modified
- Files updated
- Integrity check results
- Next steps

---

## Key Rules

**Story IDs (US-XXX):**

- Immutable - never renumbered
- Sequential assignment
- Zero-padded (US-001, US-015, US-123)

**Epic Numbering:**

- LOCAL in phase files (Epic-1, Epic-2 within each phase)
- GLOBAL in backlog.md (Epic-1, Epic-2 across all phases)

**Phase Numbering:**

- Sequential (1, 2, 3, 4)
- Renumber if inserting at position
- Update all cross-references

**Story Points:**

- Fibonacci scale only: 1, 2, 3, 5, 8, 13, 21
- Reject non-Fibonacci values

**Preview Mandatory:**

- Always show preview before changes
- Always wait for user approval
- Never skip confirmation

**Language:**

- English only (per CLAUDE.md)
- Translate non-English input automatically

---

## Success Criteria

✅ Command parses correctly
✅ Content validated
✅ Preview shown and approved
✅ Changes executed successfully
✅ All 5 integrity checks pass
✅ Summary report presented
✅ Documentation update offered

---

## Error Handling

**Common errors:**

- No phase files: Suggest `/init-project`
- Invalid US-XXX format: Use zero-padded (US-005 not US-5)
- Non-Fibonacci points: Reject and show valid values
- Duplicate story ID: Auto-increment to next available
- Missing required fields: Prompt user

---

## Example Walkthrough

**Worked example** (add phase at position 2 with renumbering + integrity checks): see `add-scope-reference.md`.

---

## Quick Reference

| Task                  | Command | Module                                                           |
| --------------------- | ------- | ---------------------------------------------------------------- |
| Parse arguments       | STEP 1  | [add-scope-input-parsing.md](modules/add-scope-input-parsing.md) |
| Renumber phases/epics | STEP 5  | [add-scope-renumbering.md](modules/add-scope-renumbering.md)     |
| Edit existing items   | STEP 5  | [add-scope-edit-mode.md](modules/add-scope-edit-mode.md)         |
| Integrity checks      | STEP 6  | [add-scope-renumbering.md](modules/add-scope-renumbering.md)     |

---

## Structure Support (Modular + Legacy)

The command auto-detects whether the repo uses the **modular** backlog (`input/backlog/README.md`) or **monolithic** `input/backlog.md` and routes stories accordingly. Phase-routing rules, full side-effect list, and a routing example live in `add-scope-reference.md`.

Legacy monolithic projects remain fully supported — suggest `/migrate-to-modular` when convenient.

---

**Documentation Rules:**

- `CLAUDE.md` - English only
- `.claude/rules/git.md` - Conventional commits, NO AI credits

**Related Commands:**

- `/add-backlog-requirement` - Add future requirements (Version 2.0+)
- `/execute-work` - Execute stories from updated backlog
- `/generate-docs` - Update PRD/tech-spec/architecture after scope changes
- `/migrate-to-modular` - Migrate from monolithic to modular backlog structure

---

**Version:** 3.3.0
**Updated:** 2026-04-20 (Modular structure support)

**Note:** This is a condensed overview. For detailed implementation logic, see the module files linked above.
