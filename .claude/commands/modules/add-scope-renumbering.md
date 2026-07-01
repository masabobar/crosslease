# Add Scope — Renumbering Module

**Referenced by:** `add-scope.md` STEP 5 (sections 5.1-5.4) and STEP 6 (section 5.6)
**Companion:** `add-scope-renumbering-checks.md` (Step 5.6 integrity verification + recovery procedures)

---

## STEP 5 — Execute Changes

This module handles all file mutations: renaming, content updates, insertions, metric recalculation.

**Atomicity rule:** if ANY sub-step fails, Claude **aborts** the entire STEP 5, displays which modifications succeeded/failed, and asks the user to review manually. No partial mutations.

---

## 5.1 Phase Renumbering — add phase at position N

### 5.1.1 Rename Phase Files

**CRITICAL:** rename from HIGHEST number downward to prevent file collisions. Never iterate forward (N up) — only backward (T down to N).

```
Given: insert_position = N, total_phases = T

For i = T down to N:
  Rename: phase-{i}.md → phase-{i+1}.md
```

**Example — insert at position 2 with 4 existing phases:**

```
phase-4.md → phase-5.md   ← rename highest first
phase-3.md → phase-4.md
phase-2.md → phase-3.md
→ Position 2 is now free for the new phase
```

**If a rename fails** (file locked, permission error): abort immediately. Do NOT continue to the next rename. Display "Rename failed: phase-{i}.md → phase-{i+1}.md. Reason: [error]. Aborting. Files renamed so far: [list]."

### 5.1.2 Update content in each renamed file

Open each renamed file and perform find-and-replace (exact string match, no regex):

| Find                                     | Replace                                   | Location                                            |
| ---------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| `# Phase {old_N}:`                       | `# Phase {new_N}:`                        | Title heading (line 1)                              |
| `Phase {old_N}` in prose                 | `Phase {new_N}`                           | Whole-word — NOT inside filenames like `phase-N.md` |
| References in "Carry Over to Next Phase" | `Phase {old_N + 1}` → `Phase {new_N + 1}` | Carry-over section near end                         |
| `Phase {old_N} -` in Final Metrics       | `Phase {new_N} -`                         | Final Metrics heading                               |

If the format doesn't match exactly: flag and continue — don't abort for cosmetic mismatches.

### 5.1.3 Update cross-references in ALL phase files

Scan every file for `Phase {X}` references where `X >= insert_position`:

Files to scan:

1. All phase files (including non-renamed, e.g. `phase-1.md`)
2. `.project-management/input/backlog.md` (legacy) or `input/backlog/*.md` (modular)
3. `.project-management/output/progress/current-status.md`

Rule: for each `Phase {X}` reference where `X >= insert_position`, replace with `Phase {X+1}`. References to phases **before** `insert_position` stay unchanged.

### 5.1.4 Create new phase file

1. Read template `.project-management/templates/phase-template.md`. If missing → abort with clear error.
2. Replace all `{{PLACEHOLDERS}}`:
   - `{{PHASE_NUMBER}}` → `insert_position`
   - `{{PHASE_NAME}}` → user input
   - `{{PHASE_GOAL_DESCRIPTION}}` → user input
   - `{{STATUS}}` → `Planning`
   - Epic and story sections → generated from input content
3. Assign story IDs: `US-{max_story_id + 1}`, `US-{max_story_id + 2}`, … (increment per story).
4. Use phase-LOCAL epic numbering: Epic 1, Epic 2, …
5. Write to `.project-management/output/phases/phase-{N}.md`.

### 5.1.5 Update backlog

1. Add new epics with GLOBAL numbers (increment `max_epic_number` for EACH):
   - `## Epic {max_epic_number + 1}: {Name}`
   - `## Epic {max_epic_number + 2}: {Name}`
2. Add stories under each epic with assigned US-XXX IDs.
3. Write updated backlog (modular: phase-routed file; monolithic: `input/backlog.md`).

### 5.1.6 Update progress

1. Read `.project-management/output/progress/current-status.md`.
2. Update total phases count, total stories count, total story points.
3. Add new phase to phase list (if tracked individually).
4. Update any `Phase {N}` references that shifted (same rule as 5.1.3).
5. Write.

---

## 5.2 Epic Renumbering — add epic to phase at position P

### 5.2.1 Insert in phase file

