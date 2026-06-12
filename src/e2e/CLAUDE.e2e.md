# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## E2E Test Automation

All E2E tests use **Playwright 1.60** and live entirely inside `src/e2e/`. The config entrypoint is `src/e2e/playwright.config.ts`.

### Commands

Run from the `refinext-app/` root using pnpm:

```bash
pnpm e2e                                          # All tests, headless
pnpm e2e:headed                                   # All tests, headed browser
pnpm e2e:ui                                       # Playwright UI mode (interactive debugger)
pnpm e2e:report                                   # Open last HTML report (src/e2e/reports/html/)

# Single spec file
pnpm e2e -- src/e2e/specs/some-feature.spec.ts

# Single test by title substring
pnpm e2e -- --grep "test title substring"

# Single test by title, headed (useful for debugging)
pnpm e2e -- --headed --grep "test title substring"
```

### Directory Structure

```
src/e2e/
├── .auth/           # Playwright storageState files (git-ignored) — written at runtime
│   ├── gate.json    # Staging password gate cookie — produced by setup/gate.setup.ts
│   └── user.json    # App session cookie — produced by setup/auth.setup.ts
├── .claude/
│   ├── agents/
│   │   └── qa-lead.md       # qa-lead agent definition (5-stage QA pipeline orchestrator)
│   ├── agent-memory/
│   │   └── qa-lead/         # Persistent memory files for the qa-lead agent (MEMORY.md + per-story files)
│   └── skills/
│       ├── jira-story-extractor/           # Stage 1: fetch & DoR-check Jira stories
│       ├── figma-design-extractor/         # Stage 2: extract UI data from Figma frames
│       ├── requirements-design-comparator/ # Stage 3: AC vs design mismatch report
│       ├── manual-test-suite-generator/    # Stage 4: generate Gherkin BDD .md files
│       └── playwright-architect/           # Stage 5: convert Gherkin → .spec.ts + POM classes
├── fixtures/
│   └── test.ts      # ✅ Implemented — the ONLY permitted import source for all specs and POMs
├── helpers/         # Reusable utilities called within tests: auth helpers, data builders, API clients
│   └── helper.ts    # ✅ Implemented — getTestOtp(), createTestSession() helpers
├── pages/           # Page Object Model classes, one file per feature area
│   ├── LoginPage.ts        # ✅ Implemented
│   ├── SecureLogoutPage.ts # ✅ Implemented
│   └── UserListPage.ts     # ✅ Implemented
├── setup/           # Playwright setup projects — run once per session, produce shared storageState
│   ├── gate.setup.ts  # ✅ Implemented — submits staging password gate, saves .auth/gate.json
│   └── auth.setup.ts  # ✅ Implemented — creates app session via POST /internal/test/session, saves .auth/user.json
├── specs/           # Playwright test specifications (.spec.ts), grouped by epic subfolder
│   └── User_Management&Login/
│       ├── prd1042-43-user-login.spec.ts    # ✅ Implemented — AC-01, AC-03, AC-06, AC-07, AC-08 active
│       └── prd1042-69-secure-logout.spec.ts  # ✅ Implemented — AC-01, AC-02, AC-03, AC-04 active; AC-09 fixme
├── tests/           # Generated BDD test suites (Gherkin .md files) — read-only input, never edit
│   └── PRD1042-39-User Management & Authentication/  # 23 .md files — one per story
│       ├── PRD1042-43 User Login.md
│       ├── PRD1042-44 Invitation-based Onboarding.md
│       ├── PRD1042-45 Reset Password.md
│       ├── PRD1042-46 Account Lockout.md
│       ├── PRD1042-47 Session Management.md
│       ├── PRD1042-48 Role Assignment & Management.md
│       ├── PRD1042-49 Tenant Scope Assignment.md
│       ├── PRD1042-51 Leasing Company Access Restrictions.md
│       ├── PRD1042-59 User Provisioning.md
│       ├── PRD1042-60 Account Activation.md
│       ├── PRD1042-61 User Suspension.md
│       ├── PRD1042-62 User Restore Access.md
│       ├── PRD1042-63 User Deactivation.md
│       ├── PRD1042-67 Resend Invitation.md
│       ├── PRD1042-68 Password Setup on Activation.md
│       ├── PRD1042-69 Secure Logout.md
│       ├── PRD1042-71 User List View.md
│       ├── PRD1042-72 User Search and Filtering.md
│       ├── PRD1042-73 User Detail View.md
│       ├── PRD1042-77 Four-Eyes Approval Validation.md
│       ├── PRD1042-346 Edit or Update User.md
│       ├── PRD1042-525 MFA Authentication and Enrollment.md
│       └── PRD1042-602 Export Users.md
├── reports/         # Git-ignored — all Playwright output lands here
│   ├── html/        # HTML report — open with: pnpm e2e:report
│   └── results/     # Test artifacts: screenshots, videos, traces
├── CLAUDE.e2e.md    # This file
└── playwright.config.ts
```

