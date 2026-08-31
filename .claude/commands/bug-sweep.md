---
name: bug-sweep
description: Find actionable Jira bugs in PRD1042, reproduce each in the browser, fix, review, and hand off to QA
---

# /bug-sweep

Find the bugs that need work in PRD1042, then take them one at a time: **reproduce → fix → verify →
review → commit → hand off.**

---

## Usage

```
/bug-sweep                    # all actionable bugs (Open + Rework), highest priority first
/bug-sweep --mine             # only bugs assigned to you  ← see the warning below
/bug-sweep PRD1042-1654       # one specific bug
/bug-sweep --list             # report only, fix nothing
```

---

## ⚠️ Filter by status, not by assignee

Verified 2026-07-29: **`assignee = currentUser() AND status = "Open"` returns zero bugs.** Assignment
does not track who fixes what on this project.

- Of 14 non-terminal bugs, 3 are assigned to you — `Blocked` ×1, `Ready for Staging` ×2. None `Open`.
- All 4 `Open` bugs are assigned to other people.
- Four bugs sit in `QA ready` assigned to a different developer, including `PRD1042-1622` and
  `PRD1042-1652` — both fixed in _your_ commits.

So **the default is status-based and ignores assignee.** `--mine` exists but will usually be empty; if it
returns nothing, say so rather than reporting "no bugs to fix."

---

## Verified contract (probed 2026-07-29)

- **cloudId:** `44363885-c202-4a7b-bbcf-9df7504e6ad1` · **Project:** `PRD1042`
- **Bug issue type:** `Bug`, id `10012` — description "All the problems and errors reported internally
  (by QA)". Standalone (hierarchy level 0, no parent), so no subtask lookup is needed.
- **Actionable statuses:** `Open`, `Rework` (QA sent it back), `Dev in progress` (already started)
- **Terminal / not yours:** `QA ready`, `QA in progress`, `Ready for Staging`, `Ready for release`,
  `Done`, `Canceled`
- **Handoff transition:** id **`16`**, name `"QA ready"` (lowercase r) — via `/jira-handoff`

### Bug description shape

QA writes a consistent structure — parse these three fields, they drive every step below:

```
**Precondition**:   User is login to the application with a Back office role. …
**Steps to reproduce**:  -Go to Framework agreement page.  -Check … table.
**Actual result**:  ”Agreement” column is much wider then the data …
**Expected result**:  In design “Agreement“ column is shorter and align with …
```

Descriptions embed screenshots as `blob:https://media.staging.atl-paas.net/…` URLs. **Those are not
fetchable** — do not try; rely on the text.

---

## ⚠️ Token discipline

This MCP spills to a file on almost every multi-issue search (measured 64 K–473 K characters even with
narrow `fields`). Always pass explicit `fields`, never `*all`, and `jq` the spill rather than reading it:

```bash
jq -r '.issues.nodes[] | "\(.key)|\(.fields.status.name)|\(.fields.priority.name)|\(.fields.summary)"' "$SPILL"
```

Fetch each bug's `description` **individually**, only when you start work on it.

---

## Your Task

### Step 1 — Find the bugs

```
searchJiraIssuesUsingJql
  jql:    project = PRD1042 AND issuetype = Bug AND status IN ("Open", "Rework")
          ORDER BY priority DESC, created ASC
  fields: ["summary","status","priority","assignee","created"]
```

`--mine` appends `AND assignee = currentUser()`.

Present the list and **stop for confirmation** before touching anything:

```
## Bug sweep — 4 actionable

| Key | Pri | Status | Assignee | Summary |
|-----|-----|--------|----------|---------|
| PRD1042-1660 | High | Open | Marko Mrdja | Back office user should not have rights to suspend/terminate |
| PRD1042-1654 | High | Open | Marko Mrdja | List of leasing companies wrong in step 1 FA wizard |
| PRD1042-1496 | High | Open | Vesna Plakalovic | Front office can't read pending approvals |
| PRD1042-1659 | Med  | Open | Marko Mrdja | Super admin should not create/prefill … |

Work them in this order? [all / pick keys / list-only]
```