1. Read `phase-{target_phase}.md`.
2. Find insertion point using `### Epic {N}:` headers.
3. Insert new epic markdown block at position P:

   ```markdown
   ### Epic {P}: {Name} ({points} story points)

   **Priority:** {P0/P1/P2}
   **Status:** Todo
   **Dependencies:** {deps or "None"}

   **User Stories:**

   #### US-{XXX}: {Story Title}

   - **Story Points:** {N}
   - **Priority:** {P0/P1/P2}
   - **Status:** Todo
     …
   ```

4. Write the file.

### 5.2.2 Renumber subsequent epics

Epic numbering is LOCAL to each phase file:

```
For each epic at position >= P in the same phase file:
  Find:    ### Epic {N}:
  Replace: ### Epic {N+1}:
```

This does NOT affect epic numbering in other phase files or in backlog (backlog uses global numbers).

### 5.2.3 Update phase metrics

In the same phase file:

- `Total Story Points: {old + new_epic_points}`
- `Total Stories:      {old + new_story_count}`
- `Total Epics:        {old + 1}`

### 5.2.4 Update backlog (global epic numbering)

- New epic: `## Epic {max_epic_number + 1}: {Name}`
- Add all stories under it with assigned US-XXX IDs.
- Multiple epics: increment globally (max+1, max+2, …).

---

## 5.3 Story Addition — add story to epic

### 5.3.1 Insert in phase file

1. Read target phase file.
2. Find `### Epic {target_epic}:`.
3. Find the last `#### US-{XXX}:` within that epic (scan until next `### Epic` or end of section).
4. Insert new story AFTER the last story in that epic.
5. Write.

### 5.3.2 Update epic total

```
Find:    ### Epic {N}: {Name} ({old_points} story points)
Replace: ### Epic {N}: {Name} ({old_points + new_points} story points)
```

If the heading format doesn't match exactly → recalculate by summing all story points in the epic and write the correct total.

### 5.3.3 Update phase metrics

- `Total Story Points: {old + new_points}`
- `Total Stories:      {old + 1}`

### 5.3.4 Update backlog

Append the story to the matching epic in the backlog file:

```markdown
### US-{XXX}: {Title}

**Priority:** {Priority}
**Story:** As a [role], I want to [action] so that [benefit]

**Acceptance Criteria:**

- [ ] {Criterion 1}
- [ ] {Criterion 2}

**Estimate:** {N} story points
**Dependencies:** {Dependencies or "None"}
```

---

## 5.4 Append (no-renumbering path)

When `position == total + 1`:

| Scope | Actions                                                    | Renumbering |
| ----- | ---------------------------------------------------------- | ----------- |
| Phase | Create `phase-{T+1}.md` + update backlog + update progress | None        |
| Epic  | Append epic section at end of phase's epics                | None        |
| Story | Append story at end of epic's stories                      | None        |

Simplest path — content creation + metric updates only. No file renames.

---

## 5.5 Cross-Reference Rules

### References that MUST be updated

| Location                | What changes                     | When            |
| ----------------------- | -------------------------------- | --------------- |
| Phase file title        | `# Phase N:`                     | Phase insertion |
| Phase file prose        | `Phase N` mentions               | Phase insertion |
| Carry Over sections     | "Next Phase" refs                | Phase insertion |
| Progress current-status | Phase numbers + metrics          | Any add         |
| Backlog epic numbers    | `## Epic N:` (global)            | Epic addition   |
| Phase metric totals     | Story points, counts, epic count | Epic/Story add  |
| Epic heading totals     | `({N} story points)`             | Story add       |

### References that NEVER change

| Reference                      | Reason                                               |
| ------------------------------ | ---------------------------------------------------- |
| `US-XXX` story IDs             | Immutable identifiers — never renumbered             |
| Story dependency refs (US-XXX) | Based on immutable IDs                               |
| Git commit references          | Historical records                                   |
| Progress log entries           | Historical — add "(formerly Phase N)" note if needed |

---

## 5.6 Integrity verification

After all mutations complete. If ANY check fails → abort remaining STEPs (7, 8).

Five checks: phase-file continuity, story-ID uniqueness, backlog consistency, metrics accuracy, dangling references. **Each check and its recovery procedure:** `add-scope-renumbering-checks.md`.

---

**Version:** 3.3.0
**Last Updated:** 2026-04-21 (split: integrity-check procedures moved to companion)
**Related:** `add-scope-renumbering-checks.md`, `add-scope-input-parsing.md`, `add-scope-readme-update.md`
