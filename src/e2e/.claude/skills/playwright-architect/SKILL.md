---
name: playwright-architect
description: "Convert Gherkin BDD test suites from src/e2e/tests/ into executable Playwright spec files and Page Object Model classes. Reads Given-When-Then scenario and generates a matching .spec.ts in src/e2e/specs/ and a POM class in src/e2e/pages/. Enforces the fixture import rule, getByRole/getByTestId locator strategy, and marks blocked scenarios with test.fixme. Never writes to src/e2e/tests/ — that directory is read-only input."
allowed-tools: Read, Write, Bash, TaskCreate, TaskUpdate
model: sonnet
---

# playwright-architect

Convert Gherkin BDD scenarios into executable Playwright TypeScript specs and POM classes.

## Invocation

Called with a story ID (e.g. `PRD1042-43`) or a path to a generated `.md` file in `src/e2e/tests/`. Reads the Gherkin scenarios from that file and produces two outputs per story:

1. **POM class** → `src/e2e/pages/<FeatureName>Page.ts`
2. **Playwright spec** → `src/e2e/specs/<story-id>-<slug>.spec.ts`

If either file already exists, merge new scenarios in — do not overwrite existing passing tests.

---

## Input

The `.md` files in `src/e2e/tests/` follow this structure:

- Header block: story ID, epic, DoR status, ACs covered, blocked ACs
- Scope filter table: each AC labelled `happy-path`, `main-error`, `edge-case`, `separate-feature`, or `Blocked`
- Gherkin blocks: one `Feature` / `Scenario` / `Scenario Outline` per AC group
- Blocked ACs are listed in the header only — no Gherkin block exists for them

---

## Output: POM class

**Location:** `src/e2e/pages/<FeatureName>Page.ts`
**Naming:** derive `FeatureName` from the story title subject (e.g. `User Login` → `LoginPage`, `User Management` → `UserManagementPage`)

### POM structure rules

- One class per feature area — if a POM for this feature already exists, add new locators and methods to it rather than creating a second file
- Locators are `readonly` class properties defined in the constructor using this priority order:
  1. `page.getByRole(role, { name })` — preferred for buttons, inputs, links, headings
  2. `page.getByTestId('descriptor')` — when a `data-testid` is known or specified
  - Never use CSS class selectors or Tailwind utility classes as locators
- Methods encapsulate multi-step interactions; specs call methods, not raw locators
- No assertions inside POM methods — assertions belong in the spec

### POM template

```ts
import type { Locator, Page } from "../fixtures/test"

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByRole("textbox", { name: /email/i })
    this.passwordInput = page.getByRole("textbox", { name: /password/i })
    this.submitButton = page.getByRole("button", { name: /log in|sign in/i })
    this.errorMessage = page.getByRole("alert")
  }

  async goto() {
    await this.page.goto("/login")
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

---

## fixtures/test.ts — canonical template

`src/e2e/fixtures/test.ts` is the **single re-export and extension point** for all specs and POMs. It must exist and be fully implemented before any spec file can be authored. The placeholder `fixture.ts` in the repo must be renamed to `test.ts` and replaced with this implementation.

The file extends Playwright's base `test` with project-specific fixtures — authenticated sessions per role, shared POM instances, and API helpers. Specs receive these fixtures via destructuring and never set up auth themselves.

```ts
import { test as base, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

// Fixture types — extend as new POMs are added
type Fixtures = {
  loginPage: LoginPage
  authenticatedPage: Page // pre-authenticated as the default test user
  bankProcessorPage: Page // pre-authenticated as bank front_office role
  lcUserPage: Page // pre-authenticated as leasing_company_user role
  auditorPage: Page // pre-authenticated as auditor role
}

export const test = base.extend<Fixtures>({
  // Instantiate LoginPage for the current page
  // "provide" avoids triggering react-hooks/rules-of-hooks on the Playwright fixture callback
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page))
  },

  // Pre-authenticated session — bank front_office user (default for most specs)
  // Reads credentials from process.env; never hardcodes secrets
  authenticatedPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_BANK_USER_EMAIL ?? "",
      process.env.TEST_BANK_USER_PASSWORD ?? ""
    )
    await page.waitForURL("/dashboard")
    await provide(page)
    await context.close()
  },

  // Pre-authenticated session — leasing_company_user role
  lcUserPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_LC_USER_EMAIL ?? "",
      process.env.TEST_LC_USER_PASSWORD ?? ""
    )
    await page.waitForURL("/workspace")
    await provide(page)
    await context.close()
  },

  // Pre-authenticated session — auditor role
  auditorPage: async ({ browser }, provide) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      process.env.TEST_AUDITOR_EMAIL ?? "",
      process.env.TEST_AUDITOR_PASSWORD ?? ""
    )
    await page.waitForURL("/dashboard")
    await provide(page)
    await context.close()
  },
})

