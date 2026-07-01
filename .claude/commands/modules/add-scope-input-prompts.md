# Add Scope — Input Prompts & Validation

Companion to `add-scope-input-parsing.md`. Holds the concrete content-gathering prompts per action/scope, the edit-mode submenus, and validation rules.

---

## Content-Gathering Prompts

Used from STEP 0.3 when the user didn't pass `--from <file>`.

### Add Phase

```
Describe the new phase:

1. Phase name           (e.g. "API Integration & External Services")
2. Phase goal/description
3. Estimated duration   (e.g. "6 weeks", "2 months")
4. Epics and stories    (describe features — I'll structure them)

Write as much or as little as you want. I'll fill in details using the project template.
```

Parse for:

- Phase name **[REQUIRED]** — if missing, ask follow-up.
- Phase goal **[REQUIRED]** — if missing, ask follow-up.
- Epics/stories **[OPTIONAL]** — generate if not provided.
- Duration **[OPTIONAL]** — estimate if not provided.

### Add Epic

```
Describe the new epic:

1. Epic name (e.g. "Notification System")
2. What this epic covers
3. User stories (or describe features — I'll create stories)
4. Priority (P0/P1/P2)

I'll generate acceptance criteria and story-point estimates.
```

Parse for: Epic name **[REQUIRED]**, description **[OPTIONAL]**, stories **[OPTIONAL]**, priority **[OPTIONAL, default P1]**.

### Add Story

```
Describe the new user story:

1. Story title   (e.g. "Email Notifications for Orders")
2. User story:   "As a [role], I want to [action] so that [benefit]"
3. Acceptance criteria (or describe what should work)
4. Priority      (P0/P1/P2)
5. Estimate      (Fibonacci 1/2/3/5/8/13) — or I'll estimate

I'll generate the full story with Definition of Done.
```

Parse for: title **[REQUIRED]**, user-story narrative **[OPTIONAL — generate if missing]**, acceptance criteria **[OPTIONAL]**, priority **[OPTIONAL, default P1]**, estimate **[OPTIONAL — estimate if missing]**.

**Story-point rule:** Fibonacci only (1, 2, 3, 5, 8, 13, 21). Non-Fibonacci input (e.g. "4" or "small") → convert to nearest Fibonacci value, show conversion in preview.

---

## Edit-Mode Submenus

### Edit Phase

```
What to change about Phase [N]: [Name]?

[1] Phase name/goal
[2] Duration/dates
[3] Status
[4] Add epic to this phase
[5] Remove an epic from this phase
[6] Describe changes freely
```

`[4]` → auto-executes `/add-scope add epic [N]` with context preserved — user does NOT need to re-type the command.

### Edit Epic

```
What to change about Epic [N]: [Name] in Phase [M]?

[1] Epic name/description
[2] Priority
[3] Status
[4] Dependencies
[5] Add story to this epic
[6] Remove a story from this epic
[7] Describe changes freely
```

`[5]` → auto-executes `/add-scope add story [M] [N]`.
`[6]` → Claude shows stories in epic, asks which to remove, requires confirmation.

### Edit Story

```
What to change about [US-XXX]: [Title]?

[1] Story title/description
[2] Acceptance criteria
[3] Story points
[4] Priority
[5] Dependencies
[6] Status
[7] Technical notes
[8] Describe changes freely
```

**Multiple changes:** user can select multiple options or use `[8]` to describe several changes at once. All changes apply in a single operation.

---

## Validation Rules

### Position (STEP 2)

- Must be a positive integer in range `1 .. total_items + 1`.
- Validated immediately after user input.
- Out of range → show valid range, re-prompt. Max 3 attempts, then abort with a clear error.

### Content (STEP 0.3 outputs)

- Phase: must have name **and** goal.
- Epic: must have name.
- Story: must have title.
- Missing required field → ask follow-up before proceeding. Don't silently default a required field.

### Edit References

- Phase number must correspond to an existing `phase-N.md` file.
- Epic number must exist inside the specified phase file.
- `US-XXX` must exist in at least one phase file.
- If a story appears in backlog but **not** in any phase file → error:
  ```
  Orphaned story found. Run /project-status to investigate.
  ```
- If `US-XXX` not found → show list of valid options:
  ```
  US-[XXX] not found. Available stories:
    US-001: User Registration        (Phase 1, Epic 1)
    US-002: User Login               (Phase 1, Epic 1)
    US-005: Create Product Listing   (Phase 2, Epic 2)
    …
  ```

### File-format expectations

- Backlog files under 200 lines (documentation.md §2.1). After editing, if the target file crosses the limit, flag it — don't split automatically; ask user.
- README.md totals must match the per-phase sums after any add/edit (handled by `add-scope-readme-update.md`).

---

## Related

- `add-scope-input-parsing.md` — STEP 0/2 flow and structure detection
- `add-scope-renumbering.md` — ID renumbering logic for `add phase` at position < N+1
- `add-scope-edit-mode.md` — deep-dive on edit flows
- `add-scope-readme-update.md` — keeps `backlog/README.md` totals in sync

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `add-scope-input-parsing.md`)
