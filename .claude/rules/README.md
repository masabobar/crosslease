# Specialized Rules — Index

**Version:** 3.5.0
**Last Updated:** 2026-06-05
**Status:** Active

Navigable index of the 22 rule files in `.claude/rules/`. Rules are loaded by Claude during `/execute-work` and other commands; the load list is conditional — only the rules whose trigger fires for a given task are required reading. See `CLAUDE.md` §3 for the same grouping in narrative form, and `execute-work.md` "CRITICAL RULES" for which rules each story type pulls.

---

## How to use this index

- **Always-load rules:** apply to every story / bug / generated artifact. Read these first.
- **Conditional rules:** apply only when a specific trigger fires (HTTP endpoint touched, schema migrated, frontend story, auth code touched, input-doc content consumed). Skip if the trigger does not match the task.
- **Companion files:** several rules have been split into focused companions (documentation × 3, permissions × 3). The main file is the entry-point; companions hold templates / examples / patterns.

---

## Always-Load Rules (every story)

| File                                                       | Topic                                                                                                                                                                                                         | Why mandatory                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`code-review.md`](code-review.md)                         | Senior FE review checklist — TypeScript, React 19, state, forms, API, i18n, RBAC, performance, testing. Run `/code-review` (diff) or `/review-codebase` (full audit) before every commit                      | Every commit must pass this checklist; hook fires automatically on staged TS files                                      |
| [`api-error-display.md`](api-error-display.md)             | Exhaustive BE error handling — every mutation needs `onError` with `ApiError` code switch + generic fallback; every query needs `isError` branch. **Fix-on-encounter** during any review or file modification | Every frontend file that calls a React Query hook or `api.*`                                                            |
| [`code-quality.md`](code-quality.md)                       | SOLID & DRY principles, common patterns, Rule of Three                                                                                                                                                        | Every change touches code; these are baseline correctness/maintainability rules                                         |
| [`testing.md`](testing.md)                                 | Test types (unit / integration / E2E), API status-code matrix (200/400/401/403/404/500), 80%+ coverage target                                                                                                 | Every change must be testable; defines the matrix every endpoint must cover                                             |
| [`git.md`](git.md)                                         | Conventional commits, multi-line HEREDOC format, NO AI credits (critical), commit workflow                                                                                                                    | Every change ends in a commit                                                                                           |
| [`documentation.md`](documentation.md)                     | Language rules (English-only), file-size limits (§2.1), writing style, quality checklist                                                                                                                      | Applies to every doc and code comment the change produces                                                               |
| [`documentation-templates.md`](documentation-templates.md) | User-story / technical-task / bug-report / API-endpoint doc templates                                                                                                                                         | Companion to `documentation.md`; the canonical templates referenced by `/add-scope`, `/add-bug`, `/process-client-docs` |
| [`documentation-extras.md`](documentation-extras.md)       | Code-comment style, ASCII / Mermaid diagrams, validation tools, good vs bad doc examples                                                                                                                      | Companion to `documentation.md`                                                                                         |
| [`stack-specific.md`](stack-specific.md)                   | Middleware (`requireAuth` / `requireAdmin` / `validateBody`), response envelope, Zod env schema, performance patterns                                                                                         | Defines the patterns the rest of the rules build on                                                                     |
| [`permissions.md`](permissions.md)                         | Settings file behavior — CRITICAL: NEVER auto-modify `settings.json`. Safety deny patterns, best practices, troubleshooting                                                                                   | Bypassing this rule destroys user-curated permissions                                                                   |
| [`permissions-patterns.md`](permissions-patterns.md)       | Pattern matching syntax + common permission patterns by use case + "permission needed" response template                                                                                                      | Companion to `permissions.md`                                                                                           |
| [`permissions-examples.md`](permissions-examples.md)       | Full `settings.json` examples (Option A broad / Option B granular), recommended project setup, corruption recovery                                                                                            | Companion to `permissions.md`                                                                                           |

---

## Conditional Rules — Load When Trigger Fires

### When a HTTP endpoint is added / modified / removed

| File                                           | Topic                                                                                                                            | Trigger                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`api-documentation.md`](api-documentation.md) | Schema validation in code, typed response, mandatory doc block, drift check. STRICT public vs SOFT `@internal` tiers             | Any handler / route file changed                                    |
| [`api-versioning.md`](api-versioning.md)       | `/api/v{N}/` URL versioning + **change-propagation gate** (§5): docs + Zod schemas + ALL tests + consumer code update in same PR | Endpoint contract changed (request / response / status / semantics) |
| [`api-first.md`](api-first.md)                 | Phase A contract verification before any frontend code — endpoint must exist + be documented + match UI needs                    | Frontend story consuming an endpoint                                |

### When error handling / logging code is touched

| File                                                             | Topic                                                                                                                                                                                                                             | Trigger                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [`error-handling-and-logging.md`](error-handling-and-logging.md) | 9-category error taxonomy → HTTP status + `SCREAMING_SNAKE_CASE` code; single `AppError` boundary; structured logs with `pino`; redaction of PII / secrets / tokens; `request_id` correlation; error tracker (Sentry) integration | Any handler / service / logger config touched |

