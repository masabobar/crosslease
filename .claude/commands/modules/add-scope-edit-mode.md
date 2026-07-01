# Add Scope — Edit Mode Module

**Referenced by:** `add-scope.md` STEP 3 (Sections 3.1-3.3) & STEP 5 (Sections 5.1-5.4)

---

## Overview

Edit mode modifies existing phases, epics, or stories. Changes cascade through metrics and cross-references automatically. No new items are created — only existing content is updated.

**Multiple changes per edit:** User can request changes to several fields in a single edit. Claude applies ALL changes in one operation, shows a combined preview.

---

## STEP 3 (Edit): LOAD & DISPLAY CURRENT CONTENT

### 3.1 Edit Phase

**Claude:**

1. Read `phase-{N}.md`
2. Display summary (epic-level only, NOT individual stories — too verbose):

```
EDITING: Phase {N}: {Name}

Current State:
- Status: {Status}
- Duration: {Start} to {End}
- Epics: {count}
- Stories: {count}
- Total Story Points: {points}
- Goal: {goal}

Epics in this phase:
  Epic 1: {Name} ({N} points, {status})
  Epic 2: {Name} ({N} points, {status})
```

3. If `--from` file → Claude parses file and applies as changes (preview shown before saving)
4. If no `--from` → Claude asks:

```
What to change?
[1] Phase name/goal
[2] Duration/dates
[3] Status
[4] Add epic to this phase
[5] Remove an epic from this phase
[6] Describe changes freely
```

Selecting [4] → Claude automatically executes `/add-scope add epic [N]` (context preserved, no new command needed).

### 3.2 Edit Epic

**Claude:**

1. Read target phase file, extract specific epic section
2. Display:

```
EDITING: Epic {N}: {Name} (Phase {M})

Current State:
- Priority: {P0/P1/P2}
- Status: {Status}
- Total Story Points: {points}
- Dependencies: {deps}

Stories:
  US-{XXX}: {Title} ({N} points, {status})
  US-{XXX}: {Title} ({N} points, {status})
```

3. If `--from` file → Claude parses and applies
4. If no `--from` → Claude asks:

```
What to change?
[1] Epic name/description
[2] Priority
[3] Status
[4] Dependencies
[5] Add story to this epic
[6] Remove a story from this epic
[7] Describe changes freely
```

Selecting [5] → Claude automatically executes `/add-scope add story [M] [N]`.
Selecting [6] → Claude shows story list, asks which to remove, requires confirmation before deletion.

### 3.3 Edit Story

**Claude:**

1. Search phase files in order: `phase-1.md`, `phase-2.md`, ..., `phase-N.md`. First match returns location. Stop search on first find.
   - If not found in any phase → search `backlog.md`
   - If found in backlog only → error: "Orphaned story. US-{XXX} exists in backlog but not in any phase file. Run /project-status to investigate."
   - If not found anywhere → error with list of valid story IDs and locations
2. Display full story content:

```
EDITING: US-{XXX}: {Title}

Location: Phase {M} → Epic {N}: {Epic Name}

- Story Points: {points}
- Priority: {P0/P1/P2}
- Status: {status}
- Dependencies: {deps}

User Story:
  {As a [role], I want to [action] so that [benefit]}

Acceptance Criteria:
  - [ ] {Criterion 1}
  - [ ] {Criterion 2}

Technical Notes:
  {notes}
```

3. If `--from` file → Claude parses and applies
4. If no `--from` → Claude asks:

```
What to change?
[1] Story title/description
[2] Acceptance criteria
[3] Story points
[4] Priority
[5] Dependencies
[6] Status
[7] Technical notes
[8] Describe changes freely
```

User can select multiple options or use [8] to describe several changes at once.

---

## STEP 5 (Edit): APPLY CHANGES

### 5.1 Phase Edits

| Change         | Claude Actions                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Name/Goal      | Update heading `# Phase {N}: {NEW_NAME}` in phase file. Update `current-status.md` if it lists phase names. |
| Status         | Update `**Status:**` field in phase file. Update `current-status.md`.                                       |
| Duration/Dates | Update `**Duration:**`, `**Started:**`, `**Target Completion:**` fields.                                    |
| Remove epic    | See Section 5.4 (Removing Items).                                                                           |

### 5.2 Epic Edits

| Change           | Claude Actions                                                    |
| ---------------- | ----------------------------------------------------------------- |
| Name/Description | Update heading in phase file + matching entry in `backlog.md`.    |
| Priority/Status  | Update fields in phase file.                                      |
| Dependencies     | Update in phase file. Verify new deps reference valid US-XXX IDs. |
| Remove story     | See Section 5.4 (Removing Items).                                 |

### 5.3 Story Edits