// Re-export expect unchanged — specs import both from this file
export { expect }
```

### Rules for maintaining fixtures/test.ts

- Add a new fixture for each role that needs a dedicated pre-auth session
- Credentials always come from `process.env` — no hardcoded values in fixture bodies
- Name the Playwright fixture callback `provide` (not `use`) — `use` triggers `react-hooks/rules-of-hooks` as a false positive
- Each fixture opens its own `BrowserContext` and closes it after `provide()` — never share context between fixtures
- As new POM classes are added, add a corresponding fixture so specs receive them directly rather than constructing inline
- The `storageState` approach (saving auth to `.auth/`) is commented out in `playwright.config.ts` pending D17 — do not enable it until that dependency is resolved; use the inline login approach above in the interim

---

## Output: Playwright spec

**Location:** `src/e2e/specs/<story-id>-<slug>.spec.ts`
**Naming:** `<story-id>` is the Jira ID lowercased (e.g. `prd1042-43`), `<slug>` is the title subject kebab-cased (e.g. `user-login`)
**Example:** `src/e2e/specs/prd1042-43-user-login.spec.ts`

### Spec structure rules

- **Import `test` and `expect` exclusively from `../fixtures/test`** — never from `@playwright/test` directly (hard lint error)
- One `test.describe` block per Feature in the Gherkin file, tagged with the story ID
- Each `Scenario` becomes one `test()` call; each `Scenario Outline` becomes `test.each()`
- Gherkin `Background` steps become `test.beforeEach()`
- Blocked scenarios (no Gherkin block in the `.md`) become `test.fixme()` with the dependency ID in a comment
- No `any` in any spec or POM file
- Do not use `waitForTimeout` — await network idle or visible elements instead

### Fixture import rule (enforced)

```ts
// correct — always
import { test, expect } from "../fixtures/test"

// will fail lint — never
import { test, expect } from "@playwright/test"
```

### Spec template

```ts
import { test, expect } from "../fixtures/test"
import { LoginPage } from "../pages/LoginPage"

