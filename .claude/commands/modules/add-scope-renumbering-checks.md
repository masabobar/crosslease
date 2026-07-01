# Add Scope — Integrity Checks & Recovery

Companion to `add-scope-renumbering.md`. Implements STEP 5.6: five post-mutation checks plus the recovery procedure for each failure.

**Run after all STEP 5.1-5.4 mutations complete.** If ANY check fails, abort remaining STEPs (7, 8) and surface the failure to the user.

---

## Check 1 — Phase file continuity

**Verify:**

- `phase-1.md` through `phase-N.md` all exist with no gaps.
- Each file's internal `# Phase {N}:` heading matches its filename number.

**On failure:**

```
Phase continuity FAILED:
  Gap between phase-[X] and phase-[Y]
  OR: phase-[N].md heading says "Phase [M]" (mismatch)

Recovery:
  [Gap]       Check for misnamed files. If found → rename to fill gap.
              If not found → ABORT. Manual intervention required.
  [Mismatch]  Update heading to match filename.
```

---

## Check 2 — Story ID uniqueness

**Verify:** no duplicate `US-XXX` across all phase files and the backlog.

**On failure:**

```
Story ID uniqueness FAILED:
  US-[XXX] appears in:
    - phase-[A].md (Epic [B])
    - phase-[C].md (Epic [D])

Recovery:
  Assign new ID to the duplicate in phase-[C].md:
    US-[XXX] → US-[next_available]
  Verify next_available not already used (check incrementally — it's
  possible the highest ID has been skipped over in earlier edits).
  Update backlog reference to match.
```

---

## Check 3 — Backlog consistency

**Verify:** every `US-XXX` in phase files exists in backlog AND vice versa.

**On failure:**

```
Backlog consistency FAILED:
  Missing from backlog: US-[XXX] (found in phase-[N].md)
  Missing from phases:  US-[YYY] (found in backlog only)

Recovery:
  Missing from backlog → add entry under the correct epic.
  Missing from phases  → ask user:
    "US-[YYY] exists in backlog but not in any phase. Remove from backlog? [Yes/No]"
    If No → flag in current-status.md as "Orphaned story — manual review needed". Continue.
```

---

## Check 4 — Metrics accuracy

**Verify:** sum of individual story points = epic totals = phase totals.

**On failure:**

```
Metrics accuracy FAILED:
  Phase [N] total: listed [X] points, actual sum [Y]
  Epic [M] total:  listed [A] points, actual sum [B]

Recovery (automatic):
  Update all totals to match actual sums.
    Phase [N]: [X] → [Y] points
    Epic [M]:  [A] → [B] points
  Log "Metrics auto-corrected" to transcript.
```

Metrics are safe to auto-correct because the source of truth is the per-story points list, not the aggregated totals.

---

## Check 5 — No dangling references

**Verify:** every `Phase {N}` reference in every file points to an existing `phase-N.md`.

**On failure:**

```
Dangling reference FAILED:
  phase-[X].md references "Phase [Y]" but phase-[Y].md does not exist

Recovery:
  Find ALL instances of "Phase [Y]" in the file.
  Replace ALL with "Phase [correct_number]".
  Log count of replacements.
```

---

## Ordering

Run in this order — each check's recovery depends on the previous checks being green:

1. **Continuity** (files exist, headings correct)
2. **ID uniqueness** (no dupes)
3. **Backlog consistency** (both directions)
4. **Metrics accuracy** (totals match sums)
5. **Dangling references** (all Phase N refs resolve)

If Check 1 fails with `[Gap]` **abort** — recovery is manual.
If Check 2-5 fail, auto-recovery runs and the run continues; log every auto-correction to the transcript so the user can audit.

---

## After all checks pass

Continue to STEP 7 (Confirmation) and STEP 8 (Commit) of `add-scope.md`.

---

**Version:** 3.3.0
**Created:** 2026-04-21 (split from `add-scope-renumbering.md`)
**Parent:** `add-scope-renumbering.md`
