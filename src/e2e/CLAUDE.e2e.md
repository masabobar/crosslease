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
pnpm e2e:report                                   # Open last HTML report

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
├── fixtures/        # Custom Playwright fixture definitions (empty — create test.ts before authoring specs)
├── helpers/         # Reusable utilities: auth, data builders, API helpers (empty)
├── pages/           # Page Object Model classes, one file per feature area (empty)
├── specs/           # Test specifications, one file per user story / AC group (empty)
├── CLAUDE.e2e.md    # This file
└── playwright.config.ts
```

> **Status:** All subdirectories exist but are empty. The first file to create is `fixtures/test.ts` — it re-exports (and extends) `test` and `expect` from `@playwright/test` and is the **only** permitted import source for specs and page objects. No spec can be authored until this file exists.

### App Architecture Relevant to E2E

The app is a React 19 SPA (Vite dev server on port 5173 by default, Nginx on port 3000 in production). The backend is a separate FastAPI service configured via `VITE_API_URL`.

- **Routing:** React Router v7 — test navigation by URL path, not by clicking nav links
- **Async data:** TanStack Query v5 — await network idle or a visible loading indicator before asserting on data-driven content; don't poll with `waitForTimeout`
- **UI components:** shadcn/ui primitives built on Base UI — locators should use `getByRole` with the ARIA role/label, not class names or Tailwind utilities
- **Feature structure:** `src/features/<feature>/` (pattern established, currently empty) — one POM per feature area mirrors this layout

### Environment Variables

Copy `.env.example` to `.env.e2e` (git-ignored) and fill in values before running E2E locally:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (default `http://localhost:8000`) |
| `STAGING_BASE_URL` | Staging login entry point — used when running against staging |

Auth state (tokens, cookies) is stored in `.auth/` (git-ignored) via Playwright's `storageState`. Never commit `.auth/`.

### Fixture Import Rule

ESLint enforces that **all spec and page files import `test` and `expect` from `../../fixtures/test`**, never directly from `@playwright/test`. This is a hard lint error. `src/e2e/fixtures/test.ts` is the single re-export/extension point — create it before authoring any specs.

> **Known ESLint pattern mismatch:** `eslint.config.js` uses `files: ['e2e/**/*.ts']` but files live under `src/e2e/`. The lint rule currently does **not** fire. Fix by changing the pattern to `src/e2e/**/*.ts` in `eslint.config.js`.

```ts
// ✅ correct
import { test, expect } from '../../fixtures/test'

// ❌ will fail lint
import { test, expect } from '@playwright/test'
```

No explicit `any` is permitted in any E2E file (`@typescript-eslint/no-explicit-any: error`).

### Page Object Model Conventions

- One POM class per feature area (e.g., `LoginPage`, `UserManagementPage`)
- Locators are defined as class properties using `page.getByRole` / `page.getByTestId` — prefer accessible locators over CSS selectors
- POM methods encapsulate multi-step interactions and assertions; specs read as business-level flows

### Environment

Auth state and secrets are never committed. The pattern file `.env.e2e.example` at the repo root documents required env vars. The `.auth/` directory (Playwright storage state) is git-ignored.

### Blocking Dependencies (resolve before writing specs)

These backend capabilities must be agreed with the dev team before the corresponding specs can be authored:

| ID | What is needed | Blocks |
|---|---|---|
| D16 | `TEST_TOKEN_TTL_SECONDS` env override | `session-management.spec.ts` |
| D17 | `TEST_JWT_SECRET` or test-forge endpoint for tampered/expired JWTs | `login.spec.ts` AC-14 |
| D18 | Admin API to reset lockout counter per email | `account-lockout.spec.ts` |
| D19 | Throwaway user creation/deletion API | lockout, expiry, invitation specs |
| D20 | Second seeded Bank Tenant B with one test user | `tenant-isolation.spec.ts` |
| D21 | `AUDITOR_VALIDITY_MINUTES` env override | `auditor-access.spec.ts`, `temp-access-expiry.spec.ts` |

Specs blocked by an open dependency are written as `test.fixme('…', …)` with the dependency ID in a comment — not skipped or deleted.