**Folder responsibilities:**

| Folder      | Contains                                                                        | Rule                                 |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| `setup/`    | Playwright setup projects (`.setup.ts`) — run once, produce `storageState`      | Never import from here in specs      |
| `fixtures/` | Playwright fixture definitions — injected per test via `test.extend`            | Only file specs/POMs may import from |
| `helpers/`  | Reusable functions called inside tests — auth flows, data builders, API clients | Import directly where needed         |
| `pages/`    | POM classes — one file per feature area                                         | Import in specs and fixtures         |
| `specs/`    | Playwright test files (`.spec.ts`) — one per user story                         | Never import between specs           |

> The `tests/` directory holds Gherkin `.md` files generated by the `qa-lead` agent — human-readable BDD specs, not Playwright files. It is **read-only input** for the `playwright-architect` skill. Never write to it directly. Playwright specs live in `specs/`.

### App Architecture Relevant to E2E

The app is a React 19 SPA (Vite dev server on port 5173 by default, Nginx on port 3000 in production). The backend is a separate FastAPI service configured via `VITE_API_URL`.

- **Routing:** React Router v7 — test navigation by URL path, not by clicking nav links
- **Async data:** TanStack Query v5 — await network idle or a visible loading indicator before asserting on data-driven content; don't poll with `waitForTimeout`
- **UI components:** shadcn/ui primitives built on Base UI — locators should use `getByTestId` as the primary strategy; fall back to `getByRole` when a test ID is unavailable; never use CSS class or Tailwind selectors
- **Feature structure:** `src/features/<feature>/` (pattern established, currently empty) — one POM per feature area mirrors this layout

### Environment Variables

Environment variables live in `src/e2e/.env` (git-ignored). Copy from `src/.env.e2e.example` and fill in real values before running E2E locally:

```bash
cp src/.env.e2e.example src/e2e/.env
```