`--list` stops here.

### Step 2 — Per bug: classify before fixing

Fetch `fields: ["description","summary","status","priority"]` for the one bug. Then decide whether it is
even a frontend bug — **this is the step that prevents the most damage**:

| Signal in the bug                                         | Verdict                                                                                                                                                                                                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "role X should not have rights to Y" / permission wording | ⚠️ **Likely BE.** `security-and-auth.md` §2: the FE gate is UX, the server is the boundary. Hiding a control does **not** fix it. Verify the API actually refuses the call; if it doesn't, this is a BE bug — report, don't patch the FE. |
| Wrong / missing data in a list or field                   | Check `openapi.json` first. If the API returns it wrong, it's BE (`api-first.md`).                                                                                                                                                        |
| Layout, column width, copy, spacing                       | FE — compare against Figma per `design-first.md`.                                                                                                                                                                                         |
| Wrong query param, wrong request shape                    | FE.                                                                                                                                                                                                                                       |
| Validation the UI should have enforced                    | FE, but confirm the API also rejects it.                                                                                                                                                                                                  |

Three of the four current `Open` bugs are permission-wording bugs, so expect this branch to fire.

If it is a BE bug: say so, add an entry to `input/open-questions.md` with category `api-contract`, and
move to the next bug. Do **not** leave a cosmetic FE patch behind.

### Step 3 — Reproduce it first

**Do not fix a bug you have not reproduced.** Per `browser-verification.md`:

1. Dev server on `http://localhost:5173` (reuse a running one).
2. Sign in as the role named in **Precondition** — if you cannot get that role locally, stop and say so.
3. Follow **Steps to reproduce** exactly.
4. Confirm the **Actual result** appears.

If it does not reproduce, **stop and report** — it may already be fixed, or be environment-specific.
Report which of `Precondition` / `Steps` you could not satisfy. Never fix speculatively.

### Step 4 — Fix

Minimal, surgical change per CLAUDE.md §Surgical changes. A bug fix does not need surrounding cleanup.
Apply the usual rules: `api-error-display.md` if you touch an API call, i18n keys in **both** locales,
`data-testid` on any new interactive element.

### Step 5 — Verify the Expected result

Back in the browser: confirm the **Expected result** now holds, re-check the original **Actual result** is
gone, and read `browser_console_messages`. Note the role you were signed in as.

### Step 6 — Review and commit

```bash
/code-review                  # staged diff; fixes missing onError / i18n inline
```

Then commit — one bug per commit, ticket in the header:

```
fix: align framework agreement list column widths with the design #PRD1042-1622
```

Per `.claude/rules/project/git.md`: no AI attribution; add a `US-XX.XX` body line only if that story came up in
conversation. Ask for the ticket only if the bug key is somehow unknown — normally it _is_ the key.

### Step 7 — Hand off

```
/jira-handoff PRD1042-1654    # transition 16 → "QA ready". No comment, no reassignment.
```

### Step 8 — Report, then next bug

```
## PRD1042-1654 — fixed

Reproduced: ✅ as back_office, LC list in FA wizard step 1 showed all partners
Cause:      queryFn passed `partner_type=all`; endpoint expects `leasing_company`
Fix:        src/features/frameworkAgreements/api/queries.ts:34
Verified:   ✅ only LC partners listed; console clean
Commit:     a1b2c3d  ·  Jira: → QA ready
```

**One bug at a time. Confirm before starting the next.** Never batch-fix and never batch-commit — a
5-bug commit is unreviewable and unrevertable.

---

## Related

- `.claude/commands/jira-handoff.md` — the Step 7 transition
- `.claude/rules/project/browser-verification.md` — Steps 3 and 5
- `.claude/rules/project/security-and-auth.md` §2 — why permission bugs are usually BE
- `.claude/rules/project/api-first.md` — when a bug is a contract gap, not an FE defect
- `.claude/rules/project/git.md` — commit format
