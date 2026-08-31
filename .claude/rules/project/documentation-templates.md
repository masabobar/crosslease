# Documentation Artifacts — Where Each One Lives

**Version:** 2.0
**Last Updated:** 2026-07-30
**Status:** Active

**This repo authors almost no artifact documentation.** Stories, tasks, and bugs live in Jira; API
contracts live in `openapi.json` and `../refinext-api/`. This file records where each artifact lives and
what shape to expect, so nothing gets re-invented locally.

Companion to `.claude/rules/project/documentation.md` (writing rules — language, style, file size) and
`.claude/rules/project/documentation-extras.md` (code comments, diagrams, tooling).

---

## 1. Stories, tasks, and bugs → Jira (PRD1042)

Do **not** author these as local markdown. Pull them with `/jira-sync <KEY>`, which extracts the parts
that matter rather than dumping the description.

**Hierarchy:** `Epic` → `Story` → `Sub-task`. A story's sub-tasks carry its BE/FE/QA triplet, identified by
summary prefix `BE ` / `FE ` / `QA `. CR Tasks are often **standalone** — no `parent` — yet still govern an
epic's scope, so search for them separately.

**Summary formats:**

| Artifact    | Shape                                  |
| ----------- | -------------------------------------- |
| Epic        | `Epic 15: Workflow Task Catalog`       |
| Story       | `US <epic>.<n> \| <MODULE> \| <title>` |
| Sub-task    | `FE \| <title>` (also `BE `, `QA `)    |
| CR sub-task | `FE CR Part 2 \| <MODULE> \| <title>`  |

**Sections a story description reliably carries** — these are what make it worth reading in full:

| Section                                | Why it matters                                         |
| -------------------------------------- | ------------------------------------------------------ |
| `[SCOPE]` tag                          | Whether the story is in the current release at all     |
| **Permission Matrix**                  | Per-role ✓/✗/R table → the FE role gates               |
| **Acceptance Criteria**                | What the unit actually has to do                       |
| **Field Specification**                | Form fields, types, M/O/C, validation rules            |
| `Architectural Notes → Backend → API:` | Endpoint paths → feeds the `api-first.md` Phase A gate |
| `[OPEN QUESTION]` blocks               | Candidates for the register in §4                      |

**Where a CR and its epic disagree, the CR wins** — it reflects the current committed scope; the epic is
the original ambition. Never assume the epic is authoritative because it is larger.

---

## 2. Commit messages → `.claude/rules/project/git.md`

That file is canonical: conventional-commit format, the mandatory Jira ticket or `#no-ticket` suffix, the
HEREDOC pattern for bodies, and the rule on citing `US-XX.XX` only when it came up in conversation.

> AI attribution lines (`Generated with Claude Code`, `Co-Authored-By: Claude`) **MUST NOT** appear in
> commit messages.

---

## 3. API endpoint contracts → `openapi.json`

Endpoint documentation is **not written in this repo.** The contract is `openapi.json` (refresh with
`pnpm fetch:openapi`; `pre-push` rejects a push when it has drifted from the dev API). For service-level
detail — validation rules, permission enforcement, error taxonomy — read `../refinext-api/`.

When an endpoint the UI needs is absent from `openapi.json`, that is an `api-first.md` Phase A failure:
file the gap, do not invent the shape.

---

## 4. Open clarification questions → `.project-management/input/open-questions.md`

The one artifact this repo does author. Its format lives in
`.project-management/templates/open-questions-template.md` — follow that template rather than restating it
here. Entries carry `Status`, `Priority` (P0/P1/P2), `Category`, `Asked During`, the question, impact if
unresolved, and a resolution block once answered.

Free-text answers are anonymized per `.claude/rules/project/anonymization.md` before they are written down.

---

## 5. Local documentation we do write

Rule files (`.claude/rules/`), command files (`.claude/commands/`), `CLAUDE.md`, and the DASHBOARD journal.
Style, language, and file-size limits for all of them: `.claude/rules/project/documentation.md` §2.1 and §3.

---

## Related

- `.claude/rules/project/documentation.md` — language, style, file-size limits, quality checklist
- `.claude/rules/project/documentation-extras.md` — code comments, diagrams, tooling
- `.claude/rules/project/git.md` — canonical commit format (§2 defers to it)
- `.claude/rules/project/screen-driven-backlog.md` — how a frontend unit is scoped from a Jira story
- `.claude/rules/project/anonymization.md` — no personal names in anything committed here
- `.claude/commands/jira-sync.md` — the read-only briefing that extracts §1's sections

---

**Status:** ✅ Active