| Variable                         | Required now | Purpose                                                                                                                                                         |
| -------------------------------- | :----------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEV_BASE_URL`                   |      ✅      | Target app URL (e.g. `https://refinext-dev.projects.holycode.com`) — read by `playwright.config.ts` as `baseURL`                                                |
| `HTTP_PASSWORD`                  |      ✅      | Staging HTML password gate — submitted once by `gate.setup.ts`                                                                                                  |
| `E2E_API_BASE_URL`               |      ✅      | Backend API root without path suffix (e.g. `https://api.refinext-dev.projects.holycode.com`) — used by `getTestOtp`, `createTestSession`, direct API assertions |
| `DEV_USER_EMAIL`                 |      ✅      | system_admin user email — used by `auth.setup.ts` and login specs                                                                                               |
| `DEV_USER_PASSWORD`              |      ✅      | system_admin user password                                                                                                                                      |
| `DEV_BACK_OFFICE_USER_EMAIL`     |      ✅      | back_office_risk user email — used by login and logout specs                                                                                                    |
| `DEV_BACK_OFFICE_USER_PASSWORD`  |      ✅      | back_office_risk user password                                                                                                                                  |
| `DEV_FRONT_OFFICE_USER_EMAIL`    |      ✅      | front_office user email — used by login and logout specs                                                                                                        |
| `DEV_FRONT_OFFICE_USER_PASSWORD` |      ✅      | front_office user password                                                                                                                                      |
| `DEV_SUPPORT_USER_EMAIL`         |      ✅      | support_user email — used by logout spec                                                                                                                        |
| `DEV_SUPPORT_USER_PASSWORD`      |      ✅      | support_user password                                                                                                                                           |
| `DEV_AUDIT_USER_EMAIL`           |      ✅      | auditor user email — used by logout spec                                                                                                                        |
| `DEV_AUDIT_USER_PASSWORD`        |      ✅      | auditor user password                                                                                                                                           |
| `DEV_LCO_USER_EMAIL`             |      ✅      | leasing_company_user email — used by logout spec (landing `/lc`)                                                                                                |
| `DEV_LCO_USER_PASSWORD`          |      ✅      | leasing_company_user password                                                                                                                                   |
| `TEST_INVALID_EMAIL`             |      ✅      | A non-existent email used in negative credential tests                                                                                                          |
| `TEST_INVALID_PASSWORD`          |      ✅      | An intentionally wrong password for negative test cases                                                                                                         |
| `FIGMA_API_KEY`                  |      ✅      | Figma personal access token — used by the `qa-lead` agent's `figma-design-extractor` skill                                                                      |
| `TEST_AUDITOR_EMAIL`             |    future    | Email for `auditorPage` fixture (legacy fixture — currently superseded by `createTestSession` + `DEV_AUDIT_USER_EMAIL`)                                         |
| `TEST_AUDITOR_PASSWORD`          |    future    | Password for above                                                                                                                                              |

Auth state (cookies saved after gate login) is written to `.auth/gate.json` at runtime by `setup/gate.setup.ts` and loaded automatically by the `chromium` project. Never commit `.auth/`.

### Fixture Import Rule

ESLint enforces that **all spec and page files import `test` and `expect` from `../fixtures/test`**, never directly from `@playwright/test`. This is a hard lint error.

```ts
// ✅ correct — from specs/ or pages/ (one level below e2e/)
import { test, expect } from "../fixtures/test"

// ❌ will fail lint
import { test, expect } from "@playwright/test"
```

`fixtures/test.ts` also re-exports `Page` and `Locator` types from Playwright so POM files can import them from the same single source:

```ts
// ✅ correct — POM constructor typing
import type { Locator, Page } from "../fixtures/test"
```

`fixtures/test.ts` is already implemented. It extends Playwright's base `test` with the following fixtures:

| Fixture             | Type | Description                                                                                       |
| ------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `loginPage`         | POM  | `LoginPage` instance bound to the current `page`                                                  |
| `authenticatedPage` | Page | Pre-authenticated system_admin session loaded from `.auth/user.json` (written by `auth.setup.ts`) |
| `bankProcessorPage` | Page | front_office session created via live login (uses `TEST_BANK_USER_EMAIL/PASSWORD`)                |
| `lcUserPage`        | Page | leasing_company_user session via live login — lands at `/workspace`                               |
| `auditorPage`       | Page | auditor session via live login (uses `TEST_AUDITOR_EMAIL/PASSWORD`)                               |

Add a new fixture there whenever a new role or shared POM instance is needed — do not construct auth inline in specs. Prefer `createTestSession()` from `helpers/helper.ts` for inline isolated sessions (as used in `prd1042-69`). See `.claude/skills/playwright-architect/SKILL.md` for the canonical fixture template.

No explicit `any` is permitted in any E2E file (`@typescript-eslint/no-explicit-any: error`).

### Spec and POM Naming Conventions

| Artifact    | Pattern                        | Example                         |
| ----------- | ------------------------------ | ------------------------------- |
| Spec folder | `specs/<EpicSlug>/`            | `specs/User_Management&Login/`  |
| Spec file   | `<story-id>-<slug>.spec.ts`    | `prd1042-43-user-login.spec.ts` |
| POM file    | `<FeatureName>Page.ts`         | `LoginPage.ts`                  |
| POM class   | `<FeatureName>Page`            | `LoginPage`                     |
| Locator     | `camelCase` noun as `readonly` | `emailInput`, `submitButton`    |
| POM method  | `camelCase` verb phrase        | `login()`, `submitAndWait()`    |

