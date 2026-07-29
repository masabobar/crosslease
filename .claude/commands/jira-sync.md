---
name: jira-sync
description: Read-only briefing on a Jira epic/story in PRD1042 — story list, FE subtasks, API paths, RBAC, open questions. Writes nothing.
---

# /jira-sync

Pull everything you need to know about an epic or story from Jira and present it in a form you can act
on. **Read-only — this command writes no files.**

Jira is the source of truth for scope. Nothing is mirrored locally, so there is nothing to keep in sync;
the only local records are `input/open-questions.md` (BE/design gaps) and `output/progress/DASHBOARD.md`
(status). Run this at the start of story work, and whenever you suspect the PO has moved something.

---

## Usage

```
/jira-sync PRD1042-22            # epic → all stories, statuses, FE subtask keys
/jira-sync PRD1042-799           # one story → full brief (API paths, RBAC, ACs, open questions)
/jira-sync PRD1042-22 --changed  # only stories updated in the last 14 days
/jira-sync PRD1042-22 --gaps     # BE-gate pass only: API paths vs openapi.json
```

---

## Verified contract (probed 2026-07-29)

- **cloudId:** `44363885-c202-4a7b-bbcf-9df7504e6ad1` (`holycode-team.atlassian.net`)
- **Project:** `PRD1042` — "PRD: CrossLease", company-managed
- **Hierarchy:** `Epic` (10000) → `Story` (10022) → `Sub-task` (11507). `parent` resolves at both levels;
  a story's `subtasks[]` carries its BE/FE/QA triplet, identified by summary prefix `BE ` / `FE ` / `QA `.
- **Story summary:** `US <epic>.<n> | <MODULE> | <title>`
- **Epic summary** carries the epic number: `Epic 11: Framework Agreement` ⇄ `PRD1042-22`

### What a story description reliably contains

Descriptions follow a consistent structure — these sections are what make this command worth running:

| Section                                | Why it matters                                                       |
| -------------------------------------- | -------------------------------------------------------------------- |
| `[SCOPE]` tag                          | Whether the story is in the current release at all                   |
| **Permission Matrix**                  | Per-role ✓/✗/R table → the FE role gates (`security-and-auth.md` §2) |
| **Acceptance Criteria**                | What the story actually requires                                     |
| **Field Specification**                | Form fields, types, M/O/C, validation rules                          |
| `Architectural Notes → Backend → API:` | The endpoint path → feeds the `api-first.md` BE gate                 |
| `[OPEN QUESTION]` blocks               | Candidates for `input/open-questions.md`                             |

---

## ⚠️ Token discipline

This MCP spills to a file on nearly every multi-issue search — measured **64 K, 78 K, 266 K and 473 K**
characters, even with `description` excluded, because each `subtasks[]` entry carries nested field objects.
A single story description is ~8 K.

1. **Always pass explicit `fields`.** Never omit it, never `*all`.
2. Structure pass: `["summary","status","issuetype","subtasks","updated"]` — **no `description`**.
3. **Never read a spill file whole.** Use this verified extractor:
   ```bash
   jq -r '.issues.nodes[]
     | (.fields.subtasks // []) as $s
     | [ .key,
         ((.fields.summary | (capture("US (?<n>[0-9]+(\\.[0-9]+)?)").n)?) // "-"),
         .fields.status.name,
         ([$s[] | select(.fields.summary | startswith("FE ")) | .key][0] // "-"),
         ([$s[] | select(.fields.summary | startswith("BE ")) | .key][0] // "-"),
         .fields.summary
       ] | @tsv' "$SPILL"
   ```
4. **Fetch descriptions one story at a time**, and only for stories you are briefing. Never pull a whole
   epic's descriptions — 12 stories is ~100 K characters.

---

## Your Task

### Step 1 — Resolve the target

```
getJiraIssue  issueIdOrKey: <KEY>  fields: ["summary","status","issuetype","subtasks","updated"]
```

Branch on `issuetype.name`: `Epic` → epic mode (Step 2) · `Story` → story brief (Step 3) ·
`Sub-task` → brief its `parent` instead and say so · `Bug` → point at `/bug-sweep`.

### Step 2 — Epic mode: the story table

```
searchJiraIssuesUsingJql
  jql:    parent = <EPIC-KEY> ORDER BY key ASC
  fields: ["summary","status","issuetype","subtasks","updated"]
```

`jq` the spill. Four cases, all observed live on Epic 11 (24 children):