test.describe("PRD1042-43 — User Login", () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  // AC-03 / AC-04 / AC-06 / AC-07 — happy path
  const roles = [
    {
      role: "system_admin",
      email: process.env.TEST_ADMIN_EMAIL ?? "",
      landing: "/dashboard",
    },
    {
      role: "front_office",
      email: process.env.TEST_FO_EMAIL ?? "",
      landing: "/dashboard",
    },
    {
      role: "back_office_risk",
      email: process.env.TEST_BO_EMAIL ?? "",
      landing: "/dashboard",
    },
    {
      role: "support_user",
      email: process.env.TEST_SUPPORT_EMAIL ?? "",
      landing: "/dashboard",
    },
    {
      role: "auditor",
      email: process.env.TEST_AUDITOR_EMAIL ?? "",
      landing: "/dashboard",
    },
    {
      role: "leasing_company_user",
      email: process.env.TEST_LC_USER_EMAIL ?? "",
      landing: "/workspace",
    },
  ]

  for (const { role, email, landing } of roles) {
    test(`valid credentials redirect ${role} to ${landing} (AC-03, AC-04, AC-06, AC-07)`, async ({
      page,
    }) => {
      await loginPage.login(email, process.env.TEST_VALID_PASSWORD ?? "")
      await expect(page).toHaveURL(landing)
    })
  }

  // AC-08 — invalid credentials
  test("wrong password shows generic error without revealing account existence (AC-08)", async () => {
    await loginPage.login(
      process.env.TEST_FO_EMAIL ?? "",
      process.env.TEST_INVALID_PASSWORD ?? ""
    )
    await expect(loginPage.errorMessage).toBeVisible()
    await expect(loginPage.errorMessage).not.toContainText("password")
  })
})
```

---

## Blocked scenario handling

For every AC listed in the header as blocked (no Gherkin block generated), add a `test.fixme()` entry:

```ts
// Dependency ID from the blocking-dependencies table in CLAUDE.e2e.md
test.fixme("session expires after inactivity timeout (AC-17)", async () => {
  // D16: TEST_TOKEN_TTL_SECONDS env override not yet available
})
```

Use the dependency ID (D16–D21) from `CLAUDE.e2e.md` — not a free-form note.

---

## Async data conventions

The app uses TanStack Query v5. After an action that triggers a server request:

```ts
// wait for network idle — preferred
await page.waitForLoadState("networkidle")

// or wait for a specific element to appear
await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible()

// never use fixed timeouts
await page.waitForTimeout(2000) // ❌
```

---

## Naming conventions summary

| Artifact         | Pattern                     | Example                                    |
| ---------------- | --------------------------- | ------------------------------------------ |
| POM file         | `PascalCase` + `Page.ts`    | `LoginPage.ts`                             |
| POM class        | `PascalCase` + `Page`       | `LoginPage`                                |
| Spec file        | `<story-id>-<slug>.spec.ts` | `prd1042-43-user-login.spec.ts`            |
| Locator property | `camelCase` noun            | `emailInput`, `submitButton`               |
| POM method       | `camelCase` verb phrase     | `login()`, `fillForm()`, `submitAndWait()` |

---

## Code style enforcement

All generated POM classes and spec files must conform to the project's ESLint and Prettier configuration before being considered complete.

### Rules to follow when generating code

- **Indentation:** 2 spaces — no tabs
- **Quotes:** double quotes for strings (Prettier enforced)
- **Trailing commas:** ES5 style — trailing comma after the last item in multi-line arrays, objects, and parameter lists
- **Semicolons:** always present
- **Import order:** type imports (`import type`) before value imports; grouped by external → internal (`@/` alias) → relative
- **No unused variables or imports** — remove any import that is not referenced in the file
- **No `any`** — use `unknown` + narrowing, or a proper Playwright/TypeScript type

### Post-generation verification

After writing each file, run the following commands from the repo root and fix any reported issues before returning:

```bash
pnpm lint          # ESLint — must exit with 0 warnings and 0 errors
pnpm type-check    # TypeScript — must pass with no errors
```

If either command fails, fix the violations in the generated file and re-run before marking the task complete. Do not suppress lint errors with `// eslint-disable` comments.

---

## Pre-flight checklist before writing files

1. `src/e2e/fixtures/test.ts` exists — if it only contains `// code here`, do not write specs yet; flag this as a blocker
2. Check if a POM for this feature already exists in `src/e2e/pages/` — merge, don't duplicate
3. Check if a spec for this story already exists in `src/e2e/specs/` — merge new tests in
4. Every blocked AC from the `.md` header has a corresponding `test.fixme()` in the spec
5. No `import { test, expect } from '@playwright/test'` — only from `../../fixtures/test`
6. No `any` in any generated file
7. After writing all files: `pnpm lint` and `pnpm type-check` pass with zero errors