Story ID in the spec filename is always lowercased (`prd1042-43`, not `PRD1042-43`). The slug is the story title subject in kebab-case (e.g. `User Login` → `user-login`). Specs are grouped under a subfolder named after the epic (e.g. `User_Management&Login/`) — match the subfolder to the epic being tested; create a new subfolder when starting a new epic.

### Page Object Model Conventions

- One POM class per feature area — if a POM for the feature already exists, add new locators and methods to it rather than creating a second file
- Locators are `readonly` class properties defined in the constructor; use `getByTestId` as the primary strategy, `getByRole` when a `data-testid` is unavailable — never CSS class or Tailwind selectors
- No assertions inside POM methods — assertions belong in the spec; methods encapsulate interactions only

### Environment

Auth state and secrets are never committed. The pattern file `.env.e2e.example` at src/ root documents required env vars. The `.auth/` directory (Playwright storage state) is git-ignored.

### Blocking Dependencies (resolve before writing specs)

These backend capabilities must be agreed with the dev team before the corresponding specs can be authored:

| ID  | What is needed                                                     | Blocks                                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| D16 | `TEST_TOKEN_TTL_SECONDS` env override                              | `session-management.spec.ts`                           |
| D17 | `TEST_JWT_SECRET` or test-forge endpoint for tampered/expired JWTs | `login.spec.ts` AC-14                                  |
| D18 | Admin API to reset lockout counter per email                       | `account-lockout.spec.ts`                              |
| D19 | Throwaway user creation/deletion API                               | lockout, expiry, invitation specs                      |
| D20 | Second seeded Bank Tenant B with one test user                     | `tenant-isolation.spec.ts`                             |
| D21 | `AUDITOR_VALIDITY_MINUTES` env override                            | `auditor-access.spec.ts`, `temp-access-expiry.spec.ts` |

Specs blocked by an open dependency are written as `test.fixme('…', …)` with the dependency ID in a comment — not skipped or deleted.

### QA Pipeline (qa-lead Agent)

The `.claude/agents/qa-lead.md` defines a 4-stage pipeline agent that turns Jira stories into BDD test suites. Run it by invoking the `qa-lead` agent in Claude Code.

| Stage | Skill                            | Input                       | Output                                                     |
| ----- | -------------------------------- | --------------------------- | ---------------------------------------------------------- |
| 1     | `jira-story-extractor`           | Story IDs / JQL             | Structured story objects with ACs, DoR status              |
| 2     | `figma-design-extractor`         | Figma URL(s) from story     | Screen names, component hierarchy, interactive states      |
| 3     | `requirements-design-comparator` | Stage 1 + Stage 2 output    | Mismatch report (CRITICAL / MAJOR / MINOR)                 |
| 4     | `manual-test-suite-generator`    | Stage 1–3 output            | Gherkin `.md` file saved to `tests/<Epic>/<ID> <Title>.md` |
| 5     | `playwright-architect`           | Gherkin `.md` from `tests/` | `.spec.ts` in `specs/` + POM class in `pages/`             |

- Stages 2 and 3 are skipped automatically when no Figma URL is attached to the story.
- Stage 4 is blocked if Stage 3 produces a CRITICAL mismatch.
- Stories that fail DoR (missing ACs, Backlog/Draft status) are excluded before Stage 2.
- Stage 5 (`playwright-architect`) is invoked separately — provide a story ID or path to a `.md` file. It reads the Gherkin and writes both the spec and POM. If either file already exists it merges new scenarios in rather than overwriting. Full rules in `.claude/skills/playwright-architect/SKILL.md`.

The agent maintains persistent memory in `.claude/agent-memory/qa-lead/` — story processing decisions, design conventions, and blocked dependency state are recorded there across conversations.
