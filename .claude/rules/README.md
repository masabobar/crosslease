# Specialized Rules — Index

**Version:** 3.6.0
**Last Updated:** 2026-07-05
**Status:** Active

Navigable index of the rule files in `.claude/rules/`. Rules are loaded by Claude during `/execute-work` and other commands; the load list is conditional — only the rules whose trigger fires for a given task are required reading. See `CLAUDE.md` §3 for the same grouping in narrative form, and `execute-work.md` "CRITICAL RULES" for which rules each story type pulls.

> **Precedence:** Project rules (`.project-management/rules/project-rules.md`) > **CLAUDE.md Core standards** > these specialized rules. If a rule file contradicts CLAUDE.md, CLAUDE.md wins — fix the rule file rather than following it.

---

## How to use this index

- **Always-load rules:** apply to every story / bug / generated artifact. Read these first.
- **Conditional rules:** apply only when a specific trigger fires (frontend story, API contract change, enum touched, input-doc content consumed). Skip if the trigger does not match the task.
- **Companion files:** several rules are split into focused companions (documentation × 3, permissions × 3). The main file is the entry-point; companions hold templates / examples / patterns.

---

## Always-Load Rules (every story)

| File                                                             | Topic                                                                                                                                                                                    | Why mandatory                                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`code-review.md`](code-review.md)                               | Senior FE review checklist — TypeScript, React 19, state, forms, API, i18n, RBAC, performance, testing. Run `/code-review` (diff) or `/review-codebase` (full audit) before every commit | Every commit must pass this checklist; hook fires automatically on staged TS files                                      |
| [`code-review-ui.md`](code-review-ui.md)                         | Full shadcn-first checklist + component catalogue                                                                                                                                        | Companion to `code-review.md` §12                                                                                       |
| [`api-error-display.md`](api-error-display.md)                   | Exhaustive BE error handling — every mutation needs `onError` with the dynamic `errors.<CODE>` i18n lookup + generic fallback; every query needs `isError` branch. **Fix-on-encounter**  | Every frontend file that calls a React Query hook or `api.*`                                                            |
| [`error-handling-and-logging.md`](error-handling-and-logging.md) | The canonical API envelope (`detail.code`), `ApiError.code` handling, never-swallow, no `console.*` / PII / tokens                                                                       | Every change that touches an API call or error path                                                                     |
| [`code-quality.md`](code-quality.md)                             | SOLID & DRY principles, common patterns, Rule of Three                                                                                                                                   | Every change touches code; these are baseline correctness/maintainability rules                                         |
| [`testing.md`](testing.md)                                       | Vitest unit tests for Zod schemas / stores / utilities; what we deliberately skip; definition of done                                                                                    | Every change must be testable                                                                                           |
| [`stack-specific.md`](stack-specific.md)                         | React 19 + Vite SPA quick reference — routing (no loaders), data fetching, React Compiler (no manual memoization), env vars, forms                                                       | The concrete patterns the other rules assume                                                                            |
| [`security-and-auth.md`](security-and-auth.md)                   | FE security — token handling in the auth store, 401-refresh via `@/lib/api` only, RBAC wire values, XSS hygiene, `VITE_` env safety                                                      | Every change that touches auth, roles, or user data                                                                     |
| [`git.md`](git.md)                                               | Conventional commits, Jira ticket / `#no-ticket`, US-reference sourcing rules, NO AI credits (critical)                                                                                  | Every change ends in a commit                                                                                           |
| [`documentation.md`](documentation.md)                           | Language rules (English-only), file-size limits (§2.1), writing style, quality checklist                                                                                                 | Applies to every doc and code comment the change produces                                                               |
| [`documentation-templates.md`](documentation-templates.md)       | User-story / technical-task / bug-report / API-endpoint doc templates                                                                                                                    | Companion to `documentation.md`; the canonical templates referenced by `/add-scope`, `/add-bug`, `/process-client-docs` |
| [`documentation-extras.md`](documentation-extras.md)             | Code-comment style, ASCII / Mermaid diagrams, validation tools, good vs bad doc examples                                                                                                 | Companion to `documentation.md`                                                                                         |
| [`permissions.md`](permissions.md)                               | Settings file behavior — CRITICAL: NEVER auto-modify `settings.json`. Safety deny patterns, best practices, troubleshooting                                                              | Bypassing this rule destroys user-curated permissions                                                                   |
| [`permissions-patterns.md`](permissions-patterns.md)             | Pattern matching syntax + common permission patterns by use case + "permission needed" response template                                                                                 | Companion to `permissions.md`                                                                                           |
| [`permissions-examples.md`](permissions-examples.md)             | Full `settings.json` examples (Option A broad / Option B granular), recommended project setup, corruption recovery                                                                       | Companion to `permissions.md`                                                                                           |