| Change              | Claude Actions                                                            | Cascades?              |
| ------------------- | ------------------------------------------------------------------------- | ---------------------- |
| Title/Description   | Update in phase file + `backlog.md`                                       | No                     |
| Acceptance criteria | Replace section in phase file + `backlog.md`                              | No                     |
| Priority            | Update in phase file + `backlog.md`                                       | No                     |
| Dependencies        | Update in phase file + `backlog.md`. Verify all US-XXX refs are valid.    | No                     |
| Status              | Update in phase file. If changed to "Completed": update progress metrics. | Yes → progress         |
| Technical notes     | Update in phase file                                                      | No                     |
| **Story points**    | **See Section 5.3.1 — cascading update**                                  | **Yes → epic → phase** |

#### 5.3.1 Story Points Change (Cascading)

Changes propagate upward. Works for BOTH increases AND decreases:

```
1. Claude updates story: **Story Points:** {old} → {new}
2. Calculate: diff = new - old (can be positive or negative)
3. Update epic total:
   Find: ### Epic {N}: {Name} ({old_epic_total} story points)
   Replace: ### Epic {N}: {Name} ({old_epic_total + diff} story points)
4. Update phase metrics:
   Total Story Points: {old_phase_total + diff}
5. Update backlog:
   **Estimate:** {new} story points
```

**Example (increase):** US-005 changes from 5 → 8 points (diff = +3):

```
Story US-005: 5 → 8 points
Epic "Product Management": 21 → 24 points
Phase 2 total: 45 → 48 points
Backlog US-005 estimate: 5 → 8 points
```

**Example (decrease):** US-005 changes from 8 → 3 points (diff = -5):

```
Story US-005: 8 → 3 points
Epic "Product Management": 24 → 19 points
Phase 2 total: 48 → 43 points
Backlog US-005 estimate: 8 → 3 points
```

**Story point rules:** Fibonacci scale only (1, 2, 3, 5, 8, 13, 21). If new value is non-Fibonacci → Claude converts to nearest and shows in preview.

**If heading format doesn't match exactly:** Claude recalculates by summing all story points in the epic/phase and writes the correct total (does not abort).

---

### 5.4 Removing Items

#### Removing an Epic from a Phase

**Claude:**

1. Scan ALL phase files for stories that depend on stories in the epic being removed (DIRECT dependencies only, not transitive chains)
2. If dependencies found → warn BEFORE proceeding:

```
WARNING: Removing this epic will break dependencies:
  US-015 depends on US-010 (being removed)
  US-018 depends on US-014 (being removed)
```

If > 5 dependencies: show first 5 + "and [N] more. Type 'list all' to see full list."

```
Proceed anyway? [Yes / No]
```

3. If user confirms:
   - Remove epic section from phase file
   - Renumber subsequent epics: Epic 3 → Epic 2 (if Epic 2 removed) — LOCAL numbering only
   - Remove epic's stories from `backlog.md`
   - Update phase metrics (subtract points, story count, epic count)
4. Phase must retain at least 1 epic. If removing the last epic → error: "Cannot remove the only epic in this phase. Remove the entire phase instead."

#### Removing a Story from an Epic

**Claude:**

1. Check for dependencies (same scan as above — direct only)
2. If dependencies found → warn with same format
3. If user confirms:
   - Remove story section from phase file
   - Remove from `backlog.md`
   - Update epic total story points (subtract)
   - Update phase metrics (subtract)
4. Epic must retain at least 1 story. If removing the last story → error: "Cannot remove the only story in this epic. Remove the entire epic instead."

---

## Edit with --from File

When `--from` is provided, Claude parses file to determine changes and shows a diff preview:

```
EDIT PREVIEW: US-{XXX}: {Title}

CHANGES:
  Story Points: 5 → 8 (+3)
  Priority: P1 → P0
  Acceptance Criteria:
    + [ ] New criterion added
    - [ ] Old criterion removed

CASCADE EFFECTS:
  Epic "Product Management": 21 → 24 points
  Phase 2 total: 45 → 48 points

FILES TO UPDATE:
  - .project-management/output/phases/phase-2.md
  - .project-management/input/backlog.md

Apply changes? [Yes / No / Revise]
```

**--from file replaces target content** (not merge). Existing content is overwritten. Preview shows all changes before confirmation.

If file format is unrecognized → Claude shows expected format and asks user to clarify which fields to update.

---

## Error Handling

| Error                             | Claude Recovery                                                            |
| --------------------------------- | -------------------------------------------------------------------------- |
| Item not found                    | Show list of valid options with IDs, names, and locations                  |
| Broken dependencies after removal | Warn user with specific dep list, require [Yes/No] confirmation            |
| Story points cascade fails        | Recalculate all totals from scratch (sum individual stories in epic/phase) |
| File changed during edit          | Re-read file, reapply changes, show updated preview before saving          |
| --from file format unrecognized   | Show expected format, ask user to clarify fields                           |
| Removing last epic/story          | Error: "Cannot remove only item. Remove parent instead."                   |

---

**Version:** 3.0.0
**Last Updated:** 2026-04-02
