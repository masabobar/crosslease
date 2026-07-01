---
name: screen-map
description: Generate or refresh the screen inventory map (input/screens/screen-map.md) — consolidated screen-by-screen view with API endpoints derived from frontend stories
---

# Screen Map

**📖 Quick Start:** See [how-to-use/screen-map.md](./how-to-use/screen-map.md) for the quick guide.

Regenerate the screen inventory artifact (`.project-management/input/screens/screen-map.md`) from frontend stories in the backlog. Hand-curated content (navigation hierarchy, screen metadata, descriptions) is preserved; API endpoint columns + Status are re-derived from the latest story files.

Rule: `.claude/rules/screen-inventory.md` — when this artifact applies (web CMS / mobile / web with admin), the source-of-truth split, and drift detection.

---

## Usage

```bash
/screen-map
```

No arguments. Detects project structure, reads stories, refreshes derived columns, reports drift.

---

## 📋 YOUR TASK — MANDATORY WORKFLOW

### STEP 0: Verify applicability

1. Read `.project-management/input/technologies.md` (or `scope.md` if technologies.md absent) to determine project type.
2. **If project is API-only / backend-only / CLI / library** (no UI surface) → STOP with a friendly message: "This project has no UI surface; the screen inventory does not apply (see `.claude/rules/screen-inventory.md` §1)."
3. **If `input/screens/screen-map.md` does not exist** AND project DOES have a UI:
   - Inform user the artifact is missing.
   - Offer to scaffold from `.project-management/templates/screen-map-template.md` (same scaffold that `/init-project` runs). Ask `[Yes / No]`.
   - If Yes → copy template, then proceed to STEP 1.
   - If No → exit with link to the rule.

---

### STEP 1: Read frontend stories

1. Glob `.project-management/input/backlog/phase-*.md` plus `future.md`.
2. For each phase file, extract every story where:
   - The story header / fields indicate it is a frontend story (per `.claude/rules/screen-driven-backlog.md` — typically `**Type:** Frontend (Web / Mobile / Both)`)
   - The story has a `**Screen:**` field (single screen) or wizard step list
   - The story has an `**API Endpoints Used:**` table
3. For each extracted story record:
   - Story ID (e.g. `US-042`)
   - Screen ID / name (from `**Screen:**` — strip any wizard step suffix into a separate `wizard_steps` list)
   - Story status (`Todo / In Progress / Completed / Blocked` from `**Status:**`)
   - API endpoints list: `[(method, path, purpose), ...]` from the table rows
4. If a story is marked `**Type:** Frontend` but missing `**Screen:**` or `**API Endpoints Used:**` → log a warning, include it in the drift report (STEP 4) under "malformed frontend stories".

---

### STEP 2: Read current screen-map and preserve hand-curated content

1. Read `.project-management/input/screens/screen-map.md`.
2. Parse sections:
   - **§1 Navigation Hierarchy** — preserve verbatim (hand-curated, never auto-modified)
   - **§2 Screen Registry** — for each entry, preserve: `Screen ID`, `Name`, `Type`, `Path`, `Auth`, `Description`, `Stories` (the hand-listed back-links)
   - **§3 Removed Screens** — preserve verbatim
3. For each entry, the **API Endpoints Used** table and **Status** field are derived (next step) — discard the previous values; they will be regenerated.

For multi-file split (`input/screens/<domain>.md`): read each file and treat as a separate registry; the regeneration runs per-file.

---

### STEP 3: Regenerate derived columns

For each Screen Registry entry:

1. **API Endpoints Used table:**
   - Find every story (from STEP 1) whose Screen field matches this entry's Screen ID or Name.
   - Union all `(method, path, purpose)` tuples from those stories' API tables.
   - Deduplicate by `(method, path)`; if the same endpoint appears in multiple stories, list all source story IDs in the `Source story` column comma-separated.
   - Sort: GET first, then POST/PUT/PATCH/DELETE; within each method group, alphabetical by path.
   - If no stories link to this screen → API table shows `_(no stories linked)_` and the screen is reported as an orphan in the drift report.

2. **Status field:**
   - Aggregate the linked stories' statuses:
     - All stories Completed → `Completed (N/N)`
     - At least one Blocked → `Blocked (X blocked of N)`
     - At least one In Progress → `In Progress (X/N completed)`
     - All Todo (or no stories yet) → `Todo (0/N)` or `No stories linked`

3. Update the **Last Refreshed By `/screen-map`** field at the top of the file to today's date.

---

### STEP 4: Drift detection

Build a list of drift items:

1. **Stories referencing screens not in the map** — every distinct Screen value from STEP 1 that has no matching entry in the registry. Suggest adding entries.
2. **Orphan screens** — registry entries with no backing story.
3. **Malformed frontend stories** — flagged in STEP 1 (Frontend type but missing Screen or API table).
4. **Navigation hierarchy mismatch** — Screen IDs/names appearing in §1 Navigation Hierarchy but not in §2 Registry (and vice versa). Names must match exactly.

Write the result into **§4 Drift Report** of the screen-map file, replacing the previous report. Each item is one bullet; if a category is empty, write `_(none)_`.

---

### STEP 5: Write back

1. Reassemble the file: §1 (preserved) + §2 (preserved metadata + regenerated columns) + §3 (preserved) + §4 (new drift report) + footer (preserved).
2. Write to the same path.
3. Verify file size ≤ 300 lines (templates limit per `.claude/rules/documentation.md` §2.1). If over → emit a warning suggesting per-domain split per `.claude/rules/screen-inventory.md` §2.

---

### STEP 6: Summary report to user

Emit a concise summary:

```
✅ Screen map refreshed: input/screens/screen-map.md (XXX lines)

Screens: NN total (NN web, NN mobile)
Stories scanned: NN frontend stories across NN phase files
API endpoints mapped: NN distinct (method, path) pairs

Status:
  ✅ Completed: NN
  🔄 In Progress: NN
  🟡 Blocked: NN
  ⏳ Todo: NN

Drift:
  • Stories without matching screen entry: NN  (list IDs)
  • Orphan screens (no backing story): NN     (list IDs)
  • Malformed frontend stories: NN            (list IDs)
  • Navigation ↔ registry mismatches: NN

Next steps:
  - Resolve drift items in screen-map.md §4
  - Re-run /screen-map after edits
```

---

## When to Run

- After `/add-scope` adds a frontend story.
- After `/process-client-docs` regenerates stories.
- Before sprint review / planning meetings (so the consolidated view is current).
- Before kicking off a frontend phase via `/execute-work` — confirms contract coverage matches the screen plan.

---

## Output

- **Modified file:** `.project-management/input/screens/screen-map.md` (or per-domain files under `input/screens/`).
- **Console summary:** as in STEP 6.
- **No other side effects.** This command does not modify stories, technologies.md, or backlog files.

---

## Related

- `.claude/rules/screen-inventory.md` — the rule this command implements
- `.claude/rules/screen-driven-backlog.md` — story-level Screen + API Endpoints Used (the source the command reads)
- `.claude/commands/add-scope.md` — adds frontend stories; run `/screen-map` after
- `.claude/commands/process-client-docs.md` — generates initial frontend stories; run `/screen-map` after
- `.project-management/templates/screen-map-template.md` — scaffold copied here if the file is missing
