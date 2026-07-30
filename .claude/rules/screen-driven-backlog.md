# Screen Scoping (Frontend Units)

**Version:** 2.0
**Last Updated:** 2026-07-30
**Status:** Active

**MANDATORY: one frontend unit = one screen (wizard excepted). Before implementation starts, the
screen → endpoint mapping must be written out and verified.**

> **Scope of this rule.** Stories are authored in **Jira (PRD1042)** by the PO — this repo has no backlog
> to write into. So this rule no longer governs how stories are _written_; it governs how a unit of
> frontend work is **scoped and verified before it is built**. The filename is historical.

Works with `.claude/rules/api-first.md` (which consumes the mapping from §3 to gate implementation) and
`.claude/rules/design-first.md` (which gates on design fidelity per screen).

---

## 1. The rule, and its one exception

Default: **one unit = one screen** — or one modal, sheet, drawer, or full-page overlay the user perceives
as a discrete destination.

### Wizard exception

A multi-step flow whose steps have no standalone purpose — the user only ever moves through them as a unit
(create wizard, onboarding, KYC) — may be **one unit spanning all steps**, provided:

- Every step is enumerated by name in the plan
- Each step is its own task in the TodoWrite breakdown
- The wizard exits cleanly to one defined screen on both success and cancel
- Every step's endpoints appear in the §3 mapping

A **tabs** pattern is not a wizard. Tabs are independent destinations and get separate units — the
Workflow Task Catalog detail page's five tabs are five surfaces, not one.

**If a Jira story covers 2+ unrelated screens, split the work into several units** and say so in the plan.
Delivering a bundle because the ticket was written as a bundle is how scope drift hides.

---

## 2. Identifying the screen

PRD1042's actual conventions (verified against the board):

- **Story:** `US <epic>.<n> | <MODULE> | <title>` — e.g. `US 15.23 | WORKFLOW TASK CATALOG | Catalog Detail View — Authoring Surface`
- **Sub-tasks:** prefixed `BE `, `FE `, `QA ` — the `FE ` one is the unit
- **CR sub-tasks:** `FE CR Part 2 | <MODULE> | <title>` — and a CR **supersedes** the epic where they disagree

Jira titles are not always screen-shaped. When a title is vague (`Catalog Reference Count Maintenance`),
**name the screen yourself in the plan** and use that name consistently — in the plan, the component
filenames, and the browser-verification report. A named screen is greppable; "the catalog work" is not.

---

## 3. The screen → endpoint mapping (mandatory)

Produced at plan time, consumed by `api-first.md` Phase A:

| Method | Path                                    | Purpose             | Contract                           |
| ------ | --------------------------------------- | ------------------- | ---------------------------------- |
| GET    | `/api/v1/workflow-task-catalogs`        | List catalogs       | `openapi.json` → `List Catalogs`   |
| PATCH  | `/api/v1/cases/{id}/checklist/items/{}` | Complete/waive task | `openapi.json` → `Set Item Status` |

- **Method + path** must match the contract exactly — no paraphrasing, no "or similar".
- **Purpose** is one phrase tied to this screen's behaviour, not a restatement of the endpoint.
- **Contract** points at the `openapi.json` operation. For service-level detail (validation rules,
  permission checks) read `../refinext-api/`. If no operation exists, the row reads
  `⚠️ MISSING — backend gap` and Phase A **blocks** the unit.

If a screen calls no backend endpoint — rare — replace the table with:
`**Endpoints:** none — purely client-side.`

Watch the partial case: a list endpoint existing does not mean the preview, diff, or export endpoint the
design implies exists too. Map every call the screen makes, not the obvious one.

---

## 4. What counts as one screen (web / SPA)

- **Screen = route.** A route with several view states — empty, loading, error, populated — is **one**
  screen. Those are states, not screens.
- **List and detail are two screens.** `/products` and `/products/:id` use different endpoints and get
  separate units.
- **Modals, dialogs, slide-overs** get their own unit unless they are a trivial confirmation, in which
  case they fold into the parent screen.
- **Cross-cutting behaviour** — a shared table primitive, a global error boundary — is not a screen unit.

This project is desktop-first (CLAUDE.md §Responsive design); there is no mobile target, so there is no
per-platform variant of this rule.

---

## 5. When this rule does not apply

- Bug fixes that don't add or restructure a screen
- Pure refactors with no rendered difference
- Design-system / shared-primitive work that isn't a user-visible destination
- Tooling, scripts, CI, and documentation changes

---

## 6. Why

- A unit shaped like "implement the catalog feature" hides its own scope. A screen-shaped unit makes the
  boundary visible at plan time, when changing it is free.
- Without the §3 mapping, contract gaps surface during implementation — the most expensive moment. With
  it, they surface during planning.
- Per-screen QA handoff is only possible if units are screen-shaped. Bundled units produce bundled bugs.
- Designers and the PO think in screens. Scoping the same way removes a translation step from every
  status conversation.

---

## Related

- `.claude/rules/api-first.md` — Phase A consumes the §3 mapping to gate implementation
- `.claude/rules/design-first.md` — per-screen (Phase A) and per-component (Phase B) design gates
- `.claude/commands/execute-work.md` — STEP 2 produces the mapping; STEP 4 verifies the screen renders
- `.claude/commands/jira-sync.md` — pulls the Jira story this scoping works from

---

**Status:** ✅ Active