1. **Story with no subtasks** — `Backlog` status, not yet broken down. Group as _"not yet broken down"_;
   never report it as a gap.
2. **Child with no `US n.n`** — e.g. `PRD1042-1495`, a CR. Real scope; include it.
3. **Incomplete BE/FE/QA triplet** — `PRD1042-1495` has BE and FE but no QA. Record `-`; never infer a key
   by offsetting from a sibling — keys are not contiguous (US 11.9 → FE `-1361`, US 11.10 → FE `-1376`).
4. **Standalone CR Tasks are not epic children.** `PRD1042-1550` (`Task`, **no `parent`**) never appears
   under `parent = <EPIC>` yet governs the epic's November scope. Search separately:
   `project = PRD1042 AND summary ~ "CR Part 2" AND summary ~ "<MODULE>"`.

Report:

```
## PRD1042-22 — Epic 11: Framework Agreement          Jira updated 2026-07-29 10:37

| Story | US | Status | FE subtask | Title |
|-------|----|--------|-----------|-------|
| PRD1042-799 | 11.1 | QA in progress | PRD1042-1337 | Framework Agreement Creation (Draft) |
| PRD1042-814 | 11.15 | Backlog | - | Versioned Reference Model |

Not yet broken down: US 11.15–11.23 (Backlog, no subtasks)
Related CRs (not epic children): PRD1042-1550 "CR Part 2 | FRAMEWORK AGREEMENT | November scope alignment (v9)"
```

`--changed` adds `AND updated >= -14d` and reports only those.

### Step 3 — Story brief

Fetch `fields: ["description"]` for that one story, then **extract** — never dump the raw description:

```
## PRD1042-799 — US 11.1 | Framework Agreement Creation (Draft)
Status: QA in progress · FE subtask: PRD1042-1337 · [SCOPE] November 2026, in scope

### Endpoints (→ api-first.md Phase A)
POST   /api/framework-agreements          create Draft
PATCH  /api/framework-agreements/{id}     edit Draft
DELETE /api/framework-agreements/{id}     hard delete Draft

### RBAC (→ security-and-auth.md §2)
Create/Edit/Delete Draft : bank_power_user only
View Draft               : bank_power_user, back_office (read-only), support (grant-scoped)

### Acceptance criteria
- … (verbatim bullets)

### Field spec — mandatory
Agreement Name (≤200, unique per tenant+entity+LC) · LC ref (must be Active) · Bank Entity · Currency
Max Volume EUR (>0) · Allowed Product Templates (≥1, Published) · Valid From

### Open questions in the ticket
OQ-11.01-A  Bank Entity enum values for November — assumption: Sparkasse + Other
OQ-11.01-C  FieldSpec v4 scope class for the five pricing fields
```

### Step 4 — BE gate (`--gaps`, and always in story mode)

For every path under `Architectural Notes → Backend → API:`, check it exists:

```bash
jq -r '.paths | keys[]' openapi.json | grep -i framework-agreement
```

A missing path — or a response field the ACs require that the schema lacks — is an **`api-first.md`
Phase A failure**. Report it and recommend an `input/open-questions.md` entry with category
`api-contract`. Do not start FE work on it, and do not build a shell.

### Step 5 — Drift against local records

Cheap cross-checks, no writes:

```bash
grep -n "US-11\.1\b\|PRD1042-799" .project-management/input/open-questions.md
grep -n "PRD1042-799\|PRD1042-1337" .project-management/output/progress/DASHBOARD.md
```

Flag three things:

- story `QA ready`/`Done` in Jira but absent from DASHBOARD → status record incomplete
- `[OPEN QUESTION]` in the ticket with no matching `open-questions.md` entry → gap untracked
- story marked complete in DASHBOARD but still `Open`/`Dev in progress` in Jira → **run `/jira-handoff`**

### Step 6 — Stop

`/jira-sync` writes nothing. It does not edit `open-questions.md`, does not update DASHBOARD, and does not
transition anything. End by naming the next action — usually `/execute-work <FE-subtask>`, a
`/jira-handoff`, or an `open-questions.md` entry to add by hand.

---

## Related

- `.claude/rules/api-first.md` — the Phase A gate Step 4 feeds
- `.claude/rules/security-and-auth.md` §2 — role wire values the Permission Matrix maps onto
- `.claude/rules/screen-driven-backlog.md` — the story shape this brief supports
- `.claude/commands/jira-handoff.md` — the other end of the loop
- `.claude/commands/bug-sweep.md` — for `Bug` issues