---

## Conditional Rules — Load When Trigger Fires

### When a frontend (web / mobile) story is in scope

| File                                                   | Topic                                                                                                                                                           | Trigger                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`api-first.md`](api-first.md)                         | Phase A contract verification before any frontend code — endpoint must exist + be documented + match UI needs                                                   | Frontend story consuming an endpoint                          |
| [`screen-driven-backlog.md`](screen-driven-backlog.md) | One frontend story = one screen (wizard exception); mandatory `**Screen:**` field + `**API Endpoints Used:**` table                                             | Authoring a web / mobile story                                |
| [`screen-inventory.md`](screen-inventory.md)           | Consolidated `input/screens/screen-map.md` artifact: navigation hierarchy + per-screen API table (generated by `/screen-map`). Drift detection                  | Project type includes a UI — see §1                           |
| [`design-first.md`](design-first.md)                   | Phase A: screen-level Figma URL required before plan mode exits. Phase B: component-level Figma URL required before each new `.tsx` file. Hard block if missing | Any frontend story that creates a new screen or new component |

### When an API contract changes (BE-owned; consumed from here)

| File                                           | Topic                                                                                                                                           | Trigger                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`api-documentation.md`](api-documentation.md) | Endpoint schema-validation + doc gate (executed in `../refinext-api/`; `openapi.json` is the artifact this repo consumes)                       | Reviewing what a complete contract looks like during Phase A         |
| [`api-versioning.md`](api-versioning.md)       | `/api/v{N}/` URL versioning + change-propagation gate. FE-side consequence: refresh `openapi.json`, update feature Zod schemas + tests together | BE bumps an endpoint version / changes a contract this repo consumes |

### When an enum-like value crosses a layer boundary

| File                                               | Topic                                                                                                                                                                                                | Trigger                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`enums-and-constants.md`](enums-and-constants.md) | Wire format across DB ↔ backend ↔ frontend (role values are lowercase snake per project-rules; error codes `SCREAMING_SNAKE_CASE`). One source of truth per enum. Strict separation from i18n labels | Adding / changing an enum-like value that crosses a layer boundary |

### When generating artifacts from input documents

| File                                   | Topic                                                                                                                                                                  | Trigger                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`anonymization.md`](anonymization.md) | Replace personal names from input docs with role labels (`the PM`, `the client`, `the stakeholder`) and source-context phrases. Drop personal contact details entirely | Any command generating PRD / backlog / spec / status / progress files from client docs |

### When a command produces open clarification questions

| File                                                                                                     | Topic                                                                                                                                                               | Trigger                                              |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`../commands/modules/interactive-clarifications.md`](../commands/modules/interactive-clarifications.md) | Reusable interactive Q&A loop; skipped questions persist to `input/open-questions.md` for `/resolve-questions`. Free-text answers anonymized per `anonymization.md` | Any PM command that surfaces clarification questions |

---

## Cross-Reference Map (which rule references which)

Every rule has a `## Related` section linking to its peers. Key connection nodes:

- **CLAUDE.md §Code standards** is the canonical source for FE conventions — `stack-specific.md`, `code-review.md`, and `testing.md` supplement it
- **`api-error-display.md`** is the operative enforcement rule for error surfacing — `error-handling-and-logging.md` and `code-review.md` §5 defer to it
- **`api-first.md`** is the gate every FE story passes before implementation — it consumes `api-documentation.md` / `openapi.json`
- **`enums-and-constants.md`** is referenced by the API rules (error codes and status enums are `SCREAMING_SNAKE_CASE` on the wire)
- **`git.md`** is the single source of truth for commit conventions — CLAUDE.md and `documentation-templates.md` §1.4 point to it
- **`anonymization.md`** is referenced by `error-handling-and-logging.md` (same no-PII principle applied at runtime)
- **`screen-driven-backlog.md`** feeds `screen-inventory.md` (story tables → consolidated map)

---

## File-Size Discipline

Rule files target ≤ 200 lines (`documentation.md` §2.1); `.claude/hooks/post-write-validations.sh` warns when a rule file exceeds the budget on write. If a rule outgrows it, split into companions (precedent: `documentation.md` → `documentation*.md × 3`, `permissions.md` → `permissions*.md × 3`).

---

## Related

- [`CLAUDE.md`](../../CLAUDE.md) §3 — Same grouping in narrative form, with conditional triggers
- [`.claude/commands/execute-work.md`](../commands/execute-work.md) "CRITICAL RULES" — Per-story reading list grouped by stage
- [`.claude/commands/modules/execute-work-quality-gates.md`](../commands/modules/execute-work-quality-gates.md) — Where these rules are enforced during `/execute-work`

---

**Status:** ✅ Active