### When auth, session, or secret is touched

| File                                           | Topic                                                                                                                                                                                                                 | Trigger                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`security-and-auth.md`](security-and-auth.md) | Default-deny middleware + resource-level (IDOR) check; cookie sessions (httpOnly/secure/sameSite); bcrypt cost 12; rate limits on auth routes; security headers (CSP/HSTS/…); 7-category audit log; `npm audit` clean | Any auth route, role check, session handling, secret addition |

### When the database / schema / enum is touched

| File                                               | Topic                                                                                                                                                                              | Trigger                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`database.md`](database.md)                       | Migration-based workflow (Prisma `migrate`, never `db push` in prod); commands reference; migration naming + review checklist                                                      | Any `schema.prisma` change, new migration                          |
| [`enums-and-constants.md`](enums-and-constants.md) | `SCREAMING_SNAKE_CASE` wire format across DB ↔ backend ↔ frontend ↔ mobile (zero mapping with Prisma + TS + Zod). One source of truth per enum. Strict separation from i18n labels | Adding / changing an enum-like value that crosses a layer boundary |

### When a frontend (web / mobile) story is in scope

| File                                                   | Topic                                                                                                                                                           | Trigger                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`screen-driven-backlog.md`](screen-driven-backlog.md) | One frontend story = one screen (wizard exception); mandatory `**Screen:**` field + `**API Endpoints Used:**` table                                             | Authoring a web / mobile / RN / native story                       |
| [`screen-inventory.md`](screen-inventory.md)           | Consolidated `input/screens/screen-map.md` artifact: navigation hierarchy (hand-curated) + per-screen API table (generated by `/screen-map`). Drift detection   | Project type includes a UI (web CMS / mobile / web+admin) — see §1 |
| [`design-first.md`](design-first.md)                   | Phase A: screen-level Figma URL required before plan mode exits. Phase B: component-level Figma URL required before each new `.tsx` file. Hard block if missing | Any frontend story that creates a new screen or new component      |

### When generating artifacts from input documents

| File                                   | Topic                                                                                                                                                                  | Trigger                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`anonymization.md`](anonymization.md) | Replace personal names from input docs with role labels (`the PM`, `the client`, `the stakeholder`) and source-context phrases. Drop personal contact details entirely | Any command generating PRD / backlog / spec / status / progress files from client docs |

### When a command produces open clarification questions

This is not a rule file but a reusable module — listed here so it's discoverable next to the rules it works with.

| File                                                                                                     | Topic                                                                                                                                                                                                                               | Trigger                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../commands/modules/interactive-clarifications.md`](../commands/modules/interactive-clarifications.md) | Reusable interactive Q&A loop. For each clarification: `AskUserQuestion` with options + Skip. Skipped questions persist to `input/open-questions.md` for `/resolve-questions`. Free-text answers anonymized per `anonymization.md`. | Any PM command that surfaces clarification questions: `/process-client-docs` (active), `/init-project` / `/add-scope` / `/execute-work` / `/add-bug` (planned integration). |

---

## Cross-Reference Map (which rule references which)

Every rule has a `## Related` section linking to its peers. Key connection nodes:

- **`stack-specific.md`** is the conceptual root for backend patterns — referenced by `api-documentation.md`, `error-handling-and-logging.md`, `security-and-auth.md`, `enums-and-constants.md`
- **`testing.md`** is referenced by every API / error / security rule (status-code matrix)
- **`enums-and-constants.md`** is referenced by `api-documentation.md`, `error-handling-and-logging.md`, `security-and-auth.md` (error codes + role enums + status enums are all `SCREAMING_SNAKE_CASE`)
- **`git.md`** is referenced by `documentation.md` §4.4 (single source of truth for commit conventions)
- **`anonymization.md`** is referenced by `error-handling-and-logging.md` (same no-PII principle applied to logs)
- **`screen-driven-backlog.md`** feeds `screen-inventory.md` (story tables → consolidated map)

---

## File-Size Discipline

All rule files are ≤ 200 lines (verified by `.claude/hooks/post-write-validations.sh` PostToolUse hook). If a rule outgrows the budget, split into companions (precedent: `documentation.md` → `documentation*.md × 3`, `permissions.md` → `permissions*.md × 3`).

---

## Related

- [`CLAUDE.md`](../../CLAUDE.md) §3 — Same grouping in narrative form, with conditional triggers
- [`.claude/commands/execute-work.md`](../commands/execute-work.md) "CRITICAL RULES" — Per-story reading list grouped by stage
- [`.claude/commands/modules/execute-work-quality-gates.md`](../commands/modules/execute-work-quality-gates.md) — Where these rules are enforced during `/execute-work`
- [`CHANGELOG.md`](../../CHANGELOG.md) — Rule additions per version (v3.3.0 added 6 new rules)

---

**Status:** ✅ Active
