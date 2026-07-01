# Add Scope — Input Parsing Module

**Referenced by:** `add-scope.md` STEP 0 (sections 0.1-0.3) and STEP 2 (sections 2.1-2.4)
**Companion:** `add-scope-input-prompts.md` (content-gathering prompts per action/scope, validation rules, edit-mode submenus)

---

## STEP 0 — Parse arguments & validate

### 0.1 Parse Command Arguments

Arguments are extracted in strict left-to-right order.

**1. Action** (required): `add` or `edit`.

If missing/invalid, ask via AskUserQuestion (gating, no Skip):

```
question: "What action?"
header: "action"
skippable: false
options:
  - label: "Add new (Recommended)"
    description: "Add a new phase, epic, or story."
  - label: "Edit existing"
    description: "Modify an existing phase, epic, or story."
```

**2. Scope type** (required): `phase`, `epic`, or `story`.

If missing/invalid, ask via AskUserQuestion (gating, no Skip):

```
question: "What type of scope?"
header: "scope"
skippable: false
options:
  - label: "Story (Recommended)"
    description: "A single user story within an epic."
  - label: "Phase"
    description: "A complete development phase."
  - label: "Epic"
    description: "A feature group within a phase."
```

**3. Position / Identifier** (context-dependent):

| Action + Scope | Argument Order                 | Example                        | Default            |
| -------------- | ------------------------------ | ------------------------------ | ------------------ |
| `add phase`    | `[position]`                   | `/add-scope add phase 2`       | Append             |
| `add epic`     | `[phase-number] [position]`    | `/add-scope add epic 2 1`      | Append to phase    |
| `add story`    | `[phase-number] [epic-number]` | `/add-scope add story 1 3`     | Auto-assign US-XXX |
| `edit phase`   | `[phase-number]`               | `/add-scope edit phase 3`      | —                  |
| `edit epic`    | `[phase-number] [epic-number]` | `/add-scope edit epic 2 1`     | —                  |
| `edit story`   | `[US-XXX]`                     | `/add-scope edit story US-005` | —                  |

**US-XXX format:** zero-padded 3 digits (`US-005`, not `US-5`). Wrong format → "Story ID must be in format US-XXX (e.g., US-005)."

**4. `--from <path>`** (optional): content file.

- File found → read content, store as `input_content`.
- File not found → error + 2-retry fallback (enter path / describe manually). After 2 failures → require manual input.

---

### 0.2 Validate Project State & Detect Structure

**Check phase files exist in `.project-management/output/phases/`:**

- Directory + phase files exist → continue.
- Directory exists but no phase files → abort: "No phase files found. Run /init-project first."
- Directory doesn't exist → abort: "Project management structure not found. Create `.project-management/` and run /init-project first."

**Structure detection (automatic):**

```
if exists(".project-management/input/backlog/README.md"):
    structure_type = "modular"
    backlog_files = {
        1: "input/backlog/phase-1-foundation.md",
        2: "input/backlog/phase-2-core.md",
        3: "input/backlog/phase-3-advanced.md",
        4: "input/backlog/phase-4-polish.md",
        "future": "input/backlog/future.md",
    }
else if exists(".project-management/input/backlog.md"):
    structure_type = "monolithic"
    backlog_file = "input/backlog.md"
```

Stores `structure_type` + `backlog_files` (or `backlog_file`). Used in STEP 5 to determine where stories are written.

---

### 0.3 Gather Content (if no `--from` file)

Claude prompts based on action + scope type. Concrete prompts + field-level parsing rules live in `add-scope-input-prompts.md` § Content-Gathering Prompts.

Summary of required vs optional fields:

| Scope | Required   | Optional (Claude fills in)                                                                 |
| ----- | ---------- | ------------------------------------------------------------------------------------------ |
| Phase | name, goal | duration, epics/stories                                                                    |
| Epic  | name       | description, stories, priority (default P1)                                                |
| Story | title      | user-story narrative, acceptance criteria, priority (default P1), story points (Fibonacci) |

---

## STEP 2 — Determine Placement (add only)

`edit` actions **skip** all of STEP 2; the identifier already specifies the target.

### 2.1 Phase Placement

Prompt shows existing phases + "Append" option. Position semantics:

- Position 1 → insert BEFORE current Phase 1 (everything shifts +1).
- Position K (2..N) → insert BEFORE current Phase K (Phase K+ shifts +1).
- Position N+1 → append (no renumbering).

Valid range: 1 .. N+1. Invalid input → re-prompt (max 3 attempts, then abort).

Stores: `insert_position`.

### 2.2 Epic Placement

Two-step prompt:

1. Select target phase (1..4).
2. Select position within the phase (epics are LOCAL to phase — Epic 1-3 in Phase 2 are independent of Epic 1-2 in Phase 1).

Stores: `target_phase`, `insert_position`.

### 2.3 Story Placement

Three steps:

1. Select target phase.
2. Select target epic in that phase.
3. Claude auto-assigns the story ID: `US-{max_story_id + 1}` (globally unique across all phases).

Story is appended at the end of the epic's story list (no position selection for stories).

Stores: `target_phase`, `target_epic`, `new_story_id`.

### 2.4 Determine Target Backlog File (modular only)

If `structure_type == "modular"`, map `target_phase` to the concrete backlog file:

```
Phase 1 → input/backlog/phase-1-foundation.md
Phase 2 → input/backlog/phase-2-core.md
Phase 3 → input/backlog/phase-3-advanced.md
Phase 4 → input/backlog/phase-4-polish.md
Future  → input/backlog/future.md
```

Stores `target_backlog_file`.

**Example:**

```
User: /add-scope add story 2 3
  target_phase         = 2
  target_epic          = 3
  structure_type       = "modular"
  target_backlog_file  = "input/backlog/phase-2-core.md"
  → Story written to phase-2-core.md (not backlog.md)
```

If `structure_type == "monolithic"`: all stories go to `input/backlog.md` (legacy behavior).

---

## Validation & edge cases

Full detail (position bounds, content-field requirements, edit-reference lookup, orphan-story error message): `add-scope-input-prompts.md` § Validation Rules.

---

**Version:** 3.3.0
**Last Updated:** 2026-04-21 (split: prompts + validation moved to companion)
**Related:**

- `backlog-organization.md` — modular backlog structure spec
- `add-scope-input-prompts.md` — content prompts + validation details
- `add-scope-readme-update.md` — README.md stats updater
