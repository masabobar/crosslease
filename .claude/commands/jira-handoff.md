---
name: jira-handoff
description: Transition the ticket(s) this branch covers to "QA ready" — transition only, no comment, no reassignment
---

# /jira-handoff

Move the Jira issue(s) this branch covers to **QA ready**. Nothing else.

**Scope is deliberately narrow — do not exceed it:**

- ✅ Transition to `QA ready`
- ❌ No comment on the issue
- ❌ No assignee change
- ❌ No field edits, no labels, no MR link

Transitioning an issue is visible to the whole team on their board, so this command **always lists what
it will change and waits for confirmation** before writing.

---

## Usage

```
/jira-handoff                  # resolve from this branch, confirm, transition
/jira-handoff PRD1042-1622     # explicit target
/jira-handoff --dry-run        # resolve and report only, write nothing
```

---

## Verified contract (probed 2026-07-29)

- **cloudId:** `44363885-c202-4a7b-bbcf-9df7504e6ad1`
- **Transition:** id **`16`**, name **`"QA ready"`** — note the lowercase `r`; target status id `11568`,
  category `In Progress`. Transition by **id**, never by name string.
- **Neighbouring transitions** (do not fire these by accident): `11` Dev in progress, `13` Dev testing,
  `17` QA in progress, `30` Rework, `29` Blocked.

### Issue types this command sees

| Type       | id      | Action                                                        |
| ---------- | ------- | ------------------------------------------------------------- |
| `Bug`      | `10012` | Transition **directly** — this is the bug-fix path            |
| `Sub-task` | `11507` | Transition only if its summary starts `FE ` (see below)       |
| `Story`    | `10022` | Do **not** transition. Resolve its `FE ` subtask and use that |
| `Epic`     | `10000` | **Refuse** — far too coarse to hand off                       |

Verified: commit-message tickets are usually **Bugs**, not subtasks — `PRD1042-1622`
("Framework agreement table not according to the design") is type `Bug`, reported by QA, no parent. So
the bug path is the common case, not the exception.

---

## Your Task

### Step 1 — Resolve the target(s)

Try in order. **Never guess** — if nothing resolves, stop and ask.

1. **Explicit argument** — use it as given.
2. **Commit messages on this branch.** Every commit ends with `#PRD1042-NNNN` or `#no-ticket`
   (commitlint enforces it), which makes this the most reliable source:
   ```bash
   git log "$(git merge-base HEAD origin/develop)..HEAD" --format='%s%n%b' \
     | grep -oE '#PRD1042-[0-9]+' | tr -d '#' | sort -u
   ```
3. **Branch name**, only if it contains a ticket number:
   ```bash
   git rev-parse --abbrev-ref HEAD | grep -oE 'PRD1042-[0-9]+'
   ```
   Many branches carry the project key with **no** number (`fix/PRD1042-fa-detail-design-gaps`,
   `fix/PRD1042-product-template-error-keys`) — those yield nothing. That is expected; fall through.
4. **Nothing resolved** → stop. Report what you searched and ask for the key. Do not scan Jira for
   "probably related" issues.

A branch commonly covers **several** tickets (7 distinct refs across the last 15 commits on `develop`).
Collect the full set — never assume one.

### Step 2 — Classify each resolved key

```
getJiraIssue  issueIdOrKey: <KEY>  fields: ["summary","status","issuetype","parent","subtasks"]
```

Never pass `*all` and never request `description` — a single story description is ~8 K characters and
`/jira-handoff` has no use for it.

Then per the table above:

- **`Bug`** → target is this issue.
- **`Sub-task`** → read its summary prefix:
  - starts `FE ` → target is this issue
  - starts `BE ` or `QA ` → **refuse.** Report: _"PRD1042-1661 is a BE subtask — not yours to hand
    off."_ Never transition another discipline's subtask.
- **`Story`** → find the `FE ` entry in `subtasks[]` and target **that**, not the story:
  ```
  fe = [subtasks[] | select(.fields.summary | startswith("FE "))][0]
  ```
  If there is no FE subtask, stop and report it. Do **not** fall back to transitioning the story, and
  do **not** infer a key by offsetting from the BE/QA sibling — subtask keys are not contiguous
  (US 11.9 → FE `PRD1042-1361`, US 11.10 → FE `PRD1042-1376`).
- **`Epic`** → refuse.

If `input/jira/<EPIC>/_index.md` exists from `/jira-sync`, its `FE Subtask` column is the same lookup
without an API call — prefer it, but re-verify the current status in Step 3 before writing.

### Step 3 — Check transition availability

For every target:

```
getTransitionsForJiraIssue  issueIdOrKey: <KEY>
```

- **Already in `QA ready`** → skip it and say so. This makes the command idempotent; re-running after a
  partial failure must not error.
- **Transition `16` not in the available list** → do not force it. Report the current status and the
  transitions that _are_ available, then leave the issue alone. A workflow that disallows the move is
  telling you something (e.g. the issue is `Blocked`).
- **Transition `16` available** → queue it.

### Step 4 — Confirm before writing

Print the plan and **stop for approval**. This is the last read-only moment:

```
## Jira Handoff — plan

Resolved from: commit messages on fix/PRD1042-1652-edit-activate-date-constraints

| Key | Type | Summary | Current status | Action |
|-----|------|---------|----------------|--------|
| PRD1042-1652 | Bug | FA edit/activate date constraints | Dev in progress | → QA ready |
| PRD1042-1622 | Bug | FA table not according to the design | QA ready | skip (already there) |
| PRD1042-1661 | Sub-task (BE) | BE US 23.1 Work Item Queue | Open | refuse — not a FE subtask |

Will transition 1 issue. No comments, no assignee changes.
Proceed? [yes/no]
```

`--dry-run` stops here permanently.

### Step 5 — Transition

Only after approval, per queued target:

```
transitionJiraIssue  issueIdOrKey: <KEY>  transition: { id: "16" }
```

Pass **only** the transition. No `fields`, no `update`, no comment payload — an accidental `fields`
object here is how an assignee gets silently overwritten.

Transition one at a time and report each result as it lands, so a mid-sequence failure leaves an
accurate record of what did and did not move.

### Step 6 — Report

```
## Jira Handoff — done

✅ PRD1042-1652 → QA ready
⏭️  PRD1042-1622 — already QA ready, untouched
⚠️  PRD1042-1661 — BE subtask, refused

1 transitioned, 1 skipped, 1 refused. No comments or assignee changes made.
```

If anything was refused or skipped, restate why in one line so the report stands alone.

---

## Related

- `.claude/commands/jira-sync.md` — `_index.md` provides the Story → FE-subtask lookup
- `.claude/rules/project/git.md` — the `#PRD1042-NNNN` commit convention Step 1 depends on
- `src/e2e/.claude/agent-memory/qa-lead/reference-jira.md` — QA's independent record of the same
  BE/FE/QA subtask convention
